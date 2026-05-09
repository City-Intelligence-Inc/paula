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
    configured: meta.hasSecretKey && !!meta.publishableKey,
  });
}
