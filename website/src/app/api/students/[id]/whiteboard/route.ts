import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden, tutorScopeForStudent } from "@/lib/server/access";
import type { Student } from "@/lib/types";

// POST /api/students/[id]/whiteboard
// Returns the student's shared-whiteboard room URL, creating a persistent one
// on first use (tldraw multiplayer room — no Miro fee, 5/9 Paula). Creating it
// also auto-posts the link into the student's notes so it lands in the session
// log automatically. Admins + assigned tutors only.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  const a = actor!;
  const { id } = await params;

  const sRes = await ddb().send(
    new GetCommand({ TableName: Tables.students, Key: { id } }),
  );
  const student = sRes.Item as Student | undefined;
  if (!student) return Response.json({ error: "Student not found" }, { status: 404 });

  // Authorization: admins, or a tutor assigned to this student (any scope).
  if (!a.isAdmin) {
    if (a.role !== "tutor" || !a.tutor) return forbidden();
    if (tutorScopeForStudent(student, a.tutor.id) === "none") {
      return forbidden("You are not assigned to this student.");
    }
  }

  if (student.whiteboardUrl) {
    return Response.json({ whiteboardUrl: student.whiteboardUrl, created: false });
  }

  // Generate a stable room id from the student's id + a short random tail.
  const slug = id.replace(/^stu_/, "").replace(/[^a-z0-9]+/gi, "-").slice(0, 28);
  const rand = Math.random().toString(36).slice(2, 8);
  const url = `https://www.tldraw.com/r/mathitude-${slug}-${rand}`;

  await ddb().send(
    new UpdateCommand({
      TableName: Tables.students,
      Key: { id },
      UpdateExpression: "SET whiteboardUrl = :u, updatedAt = :t",
      ExpressionAttributeValues: { ":u": url, ":t": new Date().toISOString() },
    }),
  );

  // Auto-post the link into the student's notes (Paula: "I'd like the URL
  // posted in the student notes automatically").
  const now = new Date().toISOString();
  await ddb()
    .send(
      new PutCommand({
        TableName: Tables.sessions,
        Item: {
          studentId: id,
          dateTime: now,
          date: now.slice(0, 10),
          time: now.slice(11, 16),
          type: "note",
          content: `Shared whiteboard: ${url}`,
          createdBy: a.userId,
          createdAt: now,
        },
      }),
    )
    .catch(() => {});

  return Response.json({ whiteboardUrl: url, created: true });
}
