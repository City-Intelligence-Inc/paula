import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import {
  resolveActor,
  studentsForFamilyMember,
  stripStaffOnlyNoteFields,
} from "@/lib/server/access";
import type { Session, Student } from "@/lib/types";

// GET /api/me/notes — the family-facing notes read path (N-5/N-9, R-2/R-6/R-7).
// Parents get every child in their family; students get exactly their own
// record. Notes come back with staff-only fields stripped server-side
// (sessionPlan/privateNotes never cross the wire to a family member).

function safeStudent(s: Student) {
  return {
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    grade: s.grade,
    school: s.school,
    familyId: s.familyId,
    // F-2: only family-audience links reach the family; who added them and
    // any staff-only links stay internal. S3-stored files are rewritten to
    // the streaming proxy so the raw AWS URL never reaches the browser.
    sharedFiles: (s.sharedFiles || [])
      .filter((f) => f.audience === "family")
      .map((f) => ({
        id: f.id,
        name: f.name,
        url: f.url.startsWith("s3://")
          ? `/api/files/object?sid=${encodeURIComponent(s.id)}&fid=${encodeURIComponent(f.id)}`
          : f.url,
        createdAt: f.createdAt,
      })),
  };
}

export async function GET() {
  const { actor, response } = await resolveActor();
  if (response) return response;

  if (actor!.isAdmin || actor!.role === "tutor") {
    return Response.json(
      { error: "Staff read notes via /api/students/:id/session-notes." },
      { status: 403 },
    );
  }

  const { parentOf, self } = await studentsForFamilyMember(
    actor!.userId,
    actor!.email,
  );
  const isStudent = parentOf.length === 0 && !!self;
  const students = isStudent ? [self!] : parentOf;
  if (students.length === 0) {
    return Response.json({ role: "parent", students: [], notes: [] });
  }

  const db = ddb();
  const perStudent = await Promise.all(
    students.map((s) =>
      db
        .send(
          new QueryCommand({
            TableName: Tables.sessions,
            KeyConditionExpression: "studentId = :sid",
            ExpressionAttributeValues: { ":sid": s.id },
          }),
        )
        .then((r) => (r.Items as Session[]) || []),
    ),
  );
  const allItems = perStudent.flat();
  const notes = allItems
    .filter((n) => n.type === "session-note")
    .sort((a, b) => (b.dateTime || "").localeCompare(a.dateTime || ""))
    .map((n) => stripStaffOnlyNoteFields(n));

  // Upcoming scheduled sessions (D-3: the family dashboard shows what's next).
  // Only safe fields — no rates, no staff notes.
  const nowIso = new Date().toISOString();
  const nameById = new Map(students.map((s) => [s.id, `${s.firstName} ${s.lastName}`]));
  const upcomingSessions = allItems
    .filter(
      (x) =>
        (x.type === "individual" || x.type === "group") &&
        x.status === "scheduled" &&
        (x.dateTime || "") > nowIso,
    )
    .sort((a, b) => (a.dateTime || "").localeCompare(b.dateTime || ""))
    .slice(0, 5)
    .map((x) => ({
      studentId: x.studentId,
      studentName: nameById.get(x.studentId) || "",
      dateTime: x.dateTime,
      duration: x.duration,
      type: x.type,
    }));

  return Response.json({
    role: isStudent ? "student" : "parent",
    students: students.map(safeStudent),
    notes,
    upcomingSessions,
  });
}
