import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";
import { notifyAction } from "@/lib/server/notify";
import { ensureDefaultCard, getStripe } from "@/lib/server/stripe";

interface Body {
  parentId?: string;
  detach?: string[];
  setDefaultId?: string;
}

// POST /api/stripe/payment-methods/apply
// Bulk-applies billing changes the user staged in the dashboard "Save
// Changes" flow. Detaches anything in `detach`, then sets `setDefaultId`
// (or self-heals to the newest remaining card if no explicit default).
// All-or-nothing from the user's POV: any Stripe error short-circuits and
// returns a 4xx with a `code` the UI maps to a friendly message.
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
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
  if (!parent) {
    return Response.json({ error: "Parent not found" }, { status: 404 });
  }

  const stripeCustomerId = parent.stripeCustomerId as string | undefined;
  if (!stripeCustomerId) {
    return Response.json(
      { error: "No Stripe customer on file", code: "no_customer" },
      { status: 400 },
    );
  }

  const stripe = await getStripe();
  const detached: string[] = [];

  for (const pmId of body.detach || []) {
    try {
      await stripe.paymentMethods.detach(pmId);
      detached.push(pmId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove card";
      return Response.json(
        { error: `Could not remove card ${pmId}: ${message}`, code: "detach_failed" },
        { status: 400 },
      );
    }
  }

  if (body.setDefaultId) {
    try {
      const pm = await stripe.paymentMethods.retrieve(body.setDefaultId);
      if (pm.customer !== stripeCustomerId) {
        return Response.json(
          {
            error: "That card doesn't belong to this account.",
            code: "wrong_customer",
          },
          { status: 400 },
        );
      }
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: body.setDefaultId },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to set default";
      return Response.json(
        { error: message, code: "set_default_failed" },
        { status: 400 },
      );
    }
  } else {
    // No explicit default requested — self-heal so we never leave the
    // customer with cards on file but no default.
    await ensureDefaultCard(stripe, stripeCustomerId);
  }

  // After all mutations: confirm there is at least one card with a default
  // set. If not, surface error #4 ("error if no default card is set").
  const finalCards = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: "card",
    limit: 100,
  });
  const customer = await stripe.customers.retrieve(stripeCustomerId);
  const finalDefault =
    !("deleted" in customer) || !customer.deleted
      ? ((customer.invoice_settings?.default_payment_method as string) ||
        null)
      : null;

  if (finalCards.data.length > 0 && !finalDefault) {
    return Response.json(
      {
        error:
          "No default card is set. Pick one of your saved cards as the default before saving.",
        code: "no_default",
      },
      { status: 400 },
    );
  }

  const parentName =
    `${(parent.firstName as string) || ""} ${(parent.lastName as string) || ""}`
      .trim() ||
    (parent.email as string) ||
    "Parent";

  await notifyAction({
    kind: "card.saved_changes",
    summary: `${parentName} saved billing changes (${detached.length} removed${
      body.setDefaultId ? ", default updated" : ""
    })`,
    details: {
      parentId: parent.id,
      detached,
      setDefaultId: body.setDefaultId || null,
    },
  }).catch(() => {});

  return Response.json({
    ok: true,
    detached,
    defaultPaymentMethodId: finalDefault,
    cardCount: finalCards.data.length,
  });
}
