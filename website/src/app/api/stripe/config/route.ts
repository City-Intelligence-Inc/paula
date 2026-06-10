import { getStripeMeta } from "@/lib/server/secrets";

// GET /api/stripe/config
// Returns ONLY the publishable key + mode for client-side loadStripe().
// Publishable keys are designed to be exposed publicly. The secret key
// and webhook secret are never returned by this route.
export async function GET() {
  const meta = await getStripeMeta();
  return Response.json({
    publishableKey: meta.publishableKey,
    mode: meta.mode,
    // A cross-mode key pair must not be treated as configured — loading
    // Stripe with a publishable key that doesn't match the server's secret
    // key produces the cryptic "No such setupintent" failure on save.
    configured: meta.hasSecretKey && !!meta.publishableKey && !meta.modeMismatch,
    modeMismatch: meta.modeMismatch,
  });
}
