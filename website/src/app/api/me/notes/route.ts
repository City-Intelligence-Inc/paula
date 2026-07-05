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
            FilterExpression: "#t = :sn",
            ExpressionAttributeNames: { "#t": "type" },
            ExpressionAttributeValues: { ":sid": s.id, ":sn": "session-note" },
          }),
        )
        .then((r) => (r.Items as Session[]) || []),
    ),
  );
  const notes = perStudent
    .flat()
    .sort((a, b) => (b.dateTime || "").localeCompare(a.dateTime || ""))
    .map((n) => stripStaffOnlyNoteFields(n));

  return Response.json({
    role: isStudent ? "student" : "parent",
    students: students.map(safeStudent),
    notes,
  });
}
