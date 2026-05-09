import Stripe from "stripe";
import { getStripeSecrets } from "./secrets";

// Singleton client. Source of truth for the secret key is the
// `mathitude-secrets` DynamoDB row (set by an admin via the portal at
// /admin/settings/stripe). Falls back to STRIPE_SECRET_KEY env var so
// existing deployments keep working until the portal write happens.
let _stripe: Stripe | null = null;
let _key: string | null = null;

export async function getStripe(): Promise<Stripe> {
  const secrets = await getStripeSecrets();
  if (!secrets?.secretKey) {
    throw new Error(
      "Stripe is not configured. An admin must add the secret key in the portal Settings → Stripe."
    );
  }
  if (_stripe && _key === secrets.secretKey) return _stripe;
  _stripe = new Stripe(secrets.secretKey);
  _key = secrets.secretKey;
  return _stripe;
}

export async function getWebhookSecret(): Promise<string | null> {
  const secrets = await getStripeSecrets();
  return secrets?.webhookSecret || null;
}

// Privacy guardrails — Phase 2 Week 5.
// statement_descriptor is hardcoded to MATHITUDE; student names go ONLY
// in metadata + description.
export const STATEMENT_DESCRIPTOR = "MATHITUDE";
