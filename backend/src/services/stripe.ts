import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia",
});

export async function createCustomer(
  email: string,
  name: string
): Promise<Stripe.Customer> {
  return stripe.customers.create({ email, name });
}

export async function createSubscription(
  customerId: string,
  priceInCents: number,
  interval: "week" | "month"
): Promise<Stripe.Subscription> {
  // Create a price object for the subscription
  const price = await stripe.prices.create({
    unit_amount: priceInCents,
    currency: "usd",
    recurring: { interval },
    product_data: {
      name: "Mathitude Tutoring Package",
    },
  });

  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.cancel(subscriptionId);
}

export async function createPaymentIntent(
  amountInCents: number,
  customerId: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    customer: customerId,
    metadata,
  });
}

export async function constructWebhookEvent(
  body: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder";
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

export function billingIntervalToStripeInterval(
  interval: string
): "week" | "month" {
  switch (interval) {
    case "WEEKLY":
      return "week";
    case "BIWEEKLY":
      return "week"; // Stripe doesn't have biweekly; handle via interval_count
    case "MONTHLY":
      return "month";
    default:
      return "month";
  }
}

export default stripe;
