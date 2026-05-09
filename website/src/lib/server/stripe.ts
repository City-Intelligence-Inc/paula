import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// ---------------------------------------------------------
// Privacy guardrails — Phase 2 Week 5 acceptance criteria.
// statement_descriptor is hardcoded to "MATHITUDE" — never
// take from user input. Student names go ONLY in metadata
// and description fields. They must never reach Stripe
// fields that surface on a bank statement.
// ---------------------------------------------------------

export const STATEMENT_DESCRIPTOR = "MATHITUDE";

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!key && !key.includes("placeholder");
}

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
