import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";

// Stripe configuration is stored in `mathitude-secrets` (single row,
// id="stripe"). The DDB table is encrypted at rest with the
// AWS-managed KMS key. The full secretKey + webhookSecret are NEVER
// returned by any public route — only the metadata view (`getStripeMeta`)
// is safe to ship to the browser.
//
// In-memory cache keeps the hot path fast (60s TTL) so live charges don't
// pay an extra DDB roundtrip per request. The cache is per-runtime instance
// — a redeploy or admin write invalidates it.

export interface StripeSecrets {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  mode: "test" | "live";
  last4: string;
  updatedAt: string;
  updatedBy: string;
}

export interface StripeMeta {
  mode: "test" | "live" | null;
  last4: string;
  publishableKey: string;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  updatedAt: string;
  updatedBy: string;
  source: "portal" | "env" | "none";
}

const CACHE_TTL_MS = 60_000;
let cache: { value: StripeSecrets | null; expires: number } | null = null;

function fromEnv(): StripeSecrets | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.includes("placeholder")) return null;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  return {
    secretKey,
    publishableKey,
    webhookSecret,
    mode: secretKey.startsWith("sk_live_") ? "live" : "test",
    last4: secretKey.slice(-4),
    updatedAt: "",
    updatedBy: "env",
  };
}

export async function getStripeSecrets(): Promise<StripeSecrets | null> {
  if (cache && cache.expires > Date.now()) return cache.value;
  let value: StripeSecrets | null = null;
  try {
    const r = await ddb().send(
      new GetCommand({ TableName: Tables.secrets, Key: { id: "stripe" } }),
    );
    if (r.Item?.secretKey) {
      const sk = r.Item.secretKey as string;
      value = {
        secretKey: sk,
        publishableKey: (r.Item.publishableKey as string) || "",
        webhookSecret: (r.Item.webhookSecret as string) || "",
        mode: sk.startsWith("sk_live_") ? "live" : "test",
        last4: sk.slice(-4),
        updatedAt: (r.Item.updatedAt as string) || "",
        updatedBy: (r.Item.updatedBy as string) || "unknown",
      };
    }
  } catch (err) {
    console.warn("[getStripeSecrets] DDB read failed, falling back to env:", err);
  }
  if (!value) value = fromEnv();
  cache = { value, expires: Date.now() + CACHE_TTL_MS };
  return value;
}

export async function getStripeMeta(): Promise<StripeMeta> {
  let source: StripeMeta["source"] = "none";
  let row: Record<string, unknown> | undefined;
  try {
    const r = await ddb().send(
      new GetCommand({ TableName: Tables.secrets, Key: { id: "stripe" } }),
    );
    row = r.Item;
  } catch {
    // ignore
  }
  if (row?.secretKey) source = "portal";
  else if (process.env.STRIPE_SECRET_KEY) source = "env";

  if (source === "portal" && row) {
    const sk = row.secretKey as string;
    return {
      mode: sk.startsWith("sk_live_") ? "live" : "test",
      last4: sk.slice(-4),
      publishableKey: (row.publishableKey as string) || "",
      hasSecretKey: true,
      hasWebhookSecret: !!row.webhookSecret,
      updatedAt: (row.updatedAt as string) || "",
      updatedBy: (row.updatedBy as string) || "unknown",
      source: "portal",
    };
  }
  if (source === "env") {
    const sk = process.env.STRIPE_SECRET_KEY!;
    return {
      mode: sk.startsWith("sk_live_") ? "live" : "test",
      last4: sk.slice(-4),
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      hasSecretKey: true,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      updatedAt: "",
      updatedBy: "env",
      source: "env",
    };
  }
  return {
    mode: null,
    last4: "",
    publishableKey: "",
    hasSecretKey: false,
    hasWebhookSecret: false,
    updatedAt: "",
    updatedBy: "",
    source: "none",
  };
}

export async function setStripeSecrets(input: {
  secretKey?: string;
  publishableKey?: string;
  webhookSecret?: string;
  updatedBy: string;
}): Promise<void> {
  const existing = await getStripeSecrets();
  const secretKey = input.secretKey?.trim() || existing?.secretKey || "";
  const publishableKey =
    input.publishableKey?.trim() ?? existing?.publishableKey ?? "";
  const webhookSecret =
    input.webhookSecret?.trim() ?? existing?.webhookSecret ?? "";

  if (!secretKey) {
    throw new Error("Secret key is required.");
  }
  if (
    !secretKey.startsWith("sk_test_") &&
    !secretKey.startsWith("sk_live_") &&
    !secretKey.startsWith("rk_")
  ) {
    throw new Error(
      "Secret key must start with sk_test_, sk_live_, or rk_ (restricted key).",
    );
  }

  await ddb().send(
    new PutCommand({
      TableName: Tables.secrets,
      Item: {
        id: "stripe",
        secretKey,
        publishableKey,
        webhookSecret,
        updatedAt: new Date().toISOString(),
        updatedBy: input.updatedBy,
      },
    }),
  );
  cache = null; // invalidate on write
}

export function invalidateStripeCache() {
  cache = null;
}
