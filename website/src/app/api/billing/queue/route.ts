import { QueryCommand, ScanCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import { expandSessionToChargeRows } from "@/lib/billing";
import type { Session } from "@/lib/types";

// GET /api/billing/queue?days=14&limit=200
//
// Returns billable sessions newest first, scoped to a recent window so the
// page doesn't try to render thousands of historical imports. Three statuses
// surface here: "completed" (ready to charge), "failed" (a previous charge
// run failed — retry), and "hold" (parked by an admin; excluded from charge
// runs until released).
//
// The by-status GSI is hash=status, range=dateTime; we use a key condition
// `dateTime > since` so the GSI itself does the date filter (cheap), then
// page through the latest items first (ScanIndexForward=false).

const QUEUE_STATUSES = ["completed", "failed", "hold"] as const;

export async function GET(request: Request) {
  // Queue rows carry names + amounts for every family — admin only (R-4).
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Admin access required.");

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
    const perStatus = await Promise.all(
      QUEUE_STATUSES.map((status) =>
        c.send(
          new QueryCommand({
            TableName: Tables.sessions,
            IndexName: "by-status",
            KeyConditionExpression: "#s = :s AND #d > :since",
            ExpressionAttributeNames: { "#s": "status", "#d": "dateTime" },
            ExpressionAttributeValues: { ":s": status, ":since": since },
            ScanIndexForward: false, // newest first
            Limit: limit,
          }),
        ),
      ),
    );
    sessionItems = perStatus.flatMap((r) => r.Items || []);
    truncated = perStatus.some((r) => !!r.LastEvaluatedKey);
  } catch (err) {
    console.warn("[billing/queue] by-status GSI query failed, scanning", err);
    const r = await c.send(
      new ScanCommand({
        TableName: Tables.sessions,
        FilterExpression: "#s IN (:s1, :s2, :s3) AND #d > :since",
        ExpressionAttributeNames: { "#s": "status", "#d": "dateTime" },
        ExpressionAttributeValues: {
          ":s1": "completed",
          ":s2": "failed",
          ":s3": "hold",
          ":since": since,
        },
        Limit: limit,
      }),
    );
    sessionItems = r.Items || [];
    truncated = !!r.LastEvaluatedKey;
  }
  // Merge the three status streams newest-first and re-apply the cap.
  sessionItems.sort((a, b) =>
    String(b.dateTime || "").localeCompare(String(a.dateTime || "")),
  );
  if (sessionItems.length > limit) {
    sessionItems = sessionItems.slice(0, limit);
    truncated = true;
  }

  // Collect every referenced student id — primary AND group attendees — so we
  // can resolve names + families for split/shared charges.
  const idSet = new Set<string>();
  for (const s of sessionItems) {
    if (s.studentId) idSet.add(s.studentId as string);
    for (const sid of ((s.students as string[] | undefined) || [])) idSet.add(sid);
  }
  const studentIds = Array.from(idSet).filter(Boolean);

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

  // Expand every session into the concrete charge rows it produces. A plain
  // 1:1 session yields one row; a group/shared session yields one per
  // attendee's family; an explicit payer split yields one per payer. Partial
  // hours are prorated. See lib/billing.ts (unit-tested).
  const queue = sessionItems.flatMap((s) => {
    const primary = students[s.studentId as string];
    const studentRateDollars = (primary?.rate as number | undefined) ?? 0;
    const rows = expandSessionToChargeRows(s as unknown as Session, studentRateDollars);
    return rows.map((row) => {
      // Who is shown/charged: the group attendee if present, else primary.
      const payStudent = row.chargeStudentId
        ? students[row.chargeStudentId]
        : primary;
      const studentName = payStudent
        ? `${payStudent.firstName} ${payStudent.lastName}`
        : row.payerCounterpartyName || (row.chargeStudentId || (s.studentId as string));
      // Is there a billable target on file? Counterparty payers bill offline.
      const hasFamilyOnFile = row.payerCounterpartyName
        ? false
        : !!(payStudent?.familyId || row.payerFamilyId || row.payerParentId);
      return {
        studentId: s.studentId as string,
        chargeStudentId: row.chargeStudentId ?? null,
        sessionStatus: (s.status as string) || "completed",
        lastBillingError: (s.lastBillingError as string | undefined) ?? null,
        dateTime: s.dateTime as string,
        date: s.date as string,
        duration: (s.duration as number | undefined) ?? 60,
        type: (s.type as string | undefined) ?? "individual",
        tutorId: (s.tutorId as string | undefined) ?? null,
        offering: (s.offering as string | undefined) ?? "private-tutoring",
        notes: (s.notes as string | undefined) ?? "",
        studentName,
        amountCents: row.amountCents,
        splitIndex: row.splitIndex,
        splitLabel: row.splitLabel ?? null,
        payerFamilyId: row.payerFamilyId ?? null,
        payerParentId: row.payerParentId ?? null,
        payerCounterpartyName: row.payerCounterpartyName ?? null,
        hasFamilyOnFile,
      };
    });
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
