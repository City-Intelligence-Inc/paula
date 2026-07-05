import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";
import { notifyAction } from "@/lib/server/notify";
import { ensureDefaultCard, getStripe } from "@/lib/server/stripe";

// DELETE /api/stripe/payment-methods/:id  → detach a payment method.
// Stripe doesn't actually delete the PM record, but detach removes it from
// the customer so it won't be used for future charges.
//
// Default-card invariant: if the PM being detached is the customer's current
// default (invoice_settings.default_payment_method) AND other cards remain,
// promote the newest remaining card to default before responding. This
// guarantees the customer always has a default card whenever any card is on
// file — charges via resolveDefaultPaymentMethod never silently fall back to
// "whichever Stripe happens to list first."
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const stripe = await getStripe();
  try {
    const pm = await stripe.paymentMethods.retrieve(id);
    const customerId =
      typeof pm.customer === "string" ? pm.customer : pm.customer?.id;

    const detached = await stripe.paymentMethods.detach(id);

    if (customerId) {
      await ensureDefaultCard(stripe, customerId);

      // B-5 gate marker: if this was the customer's last card, clear
      // cardOnFile on the matching parent so the dashboard gate re-engages.
      try {
        const remaining = await stripe.paymentMethods.list({
          customer: customerId,
          type: "card",
          limit: 1,
        });
        if (remaining.data.length === 0) {
          const ps = await ddb().send(
            new ScanCommand({
              TableName: Tables.parents,
              FilterExpression: "stripeCustomerId = :c",
              ExpressionAttributeValues: { ":c": customerId },
            }),
          );
          for (const p of (ps.Items || []) as { id: string }[]) {
            await ddb().send(
              new UpdateCommand({
                TableName: Tables.parents,
                Key: { id: p.id },
                UpdateExpression: "SET cardOnFile = :f",
                ExpressionAttributeValues: { ":f": false },
              }),
            );
          }
        }
      } catch (err) {
        console.warn("[payment-methods.delete] cardOnFile clear failed:", err);
      }
    }

    await notifyAction({
      kind: "card.removed",
      summary: `Card detached: ${pm.card?.brand || "card"} ending in ${pm.card?.last4 || "????"}`,
      details: {
        customer: customerId || null,
        brand: pm.card?.brand || null,
        last4: pm.card?.last4 || null,
        paymentMethodId: id,
      },
    }).catch(() => {});

    return Response.json({ ok: true, id: detached.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "detach failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
