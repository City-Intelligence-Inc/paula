import Stripe from "stripe";
import { requireAdmin } from "@/lib/server/ddb";
import {
  getStripeMeta,
  setStripeSecrets,
  invalidateStripeCache,
} from "@/lib/server/secrets";

// GET /api/admin/secrets/stripe
// Admin-only. Returns metadata only — never the full secret key.
// Browser receives: { mode, last4, publishableKey, hasSecretKey,
// hasWebhookSecret, updatedAt, updatedBy, source }.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const meta = await getStripeMeta();
  return Response.json(meta);
}

interface PutBody {
  secretKey?: string;
  publishableKey?: string;
  webhookSecret?: string;
}

// PUT /api/admin/secrets/stripe
// Admin-only. Validates the secret key by issuing a real API call
// (balance.retrieve) before writing it to DynamoDB. This catches
// typos and revoked keys at save-time instead of first-charge-time.
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: PutBody;
  try {
    body = (await request.json()) as PutBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const candidate = body.secretKey?.trim();
  if (candidate) {
    if (
      !candidate.startsWith("sk_test_") &&
      !candidate.startsWith("sk_live_") &&
      !candidate.startsWith("rk_")
    ) {
      return Response.json(
        {
          error:
            "Secret key must start with sk_test_, sk_live_, or rk_ (restricted key).",
        },
        { status: 400 },
      );
    }
    try {
      const tester = new Stripe(candidate);
      await tester.balance.retrieve();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Stripe key validation failed";
      return Response.json(
        { error: `Stripe rejected the key: ${message}` },
        { status: 400 },
      );
    }
  }

  if (
    body.publishableKey !== undefined &&
    body.publishableKey.trim() &&
    !body.publishableKey.trim().startsWith("pk_")
  ) {
    return Response.json(
      { error: "Publishable key must start with pk_." },
      { status: 400 },
    );
  }
  if (
    body.webhookSecret !== undefined &&
    body.webhookSecret.trim() &&
    !body.webhookSecret.trim().startsWith("whsec_")
  ) {
    return Response.json(
      { error: "Webhook secret must start with whsec_." },
      { status: 400 },
    );
  }

  try {
    await setStripeSecrets({
      secretKey: candidate,
      publishableKey: body.publishableKey,
      webhookSecret: body.webhookSecret,
      updatedBy: auth.userId!,
    });
    invalidateStripeCache();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 400 });
  }

  const meta = await getStripeMeta();
  return Response.json(meta);
}
