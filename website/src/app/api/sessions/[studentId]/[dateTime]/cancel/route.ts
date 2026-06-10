import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin, currentUserEmail } from "@/lib/server/ddb";
import { notifyAction } from "@/lib/server/notify";
import { evaluateCancellation, MAKEUP_NOTICE_DAYS } from "@/lib/makeup";

interface Body {
  reason?: string;
  // "parent" when the parent requested it, otherwise defaults to the admin.
  cancelledBy?: string;
  // Optional override for the cancellation moment (audit/backfill). Defaults to now.
  asOf?: string;
}

// POST /api/sessions/[studentId]/[dateTime]/cancel
// Cancel a scheduled session and record how much notice was given. If notice
// is ≥ MAKEUP_NOTICE_DAYS the session earns an available makeup credit;
// otherwise it's forfeited. Read the original via the table's {studentId,
// dateTime} key, mutate, and write back (matches the PutCommand style used by
// the session-logging route).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ studentId: string; dateTime: string }> },
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { studentId, dateTime: rawDateTime } = await params;
  const dateTime = decodeURIComponent(rawDateTime);

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // empty body is fine
  }

  const c = ddb();
  const r = await c.send(
    new GetCommand({ TableName: Tables.sessions, Key: { studentId, dateTime } }),
  );
  const session = r.Item as Record<string, unknown> | undefined;
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.status !== "scheduled") {
    return Response.json(
      {
        error: `Only scheduled sessions can be cancelled (this one is "${session.status}").`,
      },
      { status: 400 },
    );
  }

  const cancelledAt = body.asOf?.trim() || new Date().toISOString();
  const { noticeDays, makeupEligible, makeupStatus } = evaluateCancellation(
    session.dateTime as string,
    cancelledAt,
  );

  const adminEmail = await currentUserEmail();
  const cancelledBy = body.cancelledBy?.trim() || adminEmail || "admin";

  const updated: Record<string, unknown> = {
    ...session,
    status: "cancelled",
    cancelledAt,
    cancelledBy,
    noticeDays,
    makeupEligible,
    makeupStatus,
    updatedAt: new Date().toISOString(),
  };
  if (body.reason?.trim()) updated.cancellationReason = body.reason.trim();

  await c.send(new PutCommand({ TableName: Tables.sessions, Item: updated }));

  await notifyAction({
    kind: "session.cancelled",
    summary: makeupEligible
      ? `Session cancelled with ${noticeDays}d notice — makeup credit earned (${studentId}, ${session.date})`
      : `Session cancelled with ${noticeDays}d notice — forfeited, under ${MAKEUP_NOTICE_DAYS}d policy (${studentId}, ${session.date})`,
    details: {
      studentId,
      dateTime,
      noticeDays,
      makeupEligible,
      cancelledBy,
      reason: body.reason || null,
    },
  }).catch(() => {});

  return Response.json({
    session: updated,
    noticeDays,
    makeupEligible,
    makeupStatus,
    policyDays: MAKEUP_NOTICE_DAYS,
  });
}
