import { requireUser } from "@/lib/server/ddb";
import { getStripe } from "@/lib/server/stripe";

// DELETE /api/stripe/payment-methods/:id  → detach a payment method.
// Stripe doesn't actually delete the PM record, but detach removes it from
// the customer so it won't be used for future charges.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  const stripe = await getStripe();
  try {
    const detached = await stripe.paymentMethods.detach(id);
    return Response.json({ ok: true, id: detached.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "detach failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
