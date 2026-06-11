import {
  GetCommand,
  PutCommand,
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
        Limit: 10,
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
  if (!actor!.isAdmin) return forbidden("Admin access required.");

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
  const sessionOutcome = new Map<string, { anyFailed: boolean; anyCharged: boolean }>();
  const noteSession = (key: string, charged: boolean, failed: boolean) => {
    const cur = sessionOutcome.get(key) || { anyFailed: false, anyCharged: false };
    if (charged) cur.anyCharged = true;
    if (failed) cur.anyFailed = true;
    sessionOutcome.set(key, cur);
  };

  for (const row of rows) {
    const sessionKey = `${row.studentId}#${row.dateTime}`;
    try {
      // Resolve the student that the charge is attributed to (for the Payment
      // record + description) — the attendee for a group row, else primary.
      const attribId = row.chargeStudentId || row.studentId;
      const studentRes = await c.send(
        new GetCommand({ TableName: Tables.students, Key: { id: attribId } }),
      );
      const student = studentRes.Item as
        | { id: string; firstName: string; lastName: string }
        | undefined;

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
        throw new Error(
          "No Stripe customer on file — save a card under this family's primary payer first.",
        );
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
        statement_descriptor_suffix: fields.statement_descriptor,
      });

      const now = new Date().toISOString();
      const succeeded = intent.status === "succeeded";
      noteSession(sessionKey, succeeded, !succeeded);

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
      noteSession(sessionKey, false, true);
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
          UpdateExpression: "SET #s = :s, billedAt = :n",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: { ":s": status, ":n": new Date().toISOString() },
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
