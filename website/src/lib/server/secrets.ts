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
  // True when the secret key and publishable key are from different Stripe
  // modes (e.g. sk_live_… paired with pk_test_…). This is the #1 cause of
  // "card won't save" — confirmCardSetup() in the browser uses the
  // publishable key while the SetupIntent is created server-side with the
  // secret key, so a cross-mode pair fails with "No such setupintent".
  modeMismatch: boolean;
  updatedAt: string;
  updatedBy: string;
  source: "portal" | "env" | "none";
}

const CACHE_TTL_MS = 60_000;
let cache: { value: StripeSecrets | null; expires: number } | null = null;

// Trim any whitespace/newlines copied in from env vars — Vercel CLI is known
// to add a trailing \n if you paste a key without stripping it. A malformed
// Authorization header surfaces as a "connection error" after Stripe SDK
// retries, which is confusing to debug.
function clean(v: string | undefined | null): string {
  return (v || "").trim();
}

// Derive the Stripe mode from any key (secret sk_/rk_ or publishable pk_).
// All Stripe keys embed the mode as a "_live_" / "_test_" segment.
function keyMode(k: string | undefined | null): "live" | "test" | null {
  const v = clean(k);
  if (!v) return null;
  if (v.includes("_live_")) return "live";
  if (v.includes("_test_")) return "test";
  return null;
}

// A secret/publishable pair is mismatched only when BOTH modes are known and
// they differ. Unknown modes (e.g. a publishable key still empty) are treated
// as "not mismatched" — the missing-key state is handled separately.
function isModeMismatch(
  secretKey: string | undefined | null,
  publishableKey: string | undefined | null,
): boolean {
  const s = keyMode(secretKey);
  const p = keyMode(publishableKey);
  return !!s && !!p && s !== p;
}

function fromEnv(): StripeSecrets | null {
  const secretKey = clean(process.env.STRIPE_SECRET_KEY);
  if (!secretKey || secretKey.includes("placeholder")) return null;
  const publishableKey = clean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const webhookSecret = clean(process.env.STRIPE_WEBHOOK_SECRET);
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
      const sk = clean(r.Item.secretKey as string);
      value = {
        secretKey: sk,
        publishableKey: clean(r.Item.publishableKey as string),
        webhookSecret: clean(r.Item.webhookSecret as string),
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
    const sk = clean(row.secretKey as string);
    const pk = clean(row.publishableKey as string);
    return {
      mode: sk.startsWith("sk_live_") ? "live" : "test",
      last4: sk.slice(-4),
      publishableKey: pk,
      hasSecretKey: true,
      hasWebhookSecret: !!clean(row.webhookSecret as string),
      modeMismatch: isModeMismatch(sk, pk),
      updatedAt: (row.updatedAt as string) || "",
      updatedBy: (row.updatedBy as string) || "unknown",
      source: "portal",
    };
  }
  if (source === "env") {
    const sk = clean(process.env.STRIPE_SECRET_KEY);
    const pk = clean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    return {
      mode: sk.startsWith("sk_live_") ? "live" : "test",
      last4: sk.slice(-4),
      publishableKey: pk,
      hasSecretKey: true,
      hasWebhookSecret: !!clean(process.env.STRIPE_WEBHOOK_SECRET),
      modeMismatch: isModeMismatch(sk, pk),
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
    modeMismatch: false,
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

  // Reject cross-mode key pairs. A live secret key with a test publishable
  // key (or vice versa) passes the individual format checks but silently
  // breaks card saving: the browser confirms the card against one Stripe
  // account while the SetupIntent was created against the other, so
  // confirmCardSetup() fails with "No such setupintent". Catch it here
  // instead of at first-card-save time.
  if (isModeMismatch(secretKey, publishableKey)) {
    throw new Error(
      `Stripe key mode mismatch: the secret key is ${keyMode(secretKey)} but the ` +
        `publishable key is ${keyMode(publishableKey)}. Both keys must be from the ` +
        `same Stripe mode (both test, or both live) or cards will not save.`,
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
