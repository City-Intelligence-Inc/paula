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
