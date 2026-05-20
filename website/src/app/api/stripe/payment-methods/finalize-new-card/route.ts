import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";
import { enforceSingleCardForCustomer, getStripe } from "@/lib/server/stripe";

interface Body {
  parentId?: string;
  paymentMethodId?: string;
}

// POST /api/stripe/payment-methods/finalize-new-card
// Body: { parentId?, paymentMethodId? }
//
// Called by SaveCardForm right after stripe.confirmCardSetup() succeeds.
// Enforces the single-card-per-customer policy: the just-saved PM becomes
// the default and every older card on the customer is detached. Mirrors the
// webhook handler for setup_intent.succeeded — either path on its own is
// sufficient; both are wired so the invariant holds even if webhooks aren't
// configured in this environment.
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // empty body is fine — we'll resolve parent + newest PM ourselves
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
  const customerId = parent.stripeCustomerId as string;

  let paymentMethodId = body.paymentMethodId;
  if (!paymentMethodId) {
    // Fallback: pick the most recently created card on the customer.
    const pmList = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
      limit: 20,
    });
    const newest = pmList.data
      .slice()
      .sort((a, b) => b.created - a.created)[0];
    paymentMethodId = newest?.id;
  }
  if (!paymentMethodId) {
    return Response.json(
      { error: "No payment method found on customer" },
      { status: 400 },
    );
  }

  const result = await enforceSingleCardForCustomer(
    stripe,
    customerId,
    paymentMethodId,
  );
  return Response.json({ ok: true, ...result });
}
