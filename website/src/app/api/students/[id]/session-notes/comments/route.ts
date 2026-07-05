import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, studentsForFamilyMember } from "@/lib/server/access";
import { addNoteComment } from "@/lib/server/session-notes-core";
import type { Actor } from "@/lib/server/access";
import type { Parent } from "@/lib/types";

// POST /api/students/:id/session-notes/comments — N-6: append to the shared
// comment thread on a session note. Staff, assigned tutors, and the student's
// own parents can comment. The display name is resolved server-side so the
// client can't spoof it.

const deps = () => ({
  db: ddb(),
  tables: { sessions: Tables.sessions, students: Tables.students },
});

async function displayName(actor: Actor): Promise<string> {
  if (actor.tutor) {
    return `${actor.tutor.firstName} ${actor.tutor.lastName}`.trim() || actor.email;
  }
  if (actor.role === "parent") {
    try {
      const r = await ddb().send(new ScanCommand({ TableName: Tables.parents }));
      const e = (actor.email || "").toLowerCase();
      const match = ((r.Items || []) as Parent[]).find(
        (p) =>
          p.clerkUserId === actor.userId ||
          (e && (p.email || "").toLowerCase() === e),
      );
      if (match) return `${match.firstName} ${match.lastName}`.trim() || actor.email;
    } catch {}
  }
  return actor.email || "Staff";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { actor, response } = await resolveActor();
  if (response) return response;

  let body: { dateTime?: string; text?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parentStudentIds =
    !actor!.isAdmin && actor!.role !== "tutor"
      ? (await studentsForFamilyMember(actor!.userId, actor!.email)).parentOf.map(
          (s) => s.id,
        )
      : [];

  const r = await addNoteComment(
    {
      userId: actor!.userId,
      role: actor!.role,
      isAdmin: actor!.isAdmin,
      isMaster: actor!.isMaster,
      tutorId: actor!.tutor?.id,
    },
    parentStudentIds,
    id,
    { ...body, authorName: await displayName(actor!) },
    deps(),
  );
  return Response.json(r.body, { status: r.status });
}
