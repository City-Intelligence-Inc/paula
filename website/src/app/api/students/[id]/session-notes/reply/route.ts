import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, studentsForFamilyMember } from "@/lib/server/access";
import { setFamilyReply } from "@/lib/server/session-notes-core";

// PUT /api/students/:id/session-notes/reply — N-5: a parent saves a reply on
// a completed session. Parents only, scoped to their own children; the reply
// lands on the note item as familyReply (+ audit fields). Students and staff
// read replies but cannot write them here.

const deps = () => ({
  db: ddb(),
  tables: { sessions: Tables.sessions, students: Tables.students },
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { actor, response } = await resolveActor();
  if (response) return response;

  let body: { dateTime?: string; familyReply?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { parentOf } = await studentsForFamilyMember(
    actor!.userId,
    actor!.email,
  );
  const r = await setFamilyReply(
    {
      userId: actor!.userId,
      role: actor!.role,
      isAdmin: actor!.isAdmin,
      isMaster: actor!.isMaster,
      tutorId: actor!.tutor?.id,
    },
    parentOf.map((s) => s.id),
    id,
    body,
    deps(),
  );
  return Response.json(r.body, { status: r.status });
}
