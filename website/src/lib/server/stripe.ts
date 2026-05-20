import Stripe from "stripe";
import { getStripeSecrets } from "@/lib/server/secrets";

// getStripe() is async because the secret key is sourced from DynamoDB
// (set by an admin via /admin/settings/stripe) with an env-var fallback.
// Each runtime instance caches the resolved client for ~60s — see
// secrets.ts for cache details.
let _stripe: Stripe | null = null;
let _stripeKey: string | null = null;

export async function getStripe(): Promise<Stripe> {
  const secrets = await getStripeSecrets();
  if (!secrets?.secretKey) {
    throw new Error(
      "Stripe is not configured. An admin must add the secret key in Settings → Stripe.",
    );
  }
  if (_stripe && _stripeKey === secrets.secretKey) return _stripe;
  _stripe = new Stripe(secrets.secretKey);
  _stripeKey = secrets.secretKey;
  return _stripe;
}

export async function getWebhookSecret(): Promise<string | null> {
  const secrets = await getStripeSecrets();
  return secrets?.webhookSecret || null;
}

export async function isStripeConfigured(): Promise<boolean> {
  const secrets = await getStripeSecrets();
  return !!secrets?.secretKey;
}

// Enforce single-card-per-customer:
// - Sets the given paymentMethodId as the customer's default
//   (invoice_settings.default_payment_method) so charges + the Stripe
//   dashboard "Default" badge agree with the most recent card.
// - Detaches every OTHER card on the customer so there's only one card on
//   file. Avoids the multi-card confusion Paula flagged where adding a new
//   card in our UI didn't update what Stripe charged.
//
// Idempotent. Safe to call from the webhook and from a client-triggered
// finalize endpoint.
export async function enforceSingleCardForCustomer(
  stripe: Stripe,
  customerId: string,
  paymentMethodId: string,
): Promise<{
  defaultPaymentMethodId: string;
  detached: string[];
}> {
  // Make sure the new PM is attached + is the default before we detach
  // anything else (so we never momentarily leave the customer with zero
  // cards if there's a partial failure mid-routine).
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (pm.customer !== customerId) {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const others = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
    limit: 100,
  });
  const detached: string[] = [];
  for (const other of others.data) {
    if (other.id === paymentMethodId) continue;
    try {
      await stripe.paymentMethods.detach(other.id);
      detached.push(other.id);
    } catch (err) {
      console.warn(
        "[enforceSingleCardForCustomer] detach failed",
        other.id,
        err,
      );
    }
  }

  return { defaultPaymentMethodId: paymentMethodId, detached };
}

// Resolve which PaymentMethod to charge for a customer.
// Prefers customer.invoice_settings.default_payment_method (the field the
// "Set as default" UI writes and the one Stripe's dashboard surfaces as
// "Default"). Falls back to the most recent card on file so legacy customers
// who pre-date the default-card UI still get charged.
export async function resolveDefaultPaymentMethod(
  stripe: Stripe,
  customerId: string,
): Promise<Stripe.PaymentMethod | null> {
  const customer = await stripe.customers.retrieve(customerId);
  if ("deleted" in customer && customer.deleted) return null;

  const defaultPmId = customer.invoice_settings?.default_payment_method as
    | string
    | Stripe.PaymentMethod
    | null
    | undefined;

  if (defaultPmId) {
    if (typeof defaultPmId !== "string") return defaultPmId;
    try {
      const pm = await stripe.paymentMethods.retrieve(defaultPmId);
      if (pm.customer === customerId) return pm;
    } catch {
      // Default PM was detached or never attached — fall through to first card.
    }
  }

  const pmList = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
    limit: 1,
  });
  return pmList.data[0] ?? null;
}

// ---------------------------------------------------------
// Privacy guardrails — Phase 2 Week 5 acceptance criteria.
// statement_descriptor is hardcoded to "MATHITUDE" — never
// take from user input. Student names go ONLY in metadata
// and description fields. They must never reach Stripe
// fields that surface on a bank statement.
// ---------------------------------------------------------

export const STATEMENT_DESCRIPTOR = "MATHITUDE";

export function buildChargeFields({
  studentId,
  studentName,
  sessionId,
  sessionDate,
  offering = "private-tutoring",
}: {
  studentId: string;
  studentName: string;
  sessionId?: string;
  sessionDate?: string;
  offering?: string;
}): {
  description: string;
  metadata: Record<string, string>;
  statement_descriptor: string;
} {
  const description = sessionDate
    ? `Mathitude tutoring — ${studentName} (${sessionDate})`
    : `Mathitude tutoring — ${studentName}`;
  const metadata: Record<string, string> = {
    studentId,
    studentName,
    offering,
  };
  if (sessionId) metadata.sessionId = sessionId;
  if (sessionDate) metadata.sessionDate = sessionDate;
  return {
    description,
    metadata,
    statement_descriptor: STATEMENT_DESCRIPTOR,
  };
}
