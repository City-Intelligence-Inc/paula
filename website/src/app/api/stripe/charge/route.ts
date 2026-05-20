import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";
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
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

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
      { error: "No Stripe customer on file. Save a card first." },
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
      statement_descriptor_suffix: fields.statement_descriptor,
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
          description: fields.description,
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
