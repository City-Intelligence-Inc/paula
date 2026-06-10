import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";
import { MAKEUP_NOTICE_DAYS } from "@/lib/makeup";

// GET /api/admin/makeups
// Pulls cancelled sessions (by-status GSI, scan fallback) and buckets them for
// the Makeups admin page:
//   available — eligible credits not yet rescheduled
//   scheduled — eligible credits whose makeup is on the books
//   forfeited — cancelled with under MAKEUP_NOTICE_DAYS notice
// Each row is enriched with the student's name.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const c = ddb();

  let cancelled: Record<string, unknown>[] = [];
  try {
    const r = await c.send(
      new QueryCommand({
        TableName: Tables.sessions,
        IndexName: "by-status",
        KeyConditionExpression: "#s = :s",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": "cancelled" },
        ScanIndexForward: false,
      }),
    );
    cancelled = r.Items || [];
  } catch (err) {
    console.warn("[admin/makeups] by-status query failed, scanning", err);
    const r = await c.send(
      new ScanCommand({
        TableName: Tables.sessions,
        FilterExpression: "#s = :s",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": "cancelled" },
      }),
    );
    cancelled = r.Items || [];
  }

  // Only sessions cancelled through the makeup flow carry makeupStatus.
  const tracked = cancelled.filter((s) => s.makeupStatus !== undefined);

  // Name lookup. Scan students once and map by id.
  const studentNames = new Map<string, string>();
  try {
    const sr = await c.send(new ScanCommand({ TableName: Tables.students }));
    for (const s of (sr.Items || []) as Record<string, unknown>[]) {
      const name = `${(s.firstName as string) || ""} ${(s.lastName as string) || ""}`.trim();
      if (s.id) studentNames.set(s.id as string, name || (s.id as string));
    }
  } catch (err) {
    console.warn("[admin/makeups] student scan failed", err);
  }

  const row = (s: Record<string, unknown>) => ({
    studentId: s.studentId as string,
    studentName: studentNames.get(s.studentId as string) || (s.studentId as string),
    originalDateTime: s.dateTime as string,
    date: s.date as string,
    time: s.time as string,
    offering: (s.offering as string) || "tutoring",
    duration: (s.duration as number) || 60,
    tutorId: (s.tutorId as string) || null,
    noticeDays: (s.noticeDays as number) ?? null,
    cancelledAt: (s.cancelledAt as string) || null,
    cancelledBy: (s.cancelledBy as string) || null,
    reason: (s.cancellationReason as string) || null,
    makeupStatus: s.makeupStatus as string,
    makeupSessionDateTime: (s.makeupSessionDateTime as string) || null,
  });

  const available = tracked
    .filter((s) => s.makeupStatus === "available")
    .map(row);
  const scheduled = tracked
    .filter((s) => s.makeupStatus === "scheduled")
    .map(row);
  const forfeited = tracked
    .filter((s) => s.makeupStatus === "not-eligible")
    .map(row);

  return Response.json({
    policyDays: MAKEUP_NOTICE_DAYS,
    counts: {
      available: available.length,
      scheduled: scheduled.length,
      forfeited: forfeited.length,
    },
    available,
    scheduled,
    forfeited,
  });
}
