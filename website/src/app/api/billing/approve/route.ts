import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import {
  buildChargeFields,
  getStripe,
  isStripeConfigured,
  resolveDefaultPaymentMethod,
} from "@/lib/server/stripe";

interface QueueRow {
  studentId: string;
  dateTime: string;
  amountCents: number;
  // Optional explicit payer targets (split / group / counterparty).
  chargeStudentId?: string | null;
  payerFamilyId?: string | null;
  payerParentId?: string | null;
  payerCounterpartyName?: string | null;
  splitIndex?: number;
  splitLabel?: string | null;
}

interface Body {
  rows?: QueueRow[];
}

interface RowResult {
  studentId: string;
  dateTime: string;
  splitIndex?: number;
  splitLabel?: string | null;
  ok: boolean;
  status?: string;
  paymentIntentId?: string;
  error?: string;
  familyId?: string;
}

type DDB = ReturnType<typeof ddb>;

// Resolve a Stripe customer id for a charge row, honoring explicit payer
// targets first, then falling back to the student's family payer.
async function resolveCustomerId(
  c: DDB,
  row: QueueRow,
): Promise<{ customerId?: string; offline?: boolean }> {
  // Off-Stripe counterparty (e.g. a school) — can't auto-charge.
  if (row.payerCounterpartyName) return { offline: true };

  // Explicit parent payer.
  if (row.payerParentId) {
    const r = await c.send(
      new GetCommand({ TableName: Tables.parents, Key: { id: row.payerParentId } }),
    );
    return { customerId: (r.Item as { stripeCustomerId?: string } | undefined)?.stripeCustomerId };
  }

  // Explicit family payer, or the group attendee's family, or the session's
  // primary student's family.
  const familyStudentId = row.chargeStudentId || row.studentId;
  let familyId = row.payerFamilyId || undefined;
  let primaryPayerParentId: string | undefined;
  let legacyStudentCustomer: string | undefined;

  if (!familyId && familyStudentId) {
    const sr = await c.send(
      new GetCommand({ TableName: Tables.students, Key: { id: familyStudentId } }),
    );
    const student = sr.Item as
      | { familyId?: string; primaryPayerParentId?: string; stripeCustomerId?: string }
      | undefined;
    familyId = student?.familyId;
    primaryPayerParentId = student?.primaryPayerParentId;
    legacyStudentCustomer = student?.stripeCustomerId;
  }

  if (familyId) {
    const ps = await c.send(
      new ScanCommand({
        TableName: Tables.parents,
        FilterExpression: "familyId = :f",
        ExpressionAttributeValues: { ":f": familyId },
        // No Limit: on a filtered Scan it caps rows examined pre-filter, so
        // Limit:10 dropped the family's payer once the table grew past 10 rows
        // → false "No Stripe customer on file" (QA 2026-07-05).
      }),
    );
    const parents = (ps.Items || []) as Array<{ id: string; stripeCustomerId?: string }>;
    if (primaryPayerParentId) {
      const explicit = parents.find((p) => p.id === primaryPayerParentId);
      if (explicit?.stripeCustomerId) return { customerId: explicit.stripeCustomerId };
    }
    const famR = await c.send(
      new GetCommand({ TableName: Tables.families, Key: { id: familyId } }),
    );
    const fam = famR.Item as { primaryPayerId?: string } | undefined;
    if (fam?.primaryPayerId) {
      const primary = parents.find((p) => p.id === fam.primaryPayerId);
      if (primary?.stripeCustomerId) return { customerId: primary.stripeCustomerId };
    }
    const anyParent = parents.find((p) => typeof p.stripeCustomerId === "string");
    if (anyParent?.stripeCustomerId) return { customerId: anyParent.stripeCustomerId };
  }

  return { customerId: legacyStudentCustomer };
}

