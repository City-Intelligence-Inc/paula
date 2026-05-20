import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";
import { sendAdminNotification } from "@/lib/server/notify";
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

  // Admin notification: per Paula's 5/17 note ("Can we get some sort of
  // notification sent to the admin email with the last 4 digits of the card?").
  // We write a structured event into the notifications table so an admin inbox
  // can render recent card-changes. The Stripe-side last4/brand are fetched
  // off the PM we just promoted to default. Best-effort — never block the
  // card-save UX if DDB write fails.
  try {
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    const last4 = pm.card?.last4 || "????";
    const brand = pm.card?.brand || "card";
    const parentName =
      `${(parent.firstName as string) || ""} ${(parent.lastName as string) || ""}`
        .trim() || (parent.email as string) || "Unknown parent";
    const now = new Date().toISOString();
    await c.send(
      new PutCommand({
        TableName: Tables.notifications,
        Item: {
          id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: now,
          kind: "payment_method.updated",
          parentId: parent.id,
          parentName,
          parentEmail: (parent.email as string) || null,
          last4,
          brand,
          paymentMethodId,
          read: false,
        },
      }),
    );
    console.log(
      "[notification] payment_method.updated",
      JSON.stringify({
        parentId: parent.id,
        parentName,
        brand,
        last4,
      }),
    );

    // Email admin via Resend (best-effort, never blocks the card-save UX).
    const brandTitle = brand.charAt(0).toUpperCase() + brand.slice(1);
    const emailRes = await sendAdminNotification({
      subject: `Mathitude: ${parentName} updated their card (${brandTitle} •••• ${last4})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #7030A0; margin: 0 0 16px;">Payment method updated</h2>
          <p style="color: #111; font-size: 15px; line-height: 1.5; margin: 0 0 12px;">
            <strong>${parentName}</strong> just saved a new card on file.
          </p>
          <table style="border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">Card</td><td style="padding: 4px 0; color: #111;"><strong>${brandTitle}</strong> ending in <strong>${last4}</strong></td></tr>
            ${parent.email ? `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Email</td><td style="padding: 4px 0; color: #111;">${parent.email}</td></tr>` : ""}
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">Parent ID</td><td style="padding: 4px 0; color: #111; font-family: monospace; font-size: 12px;">${parent.id}</td></tr>
          </table>
          <p style="color: #666; font-size: 13px; line-height: 1.5; margin: 16px 0 0;">
            Older cards on this customer were automatically detached
            (single-card-per-customer policy). The new card is now the default
            for all future charges.
          </p>
        </div>
      `,
      text: `${parentName} updated their card. Now using ${brandTitle} ending in ${last4}. Parent ID: ${parent.id}.`,
    });
    if (!emailRes.ok) {
      console.warn("[finalize-new-card] email send failed:", emailRes.error);
    }
  } catch (err) {
    console.warn("[finalize-new-card] notification write failed:", err);
  }

  return Response.json({ ok: true, ...result });
}
