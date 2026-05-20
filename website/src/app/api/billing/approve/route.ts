import {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";
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
}

interface Body {
  rows?: QueueRow[];
}

interface RowResult {
  studentId: string;
  dateTime: string;
  ok: boolean;
  status?: string;
  paymentIntentId?: string;
  error?: string;
}

// POST /api/billing/approve
// Body: { rows: [{ studentId, dateTime, amountCents }] }
// For each row: looks up the parent's Stripe customer + default card,
// creates a confirmed PaymentIntent with locked-down statement_descriptor,
// writes a Payment record, transitions Session.status to billed/failed.
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

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

  for (const row of rows) {
    try {
      const studentRes = await c.send(
        new GetCommand({
          TableName: Tables.students,
          Key: { id: row.studentId },
        }),
      );
      const student = studentRes.Item as
        | {
            id: string;
            firstName: string;
            lastName: string;
            familyId?: string;
            stripeCustomerId?: string;
          }
        | undefined;
      if (!student) throw new Error("Student not found");

      let stripeCustomerId: string | undefined;
      if (student.familyId) {
        const ps = await c.send(
          new ScanCommand({
            TableName: Tables.parents,
            FilterExpression: "familyId = :f",
            ExpressionAttributeValues: { ":f": student.familyId },
            Limit: 5,
          }),
        );
        const primary = (ps.Items || []).find(
          (p) => typeof p.stripeCustomerId === "string",
        );
        stripeCustomerId = primary?.stripeCustomerId as string | undefined;
      }
      if (!stripeCustomerId) stripeCustomerId = student.stripeCustomerId;
      if (!stripeCustomerId) throw new Error("No Stripe customer on file");

      const paymentMethod = await resolveDefaultPaymentMethod(
        stripe,
        stripeCustomerId,
      );
      if (!paymentMethod) throw new Error("No saved card on file");

      const studentName = `${student.firstName} ${student.lastName}`.trim();
      const sessionDate = (row.dateTime || "").slice(0, 10);
      const fields = buildChargeFields({
        studentId: student.id,
        studentName,
        sessionId: `${row.studentId}#${row.dateTime}`,
        sessionDate,
      });

      const intent = await stripe.paymentIntents.create({
        amount: Math.round(row.amountCents),
        currency: "usd",
        customer: stripeCustomerId,
        payment_method: paymentMethod.id,
        off_session: true,
        confirm: true,
        description: fields.description,
        metadata: fields.metadata,
        statement_descriptor_suffix: fields.statement_descriptor,
      });

      const now = new Date().toISOString();
      const succeeded = intent.status === "succeeded";

      await c.send(
        new PutCommand({
          TableName: Tables.payments,
          Item: {
            studentId: student.id,
            createdAt: now,
            amount: row.amountCents,
            paymentStatus: succeeded ? "paid" : "pending",
            description: fields.description,
            stripePaymentIntentId: intent.id,
            stripeChargeId:
              (intent.latest_charge as string | undefined) || undefined,
            sessionDateTime: row.dateTime,
          },
        }),
      );

      await c.send(
        new UpdateCommand({
          TableName: Tables.sessions,
          Key: { studentId: row.studentId, dateTime: row.dateTime },
          UpdateExpression:
            "SET #s = :s, stripeChargeId = :c, stripePaymentIntentId = :pi, billedAt = :n",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: {
            ":s": succeeded ? "billed" : "failed",
            ":c": (intent.latest_charge as string | undefined) || null,
            ":pi": intent.id,
            ":n": now,
          },
        }),
      );

      results.push({
        studentId: row.studentId,
        dateTime: row.dateTime,
        ok: succeeded,
        status: intent.status,
        paymentIntentId: intent.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[billing/approve]", row, err);
      // Mark the session as failed so it surfaces with an error in the queue.
      try {
        await c.send(
          new UpdateCommand({
            TableName: Tables.sessions,
            Key: { studentId: row.studentId, dateTime: row.dateTime },
            UpdateExpression: "SET #s = :s, lastBillingError = :e",
            ExpressionAttributeNames: { "#s": "status" },
            ExpressionAttributeValues: { ":s": "failed", ":e": message },
          }),
        );
      } catch {
        // best-effort
      }
      results.push({
        studentId: row.studentId,
        dateTime: row.dateTime,
        ok: false,
        error: message,
      });
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.length - succeeded;
  return Response.json({ results, succeeded, failed });
}
