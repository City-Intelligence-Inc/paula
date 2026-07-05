// Session-notes core logic — extracted from the route so it can be integration
// tested against a real (local dynalite) DynamoDB without Clerk or Next request
// objects. Same pattern as session-notify.ts (pure logic split from the I/O
// shell). The route is a thin wrapper: it resolves the Clerk actor, then calls
// these with the real ddb() client + Tables.
//
// Only `import type` is used for our own modules, so there are no runtime "@/"
// imports — node --test can load this file directly.
import {
  GetCommand,
  QueryCommand,
  PutCommand,
  DeleteCommand,
  type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import type { Session, Student } from "@/lib/types";

export interface NoteActor {
  userId: string;
  role: "master_admin" | "admin" | "tutor" | "parent";
  isAdmin: boolean; // master_admin || admin (office staff)
  isMaster: boolean; // master_admin only (super admin)
  tutorId?: string; // set when role === "tutor"
}

export interface NoteDeps {
  db: DynamoDBDocumentClient;
  tables: { sessions: string; students: string };
}

export interface CoreResult {
  status: number;
  body: unknown;
}

const deny = (status: number, error: string): CoreResult => ({
  status,
  body: { error },
});

// Tutor's scope on a student (mirrors access.tutorScopeForStudent).
function tutorScope(
  student: Pick<Student, "tutorIds" | "tutorAccess">,
  tutorId: string,
): "none" | "full" | "limited" {
  if (!(student.tutorIds || []).includes(tutorId)) return "none";
  const entry = (student.tutorAccess || []).find((a) => a.tutorId === tutorId);
  return entry?.scope === "limited" ? "limited" : "full";
}

// Strip staff-only fields for non-staff (mirrors access.noteForActor).
function visibleFor(actor: NoteActor, note: Session): Session {
  if (actor.isAdmin || actor.role === "tutor") return note;
  const { sessionPlan: _sp, privateNotes: _pn, ...rest } = note;
  void _sp;
  void _pn;
  return rest as Session;
}

// Resolve read/write scope for the actor on this student.
async function authorize(
  actor: NoteActor,
  id: string,
  deps: NoteDeps,
): Promise<{ scope: "full" | "limited" } | { deny: CoreResult }> {
  if (actor.isAdmin) return { scope: "full" };
  if (actor.role === "tutor" && actor.tutorId) {
    const s = await deps.db.send(
      new GetCommand({ TableName: deps.tables.students, Key: { id } }),
    );
    if (!s.Item) return { deny: deny(404, "Student not found") };
    const scope = tutorScope(
      s.Item as Pick<Student, "tutorIds" | "tutorAccess">,
      actor.tutorId,
    );
    if (scope === "none")
      return { deny: deny(403, "You are not assigned to this student.") };
    return { scope };
  }
  // Parents/students do not read/write through this staff/tutor path.
  return { deny: deny(403, "Forbidden") };
}

export async function listSessionNotes(
  actor: NoteActor,
  id: string,
  deps: NoteDeps,
): Promise<CoreResult> {
  const authz = await authorize(actor, id, deps);
  if ("deny" in authz) return authz.deny;

  const result = await deps.db.send(
    new QueryCommand({
      TableName: deps.tables.sessions,
      KeyConditionExpression: "studentId = :sid",
      FilterExpression: "#t = :sn",
      ExpressionAttributeNames: { "#t": "type" },
      ExpressionAttributeValues: { ":sid": id, ":sn": "session-note" },
    }),
  );
  let notes = ((result.Items as Session[]) || []).sort((a, b) =>
    (b.dateTime || "").localeCompare(a.dateTime || ""),
  );
  if (authz.scope === "limited") {
    notes = notes.filter((n) => n.createdBy === actor.userId);
  }
  return { status: 200, body: { notes: notes.map((n) => visibleFor(actor, n)) } };
}

export interface NoteUpsertBody {
  dateTime?: string;
  durationMin?: number;
  sessionPlan?: string;
  privateNotes?: string;
  sessionActivities?: string;
  publicNotes?: string;
  noteGroupId?: string;
  readyToNotify?: boolean;
}

export async function upsertSessionNote(
  actor: NoteActor,
  id: string,
  body: NoteUpsertBody,
  deps: NoteDeps,
): Promise<CoreResult> {
  const authz = await authorize(actor, id, deps);
  if ("deny" in authz) return authz.deny;

  // Only Tutors + Super Admin author/edit (#4). Office staff (isAdmin but not
  // isMaster) are view-only on notes.
  if (!actor.isMaster && actor.role !== "tutor") {
    return deny(403, "Only tutors and the super admin can write session notes.");
  }

  const dateTime = body.dateTime || new Date().toISOString();
  const existing = await deps.db.send(
    new GetCommand({
      TableName: deps.tables.sessions,
      Key: { studentId: id, dateTime },
    }),
  );
  const prev = (existing.Item as Session) || ({} as Session);

  const note: Session = {
    ...prev,
    studentId: id,
    dateTime,
    date: dateTime.slice(0, 10),
    time: dateTime.slice(11, 16),
    duration: body.durationMin ?? prev.duration ?? 60,
    type: "session-note",
    status: prev.status ?? "completed",
    sessionPlan: body.sessionPlan ?? prev.sessionPlan ?? "",
    privateNotes: body.privateNotes ?? prev.privateNotes ?? "",
    sessionActivities: body.sessionActivities ?? prev.sessionActivities ?? "",
    publicNotes: body.publicNotes ?? prev.publicNotes ?? "",
    noteGroupId: body.noteGroupId ?? prev.noteGroupId,
    readyToNotify: body.readyToNotify ?? prev.readyToNotify ?? false,
    createdBy: prev.createdBy ?? actor.userId,
    updatedAt: new Date().toISOString(),
  } as Session;

  await deps.db.send(
    new PutCommand({ TableName: deps.tables.sessions, Item: note }),
  );
  return { status: existing.Item ? 200 : 201, body: { note } };
}

// Delete a session note. Super admin: any note. Tutor: full-scope tutors can
// delete any note on their student; limited-scope (class) tutors only their
// own. Office staff are view-only on notes (same rule as upsert).
export async function deleteSessionNote(
  actor: NoteActor,
  id: string,
  dateTime: string,
  deps: NoteDeps,
): Promise<CoreResult> {
  const authz = await authorize(actor, id, deps);
  if ("deny" in authz) return authz.deny;
  if (!actor.isMaster && actor.role !== "tutor") {
    return deny(403, "Only tutors and the super admin can delete session notes.");
  }
  if (!dateTime) return deny(400, "dateTime is required");

  const existing = await deps.db.send(
    new GetCommand({
      TableName: deps.tables.sessions,
      Key: { studentId: id, dateTime },
    }),
  );
  const note = existing.Item as Session | undefined;
  if (!note || note.type !== "session-note") {
    return deny(404, "Session note not found");
  }
  if (
    actor.role === "tutor" &&
    authz.scope === "limited" &&
    note.createdBy !== actor.userId
  ) {
    return deny(403, "Class instructors can only delete their own notes.");
  }

  await deps.db.send(
    new DeleteCommand({
      TableName: deps.tables.sessions,
      Key: { studentId: id, dateTime },
    }),
  );
  return { status: 200, body: { deleted: { studentId: id, dateTime } } };
}

// N-5: a parent's reply on a completed session. Parents may only touch notes
// on their own children — the route resolves that set (family membership) and
// passes it in, so the core stays table-agnostic beyond sessions/students.
export async function setFamilyReply(
  actor: NoteActor,
  parentStudentIds: string[],
  id: string,
  body: { dateTime?: string; familyReply?: string },
  deps: NoteDeps,
): Promise<CoreResult> {
  if (actor.isAdmin || actor.role === "tutor") {
    return deny(403, "Replies belong to the family — staff write in the note fields.");
  }
  if (!parentStudentIds.includes(id)) {
    return deny(403, "You can only reply on your own child's sessions.");
  }
  const dateTime = body.dateTime || "";
  if (!dateTime) return deny(400, "dateTime is required");

  const existing = await deps.db.send(
    new GetCommand({
      TableName: deps.tables.sessions,
      Key: { studentId: id, dateTime },
    }),
  );
  const note = existing.Item as Session | undefined;
  if (!note || note.type !== "session-note") {
    return deny(404, "Session note not found");
  }

  const updated: Session = {
    ...note,
    familyReply: String(body.familyReply ?? "").slice(0, 4000),
    familyReplyAt: new Date().toISOString(),
    familyReplyBy: actor.userId,
  };
  await deps.db.send(
    new PutCommand({ TableName: deps.tables.sessions, Item: updated }),
  );
  return { status: 200, body: { note: visibleFor(actor, updated) } };
}
