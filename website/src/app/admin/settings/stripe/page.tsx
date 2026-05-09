"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

interface StripeMeta {
  mode: "test" | "live" | null;
  last4: string;
  publishableKey: string;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  updatedAt: string;
  updatedBy: string;
  source: "portal" | "env" | "none";
}

export default function StripeSettingsPage() {
  const fetchApi = useApi();
  const [meta, setMeta] = useState<StripeMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);

  const [secretKey, setSecretKey] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  async function load() {
    try {
      const res = await fetchApi("/api/admin/secrets/stripe");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setMeta(data);
      setPublishableKey(data.publishableKey || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: Record<string, string> = {};
    if (secretKey.trim()) payload.secretKey = secretKey.trim();
    if (publishableKey.trim() !== (meta?.publishableKey || "")) {
      payload.publishableKey = publishableKey.trim();
    }
    if (webhookSecret.trim()) payload.webhookSecret = webhookSecret.trim();

    if (Object.keys(payload).length === 0) {
      setError("Nothing to save — fill in at least one field.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetchApi("/api/admin/secrets/stripe", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMeta(data);
      setSecretKey("");
      setWebhookSecret("");
      setSuccess("Saved. Stripe is now configured for the platform.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to settings
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mt-2">
          Stripe configuration
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Add your Stripe API keys here. They&rsquo;re stored encrypted and
          never displayed back in full. Only admins can view or change this
          page.
        </p>
      </div>

      <Card className="border border-neutral-200 rounded-lg bg-white">
        <CardHeader>
          <CardTitle className="text-neutral-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-mathitude-purple" />
            Current status
          </CardTitle>
          <CardDescription>
            Where the platform is reading its Stripe credentials from right
            now.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row
            label="Secret key"
            value={
              meta?.hasSecretKey ? (
                <span className="font-mono text-sm">
                  sk_{meta.mode}_••••{meta.last4}
                </span>
              ) : (
                <span className="text-red-500">Not set</span>
              )
            }
            badge={
              meta?.mode === "live" ? (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                  LIVE MODE
                </Badge>
              ) : meta?.mode === "test" ? (
                <Badge className="bg-neutral-900/5 text-neutral-900 border-neutral-200">
                  test mode
                </Badge>
              ) : null
            }
          />
          <Row
            label="Publishable key"
            value={
              meta?.publishableKey ? (
                <span className="font-mono text-sm">
                  {meta.publishableKey.slice(0, 12)}…
                </span>
              ) : (
                <span className="text-red-500">Not set</span>
              )
            }
          />
          <Row
            label="Webhook secret"
            value={
              meta?.hasWebhookSecret ? (
                <span className="font-mono text-sm">whsec_••••</span>
              ) : (
                <span className="text-amber-600">
                  Not set (charges work, but reconciliation won&rsquo;t)
                </span>
              )
            }
          />
          <Row
            label="Source"
            value={
              meta?.source === "portal" ? (
                <span className="text-neutral-600">
                  Saved through this page
                  {meta.updatedAt &&
                    ` · ${new Date(meta.updatedAt).toLocaleString()}`}
                </span>
              ) : meta?.source === "env" ? (
                <span className="text-neutral-600">
                  Vercel environment variable (legacy fallback)
                </span>
              ) : (
                <span className="text-red-500">Not configured</span>
              )
            }
          />
        </CardContent>
      </Card>

      <Card className="border border-neutral-200 rounded-lg bg-white">
        <CardHeader>
          <CardTitle className="text-neutral-900">
            Update Stripe credentials
          </CardTitle>
          <CardDescription>
            Find these at{" "}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noreferrer"
              className="underline text-mathitude-purple"
            >
              dashboard.stripe.com/apikeys
            </a>
            . Leave a field blank to keep the current value.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-5">
            <Field
              label="Secret key (sk_live_… or sk_test_…)"
              type={showSecret ? "text" : "password"}
              value={secretKey}
              onChange={setSecretKey}
              placeholder={
                meta?.hasSecretKey
                  ? `Currently sk_${meta.mode}_••••${meta.last4}`
                  : "sk_live_… or sk_test_…"
              }
              toggleVisible={() => setShowSecret((v) => !v)}
              isVisible={showSecret}
              autoComplete="off"
              spellCheck={false}
              required={!meta?.hasSecretKey}
            />
            <Field
              label="Publishable key (pk_…)"
              type="text"
              value={publishableKey}
              onChange={setPublishableKey}
              placeholder="pk_live_… or pk_test_…"
              autoComplete="off"
              spellCheck={false}
            />
            <Field
              label="Webhook signing secret (whsec_…)"
              type={showWebhook ? "text" : "password"}
              value={webhookSecret}
              onChange={setWebhookSecret}
              placeholder={
                meta?.hasWebhookSecret
                  ? "Currently set — leave blank to keep"
                  : "whsec_…"
              }
              toggleVisible={() => setShowWebhook((v) => !v)}
              isVisible={showWebhook}
              autoComplete="off"
              spellCheck={false}
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="bg-mathitude-purple text-white hover:bg-mathitude-purple/90"
              >
                {saving ? "Validating with Stripe…" : "Save"}
              </Button>
              <p className="text-xs text-neutral-400">
                We&rsquo;ll call Stripe&rsquo;s API once to verify the secret key
                before saving.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-amber-200 rounded-lg bg-amber-50">
        <CardContent className="py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 space-y-1">
            <p className="font-semibold">Live keys move real money.</p>
            <p>
              Always verify with a $1 test charge before approving a full
              billing run. The platform locks the bank-statement descriptor to{" "}
              <code className="rounded bg-white px-1 border border-amber-200">
                MATHITUDE
              </code>{" "}
              so client statements stay clean.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-neutral-200 rounded-lg bg-white">
        <CardHeader>
          <CardTitle className="text-neutral-900 text-base">
            Webhook setup
          </CardTitle>
          <CardDescription>
            One-time configuration in the Stripe dashboard so charges
            reconcile back to the portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-neutral-600">
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              In Stripe → Developers → Webhooks, click{" "}
              <strong>Add endpoint</strong>.
            </li>
            <li>
              Endpoint URL:{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/stripe/webhook`
                  : "https://<your-domain>/api/stripe/webhook"}
              </code>
            </li>
            <li>
              Subscribe to: <code>payment_intent.succeeded</code>,{" "}
              <code>payment_intent.payment_failed</code>,{" "}
              <code>charge.refunded</code>.
            </li>
            <li>
              Copy the <strong>Signing secret</strong> (starts with{" "}
              <code>whsec_</code>) and paste it above.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  badge,
}: {
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="flex items-center gap-2">
        {value}
        {badge}
      </span>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  toggleVisible,
  isVisible,
  autoComplete,
  spellCheck,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  toggleVisible?: () => void;
  isVisible?: boolean;
  autoComplete?: string;
  spellCheck?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          spellCheck={spellCheck}
          required={required}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 pr-10 text-sm text-neutral-900 font-mono placeholder:text-neutral-300 focus:border-mathitude-purple focus:outline-none focus:ring-2 focus:ring-mathitude-purple/20"
        />
        {toggleVisible && (
          <button
            type="button"
            onClick={toggleVisible}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700"
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
