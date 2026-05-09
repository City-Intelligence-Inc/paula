import { QueryCommand, ScanCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

// GET /api/billing/queue
// Returns sessions in `completed` status (not yet billed) enriched with
// student name, family/parent, default rate, and computed charge amount.
// This is the data the admin reviews before approving charges.
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const c = ddb();

  // Query sessions where status=completed via the by-status GSI.
  // Fall back to a Scan if the GSI isn't provisioned yet.
  let sessionItems: Record<string, unknown>[] = [];
  try {
    const r = await c.send(
      new QueryCommand({
        TableName: Tables.sessions,
        IndexName: "by-status",
        KeyConditionExpression: "#s = :s",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": "completed" },
      }),
    );
    sessionItems = r.Items || [];
  } catch (err) {
    console.warn("[billing/queue] by-status GSI query failed, scanning", err);
    const r = await c.send(
      new ScanCommand({
        TableName: Tables.sessions,
        FilterExpression: "#s = :s",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": "completed" },
        Limit: 500,
      }),
    );
    sessionItems = r.Items || [];
  }

  const studentIds = Array.from(
    new Set(sessionItems.map((s) => s.studentId as string).filter(Boolean)),
  );

  let students: Record<string, Record<string, unknown>> = {};
  if (studentIds.length > 0) {
    const batches: string[][] = [];
    for (let i = 0; i < studentIds.length; i += 100) {
      batches.push(studentIds.slice(i, i + 100));
    }
    for (const ids of batches) {
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
    // Session.rate is in cents; Student.rate is in dollars (legacy).
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

  // Newest first.
  queue.sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
  );

  const totalCents = queue.reduce((sum, q) => sum + q.amountCents, 0);
  return Response.json({ queue, totalCents, count: queue.length });
}
