import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";
import { getStripe } from "@/lib/server/stripe";

interface Body {
  parentId?: string;
  paymentMethodId?: string;
}

// POST /api/stripe/payment-methods/set-default
// Body: { parentId, paymentMethodId }
// Sets the parent's customer.invoice_settings.default_payment_method so that
// future off-session charges (Phase 3 approval queue) use that card.
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.paymentMethodId) {
    return Response.json(
      { error: "paymentMethodId is required" },
      { status: 400 },
    );
  }

  const c = ddb();
  let parent: Record<string, unknown> | null = null;
  if (body.parentId) {
    const r = await c.send(
      new GetCommand({ TableName: Tables.parents, Key: { id: body.parentId } }),
    );
    parent = (r.Item as Record<string, unknown>) || null;
  } else {
    const ps = await c.send(
      new ScanCommand({
        TableName: Tables.parents,
        FilterExpression: "clerkUserId = :u",
        ExpressionAttributeValues: { ":u": auth.userId },
      }),
    );
    const matches = (ps.Items as Record<string, unknown>[]) || [];
    matches.sort(
      (a, b) =>
        new Date((b.createdAt as string) || 0).getTime() -
        new Date((a.createdAt as string) || 0).getTime(),
    );
    parent = matches[0] || null;
  }
  if (!parent?.stripeCustomerId) {
    return Response.json(
      { error: "No Stripe customer on file for this parent" },
      { status: 400 },
    );
  }

  const stripe = await getStripe();
  await stripe.customers.update(parent.stripeCustomerId as string, {
    invoice_settings: { default_payment_method: body.paymentMethodId },
  });
  return Response.json({ ok: true, defaultPaymentMethodId: body.paymentMethodId });
}
