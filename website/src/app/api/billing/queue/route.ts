import { QueryCommand, ScanCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

// GET /api/billing/queue?days=14&limit=200
//
// Returns sessions where status=completed, newest first, scoped to a recent
// window so the page doesn't try to render thousands of historical imports.
//
// The by-status GSI is hash=status, range=dateTime; we use a key condition
// `dateTime > since` so the GSI itself does the date filter (cheap), then
// page through the latest items first (ScanIndexForward=false).
export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const days = Math.max(
    1,
    Math.min(365, Number(searchParams.get("days") || 14)),
  );
  const limit = Math.max(
    1,
    Math.min(500, Number(searchParams.get("limit") || 200)),
  );

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const c = ddb();

  let sessionItems: Record<string, unknown>[] = [];
  let truncated = false;
  try {
    const r = await c.send(
      new QueryCommand({
        TableName: Tables.sessions,
        IndexName: "by-status",
        KeyConditionExpression: "#s = :s AND #d > :since",
        ExpressionAttributeNames: { "#s": "status", "#d": "dateTime" },
        ExpressionAttributeValues: { ":s": "completed", ":since": since },
        ScanIndexForward: false, // newest first
        Limit: limit,
      }),
    );
    sessionItems = r.Items || [];
    truncated = !!r.LastEvaluatedKey;
  } catch (err) {
    console.warn("[billing/queue] by-status GSI query failed, scanning", err);
    const r = await c.send(
      new ScanCommand({
        TableName: Tables.sessions,
        FilterExpression: "#s = :s AND #d > :since",
        ExpressionAttributeNames: { "#s": "status", "#d": "dateTime" },
        ExpressionAttributeValues: { ":s": "completed", ":since": since },
        Limit: limit,
      }),
    );
    sessionItems = r.Items || [];
    truncated = !!r.LastEvaluatedKey;
  }

  const studentIds = Array.from(
    new Set(sessionItems.map((s) => s.studentId as string).filter(Boolean)),
  );

  const students: Record<string, Record<string, unknown>> = {};
  if (studentIds.length > 0) {
    for (let i = 0; i < studentIds.length; i += 100) {
      const ids = studentIds.slice(i, i + 100);
      const res = await c.send(
        new BatchGetCommand({
          RequestItems: {
            [Tables.students]: { Keys: ids.map((id) => ({ id })) },
          },
        }),
      );
      const items = res.Responses?.[Tables.students] || [];
      for (const it of items) {
        students[it.id as string] = it as Record<string, unknown>;
      }
    }
  }

  const queue = sessionItems.map((s) => {
    const student = students[s.studentId as string];
    const studentName = student
      ? `${student.firstName} ${student.lastName}`
      : (s.studentId as string);
    const studentRate = (student?.rate as number | undefined) ?? 0;
    const sessionRateCents = (s.rate as number | undefined) ?? null;
    const fallbackCents = Math.round(studentRate * 100);
    const amountCents = sessionRateCents ?? fallbackCents;
    return {
      studentId: s.studentId as string,
      dateTime: s.dateTime as string,
      date: s.date as string,
      duration: (s.duration as number | undefined) ?? 60,
      type: (s.type as string | undefined) ?? "individual",
      tutorId: (s.tutorId as string | undefined) ?? null,
      offering: (s.offering as string | undefined) ?? "private-tutoring",
      notes: (s.notes as string | undefined) ?? "",
      studentName,
      amountCents,
      hasFamilyOnFile: !!student?.familyId,
    };
  });

  const totalCents = queue.reduce((sum, q) => sum + q.amountCents, 0);
  return Response.json({
    queue,
    totalCents,
    count: queue.length,
    days,
    limit,
    truncated,
    since,
  });
}
