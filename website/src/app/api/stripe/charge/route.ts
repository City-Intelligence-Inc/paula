import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import {
  buildChargeFields,
  getStripe,
  resolveDefaultPaymentMethod,
} from "@/lib/server/stripe";

interface Body {
  studentId?: string;
  amount?: number; // cents
  description?: string; // ignored — descriptor is locked
  offering?: string;
  // Optional internal label (e.g. "Fall 2026 geometry class — 10 weeks").
  // Shown in the Payment record + Stripe metadata; NEVER statement-visible.
  label?: string;
}

export async function POST(request: Request) {
  // Charging is master-only (R-4): office staff view billing but never
  // trigger charges; tutors see nothing billing-shaped at all.
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isMaster) return forbidden("Only the super admin can run charges.");

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.studentId || typeof body.amount !== "number" || body.amount <= 0) {
    return Response.json(
      { error: "studentId and positive amount (cents) required" },
      { status: 400 },
    );
  }

  const c = ddb();
  const stripe = await getStripe();

  const studentRes = await c.send(
    new GetCommand({ TableName: Tables.students, Key: { id: body.studentId } }),
  );
  const student = studentRes.Item as
    | {
        id: string;
        firstName: string;
        lastName: string;
        familyId?: string;
        stripeCustomerId?: string;
        primaryPayerParentId?: string;
      }
    | undefined;

  if (!student) {
    return Response.json({ error: "Student not found" }, { status: 404 });
  }

  // Resolve the Stripe customer to charge. Priority:
  //   1. student.primaryPayerParentId (per-student override for split custody)
  //   2. family.primaryPayerId
  //   3. any parent on the family with a stripeCustomerId
  //   4. legacy student.stripeCustomerId
  let stripeCustomerId: string | undefined;
  if (student.familyId) {
    const ps = await c.send(
      new ScanCommand({
        TableName: Tables.parents,
        FilterExpression: "familyId = :f",
        ExpressionAttributeValues: { ":f": student.familyId },
        Limit: 10,
      }),
    );
    const parents = (ps.Items || []) as Array<{
      id: string;
      stripeCustomerId?: string;
    }>;
    if (student.primaryPayerParentId) {
      const explicit = parents.find(
        (p) => p.id === student.primaryPayerParentId,
      );
      stripeCustomerId = explicit?.stripeCustomerId;
    }
    if (!stripeCustomerId) {
      const famR = await c.send(
        new GetCommand({
          TableName: Tables.families,
          Key: { id: student.familyId },
        }),
      );
      const fam = famR.Item as { primaryPayerId?: string } | undefined;
      if (fam?.primaryPayerId) {
        const primary = parents.find((p) => p.id === fam.primaryPayerId);
        stripeCustomerId = primary?.stripeCustomerId;
      }
    }
    if (!stripeCustomerId) {
      const anyParent = parents.find(
        (p) => typeof p.stripeCustomerId === "string",
      );
      stripeCustomerId = anyParent?.stripeCustomerId;
    }
  }
  if (!stripeCustomerId) stripeCustomerId = student.stripeCustomerId;

  if (!stripeCustomerId) {
    return Response.json(
      {
        error:
          "No Stripe customer on file. Add a card under this family's primary payer (Family profile → payment method) before charging.",
      },
      { status: 400 },
    );
  }

  const paymentMethod = await resolveDefaultPaymentMethod(
    stripe,
    stripeCustomerId,
  );
  if (!paymentMethod) {
    return Response.json(
      { error: "No saved card on file for this customer." },
      { status: 400 },
    );
  }

  const studentName = `${student.firstName} ${student.lastName}`.trim();
  const fields = buildChargeFields({
    studentId: student.id,
    studentName,
    offering: body.offering,
  });
  const label = (body.label || "").trim().slice(0, 200);
  if (label) fields.metadata.label = label;

  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(body.amount),
      currency: "usd",
      customer: stripeCustomerId,
      payment_method: paymentMethod.id,
      off_session: true,
      confirm: true,
      description: fields.description,
      metadata: fields.metadata,
      // Full descriptor (not _suffix): the suffix field requires a statement
      // descriptor PREFIX configured on the Stripe account; without one, Stripe
      // rejects the PaymentIntent before it's created — the charge "went
      // pending" on our side but never appeared in Stripe (QA 2026-07-05). The
      // full field sets the complete bank-statement text to MATHITUDE with no
      // account prefix required.
      statement_descriptor: fields.statement_descriptor,
    });

    const now = new Date().toISOString();
    await c.send(
      new PutCommand({
        TableName: Tables.payments,
        Item: {
          studentId: student.id,
          createdAt: now,
          amount: body.amount,
          paymentStatus: intent.status === "succeeded" ? "paid" : "pending",
          description: label
            ? `${fields.description} — ${label}`
            : fields.description,
          stripePaymentIntentId: intent.id,
          stripeChargeId:
            (intent.latest_charge as string | undefined) || undefined,
        },
      }),
    );

    return Response.json({
      ok: true,
      paymentIntentId: intent.id,
      status: intent.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Charge failed";
    console.error("[stripe/charge]", err);
    return Response.json({ error: message }, { status: 500 });
  }
}
