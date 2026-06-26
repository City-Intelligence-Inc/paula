import { GetCommand, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import {
  resolveActor,
  forbidden,
  tutorScopeForStudent,
  noteForActor,
} from "@/lib/server/access";
import type { Student, Session } from "@/lib/types";

// Session Notes API (FEATURE_LIST N-1..N-9). Notes are session items of
// type:"session-note" in the sessions table (PK studentId, SK dateTime), one
// per student per session. A group session fans out into one item per student
// sharing a `noteGroupId`; the three shared fields carry identical content,
// `privateNotes` stays per-student. Reads are field-gated by role: parents and
// students only ever receive sessionActivities + publicNotes.

async function authorize(id: string) {
  const { actor, response } = await resolveActor();
  if (response) return { response };
  const a = actor!;
  if (a.isAdmin) return { actor: a, scope: "full" as const };
  if (a.role === "tutor" && a.tutor) {
    const s = await ddb().send(
      new GetCommand({ TableName: Tables.students, Key: { id } }),
    );
    if (!s.Item)
      return {
        response: Response.json({ error: "Student not found" }, { status: 404 }),
      };
    const scope = tutorScopeForStudent(
      s.Item as Pick<Student, "tutorIds" | "tutorAccess">,
      a.tutor.id,
    );
    if (scope === "none")
      return { response: forbidden("You are not assigned to this student.") };
    return { actor: a, scope };
  }
  // Parents/students do NOT read through this staff/tutor route — their
  // family-facing view resolves the student from the family link on the
  // dashboard path (Ari). Deny here so this route can't leak across families.
  return { response: forbidden() };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authz = await authorize(id);
  if (authz.response) return authz.response;
  const actor = authz.actor!;

  const result = await ddb().send(
    new QueryCommand({
      TableName: Tables.sessions,
      KeyConditionExpression: "studentId = :sid",
      FilterExpression: "#t = :sn",
      ExpressionAttributeNames: { "#t": "type" },
      ExpressionAttributeValues: { ":sid": id, ":sn": "session-note" },
    }),
  );

  let notes = ((result.Items as Session[]) || []).sort((a, b) =>
    (b.dateTime || "").localeCompare(a.dateTime || ""),
  );

  // A "limited" class instructor only sees notes they authored (5/17 Paula).
  if (authz.scope === "limited") {
    notes = notes.filter((n) => n.createdBy === actor.userId);
  }

  // Field-level visibility: strip staff-only fields for non-staff (N-9).
  const visible = notes.map((n) => noteForActor(actor, n));
  return Response.json({ notes: visible });
}

interface NoteBody {
  dateTime?: string; // omit to create a new session note at "now"
  durationMin?: number;
  sessionPlan?: string;
  privateNotes?: string;
  sessionActivities?: string;
  publicNotes?: string;
  noteGroupId?: string;
  readyToNotify?: boolean;
}

// Create or update (upsert) a session note. PUT and POST share this — the
// natural key is studentId + dateTime, so re-submitting the same session
// edits it in place (notes are editable, not append-only).
async function upsert(
  request: Request,
  id: string,
): Promise<Response> {
  const authz = await authorize(id);
  if (authz.response) return authz.response;
  const actor = authz.actor!;
  // Only tutors + admins author/edit (R-4: office staff view-only on notes is
  // enforced upstream; tutors here are scope-checked). Parents/students never.
  if (!actor.isAdmin && actor.role !== "tutor") {
    return forbidden("Only tutors and admins can write session notes.");
  }
  if (authz.scope === "limited") {
    // A limited instructor may still log their own group-session notes.
  }

  let body: NoteBody;
  try {
    body = (await request.json()) as NoteBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dateTime = body.dateTime || new Date().toISOString();
  const existing = await ddb().send(
    new GetCommand({
      TableName: Tables.sessions,
      Key: { studentId: id, dateTime },
    }),
  );
  const prev = (existing.Item as Session) || {};

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

  try {
    await ddb().send(new PutCommand({ TableName: Tables.sessions, Item: note }));
    return Response.json({ note }, { status: existing.Item ? 200 : 201 });
  } catch (err) {
    console.error("[session-notes upsert] failed:", err);
    return Response.json(
      { error: "Save failed", detail: String(err) },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return upsert(request, id);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return upsert(request, id);
}
