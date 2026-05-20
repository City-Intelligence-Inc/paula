import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";
import { ensureDefaultCard, getStripe } from "@/lib/server/stripe";

// GET /api/stripe/payment-methods?parentId=...
// or  /api/stripe/payment-methods   (auto-resolves the signed-in parent)
//
// Returns the cards on file for a parent's Stripe customer plus which one is
// currently the default. Card-number is never returned — Stripe sends back
// brand + last4 + exp only.
export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId") || undefined;
  const c = ddb();

  let parent: Record<string, unknown> | null = null;
  if (parentId) {
    const r = await c.send(
      new GetCommand({ TableName: Tables.parents, Key: { id: parentId } }),
    );
    parent = (r.Item as Record<string, unknown>) || null;
  } else {
    // No Limit — Scan applies Limit before FilterExpression, so Limit:1
    // would miss matches when the first item on disk doesn't match.
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

  if (!parent) {
    return Response.json({ error: "Parent not found" }, { status: 404 });
  }

  const stripeCustomerId = parent.stripeCustomerId as string | undefined;
  if (!stripeCustomerId) {
    return Response.json({
      parentId: parent.id,
      stripeCustomerId: null,
      paymentMethods: [],
      defaultPaymentMethodId: null,
    });
  }

  const stripe = await getStripe();

  // Self-heal the default-card invariant before reading. If cards exist but
  // no default is set (legacy customers from before single-card-per-customer
  // enforcement, or a Stripe-dashboard manual edit), promote the newest card
  // to default. ensureDefaultCard is idempotent + no-op when state is fine.
  await ensureDefaultCard(stripe, stripeCustomerId);

  const [pmList, customer] = await Promise.all([
    stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: "card",
      limit: 20,
    }),
    stripe.customers.retrieve(stripeCustomerId),
  ]);

  const defaultPmId =
    !("deleted" in customer) || !customer.deleted
      ? (customer.invoice_settings?.default_payment_method as
          | string
          | null) ?? null
      : null;

  // Default card first, then newest → oldest. Matches the "Default" badge
  // Stripe surfaces on the dashboard and the order this app's charge path
  // selects (resolveDefaultPaymentMethod).
  const paymentMethods = pmList.data
    .slice()
    .sort((a, b) => {
      const aDefault = a.id === defaultPmId ? 1 : 0;
      const bDefault = b.id === defaultPmId ? 1 : 0;
      if (aDefault !== bDefault) return bDefault - aDefault;
      return b.created - a.created;
    })
    .map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      funding: pm.card?.funding,
      created: new Date(pm.created * 1000).toISOString(),
      isDefault: pm.id === defaultPmId,
    }));

  return Response.json({
    parentId: parent.id,
    stripeCustomerId,
    paymentMethods,
    defaultPaymentMethodId: defaultPmId,
  });
}
