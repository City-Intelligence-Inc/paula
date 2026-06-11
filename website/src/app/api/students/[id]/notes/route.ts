import { GetCommand, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden, tutorScopeForStudent } from "@/lib/server/access";
import type { Student } from "@/lib/types";

// Resolve whether the actor may touch this student's notes. Returns the
// tutor's scope ("full"/"limited") so the caller can narrow what's returned,
// or a Response to short-circuit on a 401/403/404.
async function authorizeNotes(id: string) {
  const { actor, response } = await resolveActor();
  if (response) return { response };
  const a = actor!;
  if (a.isAdmin) return { actor: a, scope: "full" as const };
  if (a.role === "tutor" && a.tutor) {
    const s = await ddb().send(
      new GetCommand({ TableName: Tables.students, Key: { id } }),
    );
    if (!s.Item) return { response: Response.json({ error: "Student not found" }, { status: 404 }) };
    const scope = tutorScopeForStudent(
      s.Item as Pick<Student, "tutorIds" | "tutorAccess">,
      a.tutor.id,
    );
    if (scope === "none") return { response: forbidden("You are not assigned to this student.") };
    return { actor: a, scope };
  }
  return { response: forbidden() };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authz = await authorizeNotes(id);
  if (authz.response) return authz.response;

  const result = await ddb().send(
    new QueryCommand({
      TableName: Tables.sessions,
      KeyConditionExpression: "studentId = :sid",
      FilterExpression: "#t = :note",
      ExpressionAttributeNames: { "#t": "type" },
      ExpressionAttributeValues: { ":sid": id, ":note": "note" },
    }),
  );
  let notes = (result.Items || []).sort((a, b) =>
    (b.dateTime as string).localeCompare(a.dateTime as string),
  );
  // A "limited" class instructor only sees the notes they authored — never
  // the private 1:1 record (5/17 Paula).
  if (authz.scope === "limited") {
    notes = notes.filter((n) => n.createdBy === authz.actor!.userId);
  }
  return Response.json({ notes });
}

interface NoteBody {
  content?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authz = await authorizeNotes(id);
  if (authz.response) return authz.response;

  let body: NoteBody;
  try {
    body = (await request.json()) as NoteBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.content || !body.content.trim()) {
    return Response.json({ error: "content required" }, { status: 400 });
  }

  const now = new Date();
  const dateTime = now.toISOString();
  const note = {
    studentId: id,
    dateTime,
    date: dateTime.slice(0, 10),
    time: dateTime.slice(11, 16),
    type: "note" as const,
    content: body.content.trim(),
    createdBy: authz.actor!.userId,
    createdAt: dateTime,
  };

  try {
    await ddb().send(
      new PutCommand({ TableName: Tables.sessions, Item: note }),
    );
    return Response.json({ note }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/students/[id]/notes] failed:", err);
    return Response.json(
      { error: "Create failed", detail: String(err) },
      { status: 500 },
    );
  }
}