// POST /api/billing/approve — admin only. Body: { rows: QueueRow[] }.
// Charges each row to its resolved payer; a session may produce several rows
// (split payers / shared group). Session status is updated once per session
// based on whether all of its chargeable rows succeeded.
export async function POST(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  // R-4: office staff see billing (B-6) but never run charges — only the
  // super admin (master) executes the billing run.
  if (!actor!.isMaster) return forbidden("Only the super admin can run charges.");

  if (!(await isStripeConfigured())) {
    return Response.json(
      {
        error:
          "Stripe is not configured. An admin must add the secret key in Settings → Stripe.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = (body.rows || []).filter(
    (r) =>
      r &&
      typeof r.studentId === "string" &&
      typeof r.dateTime === "string" &&
      typeof r.amountCents === "number" &&
      r.amountCents > 0,
  );
  if (rows.length === 0) {
    return Response.json({ error: "No rows to charge" }, { status: 400 });
  }

  const c = ddb();
  const stripe = await getStripe();
  const results: RowResult[] = [];
  // Track per-session outcome so we can set status once at the end.
  const sessionOutcome = new Map<string, { anyFailed: boolean; anyCharged: boolean; lastError?: string }>();
  const noteSession = (key: string, charged: boolean, failed: boolean, error?: string) => {
    const cur = sessionOutcome.get(key) || { anyFailed: false, anyCharged: false };
    if (charged) cur.anyCharged = true;
    if (failed) cur.anyFailed = true;
    if (error) cur.lastError = error;
    sessionOutcome.set(key, cur);
  };

  // Guard: only sessions currently chargeable (completed, or failed → retry)
  // may be charged. Blocks double-charging a "billed" session on a replayed
  // request, and blocks charging a session an admin parked on hold.
  const sessionStatusCache = new Map<string, string>();
  async function chargeableStatusError(row: QueueRow): Promise<string | null> {
    const key = `${row.studentId}#${row.dateTime}`;
    if (!sessionStatusCache.has(key)) {
      const sr = await c.send(
        new GetCommand({
          TableName: Tables.sessions,
          Key: { studentId: row.studentId, dateTime: row.dateTime },
        }),
      );
      sessionStatusCache.set(
        key,
        ((sr.Item as { status?: string } | undefined)?.status) || "missing",
      );
    }
    const status = sessionStatusCache.get(key)!;
    if (status === "completed" || status === "failed") return null;
    if (status === "missing") return "Session not found";
    if (status === "hold") return "On hold — release it from the queue first";
    if (status === "billed" || status === "paid") return "Already billed";
    return `Session is "${status}" — not chargeable`;
  }

  // Guard: when retrying a partially-failed split session, rows that already
  // charged successfully have a paid Payment record — skip them instead of
  // charging the family twice.
  async function alreadyPaid(row: QueueRow, attribId: string): Promise<boolean> {
    try {
      const pr = await c.send(
        new QueryCommand({
          TableName: Tables.payments,
          KeyConditionExpression: "studentId = :sid",
          FilterExpression:
            "sessionDateTime = :dt AND paymentStatus = :paid",
          ExpressionAttributeValues: {
            ":sid": attribId,
            ":dt": row.dateTime,
            ":paid": "paid",
          },
        }),
      );
      const items = (pr.Items || []) as { splitLabel?: string }[];
      return items.some(
        (p) => (p.splitLabel || "") === (row.splitLabel || ""),
      );
    } catch {
      return false; // fail open — Stripe idempotency is not at stake here
    }
  }

  for (const row of rows) {
    const sessionKey = `${row.studentId}#${row.dateTime}`;
    try {
      const statusError = await chargeableStatusError(row);
      if (statusError) {
        noteSession(sessionKey, false, false);
        results.push({
          studentId: row.studentId,
          dateTime: row.dateTime,
          splitIndex: row.splitIndex,
          splitLabel: row.splitLabel,
          ok: false,
          error: statusError,
        });
        continue;
      }
      // Resolve the student that the charge is attributed to (for the Payment
      // record + description) — the attendee for a group row, else primary.
      const attribId = row.chargeStudentId || row.studentId;
      const studentRes = await c.send(
        new GetCommand({ TableName: Tables.students, Key: { id: attribId } }),
      );
      const student = studentRes.Item as
        | { id: string; firstName: string; lastName: string }
        | undefined;

      // Resolve the student's familyId for actionable error links.
      const studentForFamily = await c.send(
        new GetCommand({ TableName: Tables.students, Key: { id: row.chargeStudentId || row.studentId } }),
      );
      const familyId = (studentForFamily.Item as { familyId?: string } | undefined)?.familyId;

      if (await alreadyPaid(row, attribId)) {
        noteSession(sessionKey, true, false);
        results.push({
          studentId: row.studentId,
          dateTime: row.dateTime,
          splitIndex: row.splitIndex,
          splitLabel: row.splitLabel,
          ok: true,
          status: "already-paid",
        });
        continue;
      }

      const { customerId, offline } = await resolveCustomerId(c, row);

      if (offline) {
        noteSession(sessionKey, false, false);
        results.push({
          studentId: row.studentId,
          dateTime: row.dateTime,
          splitIndex: row.splitIndex,
          splitLabel: row.splitLabel,
          ok: false,
          error: `External payer (${row.payerCounterpartyName}) — bill outside Stripe.`,
        });
        continue;
      }
      if (!customerId) {
        noteSession(sessionKey, false, true, "No card on file");
        results.push({
          studentId: row.studentId,
          dateTime: row.dateTime,
          splitIndex: row.splitIndex,
          splitLabel: row.splitLabel,
          ok: false,
          error: "No card on file",
          familyId,
        });
        continue;
      }

      const paymentMethod = await resolveDefaultPaymentMethod(stripe, customerId);
      if (!paymentMethod) {
        throw new Error("No saved card on file for this payer.");
      }

      const studentName = student
        ? `${student.firstName} ${student.lastName}`.trim()
        : attribId;
      const sessionDate = (row.dateTime || "").slice(0, 10);
      const fields = buildChargeFields({
        studentId: attribId,
        studentName,
        sessionId: `${row.studentId}#${row.dateTime}#${row.splitIndex ?? 0}`,
        sessionDate,
      });

      const intent = await stripe.paymentIntents.create({
        amount: Math.round(row.amountCents),
        currency: "usd",
        customer: customerId,
        payment_method: paymentMethod.id,
        off_session: true,
        confirm: true,
        description: fields.description,
        metadata: { ...fields.metadata, splitLabel: row.splitLabel || "" },
        // Full descriptor, not _suffix — the suffix field needs an account
        // statement-descriptor prefix or Stripe rejects the PaymentIntent
        // before creation (charge stuck "pending", nothing in Stripe). QA
        // 2026-07-05.
        statement_descriptor: fields.statement_descriptor,
      });

      const now = new Date().toISOString();
      const succeeded = intent.status === "succeeded";
      noteSession(
        sessionKey,
        succeeded,
        !succeeded,
        succeeded ? undefined : `Charge ${intent.status}`,
      );

      await c.send(
        new PutCommand({
          TableName: Tables.payments,
          Item: {
            studentId: attribId,
            createdAt: now,
            amount: row.amountCents,
            paymentStatus: succeeded ? "paid" : "pending",
            description: row.splitLabel
              ? `${fields.description} (${row.splitLabel})`
              : fields.description,
            stripePaymentIntentId: intent.id,
            stripeChargeId: (intent.latest_charge as string | undefined) || undefined,
            sessionDateTime: row.dateTime,
            sessionStudentId: row.studentId,
            splitLabel: row.splitLabel || undefined,
          },
        }),
      );

      results.push({
        studentId: row.studentId,
        dateTime: row.dateTime,
        splitIndex: row.splitIndex,
        splitLabel: row.splitLabel,
        ok: succeeded,
        status: intent.status,
        paymentIntentId: intent.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[billing/approve]", row, err);
      noteSession(sessionKey, false, true, message);
      results.push({
        studentId: row.studentId,
        dateTime: row.dateTime,
        splitIndex: row.splitIndex,
        splitLabel: row.splitLabel,
        ok: false,
        error: message,
      });
    }
  }

  // One status write per session: billed only if at least one row charged and
  // none failed; failed if any row failed.
  for (const [key, outcome] of sessionOutcome.entries()) {
    const [studentId, dateTime] = key.split("#");
    const status = outcome.anyFailed
      ? "failed"
      : outcome.anyCharged
        ? "billed"
        : null;
    if (!status) continue;
    try {
      await c.send(
        new UpdateCommand({
          TableName: Tables.sessions,
          Key: { studentId, dateTime },
          UpdateExpression:
            status === "failed"
              ? "SET #s = :s, billedAt = :n, lastBillingError = :e"
              : "SET #s = :s, billedAt = :n REMOVE lastBillingError",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: {
            ":s": status,
            ":n": new Date().toISOString(),
            ...(status === "failed"
              ? { ":e": outcome.lastError || "Charge failed" }
              : {}),
          },
        }),
      );
    } catch {
      // best-effort
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.length - succeeded;
  return Response.json({ results, succeeded, failed });
}
