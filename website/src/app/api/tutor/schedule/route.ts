import { ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden, stripPricingFromSession } from "@/lib/server/access";
import type { Session, Student } from "@/lib/types";

// GET /api/tutor/schedule?days=7
// Rolling N-day (default 7) schedule for the signed-in tutor — the upcoming
// week of sessions across their assigned students, grouped by day, so they can
// plan ahead (5/17 Paula). Admins get the same view across all students.
// Pricing is stripped for tutors. Each row links to the student's history.
export async function GET(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  const a = actor!;
  if (!a.isAdmin && a.role !== "tutor") return forbidden();

  const { searchParams } = new URL(request.url);
  const days = Math.max(1, Math.min(31, Number(searchParams.get("days") || 7)));

  const c = ddb();

  // Resolve which students this actor can see.
  const studentsR = await c.send(new ScanCommand({ TableName: Tables.students }));
  const allStudents = (studentsR.Items as Student[]) || [];
  const tutorId = a.tutor?.id;
  const visible = a.isAdmin
    ? allStudents
    : allStudents.filter((s) => (s.tutorIds || []).includes(tutorId || "__none__"));
  const nameById = new Map(visible.map((s) => [s.id, `${s.firstName} ${s.lastName}`.trim()]));
  const visibleIds = new Set(visible.map((s) => s.id));

  // Build the list of dates (YYYY-MM-DD) for the window, starting today.
  // Date math is intentionally done off a passed/`now` ISO to stay
  // deterministic; here we derive from the server clock at request time.
  const today = new Date();
  const dateList: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    dateList.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }

  const byDate: { date: string; sessions: unknown[] }[] = [];
  for (const date of dateList) {
    let items: Session[] = [];
    try {
      const r = await c.send(
        new QueryCommand({
          TableName: Tables.sessions,
          IndexName: "by-date",
          KeyConditionExpression: "#d = :date",
          ExpressionAttributeNames: { "#d": "date" },
          ExpressionAttributeValues: { ":date": date },
        }),
      );
      items = (r.Items as Session[]) || [];
    } catch {
      items = [];
    }
    const filtered = items
      .filter((s) => s.type !== "note")
      .filter(
        (s) =>
          visibleIds.has(s.studentId) ||
          (tutorId && (s.tutorId === tutorId || s.sessionLeadId === tutorId)),
      )
      .map((s) => {
        const row = {
          studentId: s.studentId,
          studentName: nameById.get(s.studentId) || s.studentId,
          dateTime: s.dateTime,
          time: s.time,
          duration: s.duration ?? 60,
          type: s.type,
          status: s.status,
          notes: s.notes || "",
        } as Record<string, unknown>;
        return a.isAdmin ? row : stripPricingFromSession(row);
      })
      .sort((x, y) => String(x.time).localeCompare(String(y.time)));
    byDate.push({ date, sessions: filtered });
  }

  return Response.json({ days: byDate });
}
