import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import {
  resolveActor,
  forbidden,
  tutorScopeForStudent,
  stripPricingFromSession,
  filterSessionsForLimitedTutor,
} from "@/lib/server/access";
import type { Session, Student } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  const a = actor!;
  if (!a.isAdmin && a.role !== "tutor") return forbidden();

  const { id } = await params;

  // Tutor authorization needs the student row to check assignment + scope.
  let scope: "none" | "full" | "limited" = "full";
  if (a.role === "tutor" && a.tutor) {
    const s = await ddb().send(
      new GetCommand({ TableName: Tables.students, Key: { id } }),
    );
    if (!s.Item) return Response.json({ error: "Student not found" }, { status: 404 });
    scope = tutorScopeForStudent(s.Item as Pick<Student, "tutorIds" | "tutorAccess">, a.tutor.id);
    if (scope === "none") return forbidden("You are not assigned to this student.");
  }

  const result = await ddb().send(
    new QueryCommand({
      TableName: Tables.sessions,
      KeyConditionExpression: "studentId = :sid",
      ExpressionAttributeValues: { ":sid": id },
      ScanIndexForward: false,
    }),
  );
  let sessions = (result.Items || []) as Session[];

  if (a.role === "tutor") {
    if (scope === "limited") {
      sessions = filterSessionsForLimitedTutor(sessions, a.userId);
    }
    // Tutors never see pricing on sessions.
    sessions = sessions.map((s) => stripPricingFromSession(s as unknown as Record<string, unknown>) as unknown as Session);
  }

  return Response.json({ sessions });
}
