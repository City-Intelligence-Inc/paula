"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Trash2, Star, RefreshCw } from "lucide-react";

interface PaymentMethod {
  id: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

interface PMResponse {
  parentId: string;
  stripeCustomerId: string | null;
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string | null;
}

// PaymentMethodsPanel — reusable list+default+detach UI.
// Pass `parentId` to scope to a specific parent (admin view); omit to use the
// signed-in parent's own customer (parent dashboard view).
export function PaymentMethodsPanel({ parentId }: { parentId?: string } = {}) {
  const fetchApi = useApi();
  const [data, setData] = useState<PMResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = parentId ? `?parentId=${encodeURIComponent(parentId)}` : "";
      const res = await fetchApi(`/api/stripe/payment-methods${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  async function setDefault(pmId: string) {
    setBusy(pmId);
    setError(null);
    try {
      const res = await fetchApi("/api/stripe/payment-methods/set-default", {
        method: "POST",
        body: JSON.stringify({ parentId, paymentMethodId: pmId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function detach(pmId: string) {
    if (!window.confirm("Remove this card from this customer?")) return;
    setBusy(pmId);
    setError(null);
    try {
      const res = await fetchApi(`/api/stripe/payment-methods/${pmId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <Card className="border border-neutral-200 rounded-lg">
        <CardContent className="py-6 text-sm text-neutral-500">
          Loading payment methods…
        </CardContent>
      </Card>
    );
  }

  if (!data?.stripeCustomerId) {
    return (
      <Card className="border border-neutral-200 rounded-lg bg-neutral-50">
        <CardContent className="py-4 text-sm text-neutral-500">
          No Stripe customer on file. The customer is created automatically
          when the parent saves a card for the first time.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          Stripe customer{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[11px]">
            {data.stripeCustomerId}
          </code>
        </p>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {data.paymentMethods.length === 0 ? (
        <Card className="border border-neutral-200 rounded-lg bg-neutral-50">
          <CardContent className="py-4 text-sm text-neutral-500">
            No cards saved yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.paymentMethods.map((pm) => (
            <Card
              key={pm.id}
              className="py-0 border border-neutral-200 rounded-lg"
            >
              <CardContent className="flex flex-wrap items-center gap-3 py-3">
                <CreditCard className="h-4 w-4 text-neutral-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">
                    {(pm.brand || "card").toUpperCase()} ••••{" "}
                    {pm.last4 || "????"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Expires {String(pm.expMonth).padStart(2, "0")}/{pm.expYear}
                  </p>
                </div>
                {pm.isDefault ? (
                  <Badge className="bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDefault(pm.id)}
                    disabled={busy === pm.id}
                  >
                    Set as default
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => detach(pm.id)}
                  disabled={busy === pm.id}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
