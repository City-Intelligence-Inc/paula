"use client";

import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Trash2, Star, RefreshCw, Undo2 } from "lucide-react";

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

interface DraftState {
  pendingDetach: string[];
  pendingDefaultId: string | null; // null = no change
}

const EMPTY_DRAFT: DraftState = { pendingDetach: [], pendingDefaultId: null };

// PaymentMethodsPanel — list + stage default/detach changes + Save Changes.
// Mutations are NOT pushed to Stripe until the user clicks Save Changes.
// Use cases handled:
//   1. add card                          → handled by SaveCardForm (real-time, Stripe requires it)
//   2. remove card                       → staged via pendingDetach
//   3. change default                    → staged via pendingDefaultId
//   4. error: invalid card               → surfaced by SaveCardForm
//   5. error: no default card after save → surfaced from apply endpoint code:"no_default"
export function PaymentMethodsPanel({ parentId }: { parentId?: string } = {}) {
  const fetchApi = useApi();
  const [data, setData] = useState<PMResponse | null>(null);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = parentId ? `?parentId=${encodeURIComponent(parentId)}` : "";
      const res = await fetchApi(`/api/stripe/payment-methods${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
      setDraft(EMPTY_DRAFT);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [fetchApi, parentId]);

  useEffect(() => {
    load();
    const onSaved = () => load();
    if (typeof window !== "undefined") {
      window.addEventListener("mathitude:card-saved", onSaved);
      return () => window.removeEventListener("mathitude:card-saved", onSaved);
    }
  }, [load]);

  // Derived: PMs after applying draft locally
  const visibleCards = (data?.paymentMethods || []).filter(
    (pm) => !draft.pendingDetach.includes(pm.id),
  );
  const effectiveDefaultId =
    draft.pendingDefaultId ?? data?.defaultPaymentMethodId ?? null;

  const dirty =
    draft.pendingDetach.length > 0 || draft.pendingDefaultId !== null;

  // Catches case #4: user staged removing the current default but didn't
  // pick a replacement, and there are other cards to choose from.
  const removingDefault =
    !!data?.defaultPaymentMethodId &&
    draft.pendingDetach.includes(data.defaultPaymentMethodId) &&
    draft.pendingDefaultId === null;

  const noDefaultAfterSave = removingDefault && visibleCards.length > 0;
  const noCardsAfterSave = visibleCards.length === 0 && (data?.paymentMethods.length || 0) > 0;

  function stageDetach(pmId: string) {
    setSuccess(null);
    setError(null);
    setDraft((d) => {
      if (d.pendingDetach.includes(pmId)) return d;
      // If we're removing the current pending default, clear that pointer too.
      const clearPendingDefault =
        d.pendingDefaultId === pmId ? null : d.pendingDefaultId;
      return {
        pendingDetach: [...d.pendingDetach, pmId],
        pendingDefaultId: clearPendingDefault,
      };
    });
  }

  function unstageDetach(pmId: string) {
    setSuccess(null);
    setDraft((d) => ({
      ...d,
      pendingDetach: d.pendingDetach.filter((id) => id !== pmId),
    }));
  }

  function stageDefault(pmId: string) {
    setSuccess(null);
    setError(null);
    setDraft((d) => ({ ...d, pendingDefaultId: pmId }));
  }

  function discard() {
    setError(null);
    setSuccess(null);
    setDraft(EMPTY_DRAFT);
  }

  async function save() {
    setError(null);
    setSuccess(null);

    if (noDefaultAfterSave) {
      setError(
        "You're removing the default card but haven't picked a new default. Choose one of the remaining cards as default before saving.",
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetchApi("/api/stripe/payment-methods/apply", {
        method: "POST",
        body: JSON.stringify({
          parentId,
          detach: draft.pendingDetach,
          setDefaultId: draft.pendingDefaultId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Could not save changes");
      }
      setSuccess(
        json.cardCount === 0
          ? "Changes saved. No cards on file."
          : "Changes saved.",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
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
        <CardContent className="py-4 text-sm text-neutral-500 space-y-2">
          <p>
            No Stripe customer on file yet. A customer is created the first
            time you successfully save a card.
          </p>
          {error && (
            <p className="text-xs text-red-600">Lookup error: {error}</p>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="h-3 w-3" />
            Recheck
          </Button>
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
        <Button variant="outline" size="sm" onClick={load} disabled={loading || saving}>
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {noDefaultAfterSave && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You&apos;re removing the default card. Pick a new default from your
          remaining cards before saving.
        </div>
      )}

      {noCardsAfterSave && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You&apos;re about to remove all saved cards. Mathitude won&apos;t be
          able to charge you for future sessions until you add a new card.
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
          {data.paymentMethods.map((pm) => {
            const staged = draft.pendingDetach.includes(pm.id);
            const isEffectiveDefault = pm.id === effectiveDefaultId;
            return (
              <Card
                key={pm.id}
                className={`py-0 border rounded-lg ${
                  staged
                    ? "border-red-200 bg-red-50/40"
                    : "border-neutral-200"
                }`}
              >
                <CardContent className="flex flex-wrap items-center gap-3 py-3">
                  <CreditCard className="h-4 w-4 text-neutral-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        staged
                          ? "text-neutral-400 line-through"
                          : "text-neutral-900"
                      }`}
                    >
                      {(pm.brand || "card").toUpperCase()} ••••{" "}
                      {pm.last4 || "????"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Expires {String(pm.expMonth).padStart(2, "0")}/{pm.expYear}
                      {staged && (
                        <span className="ml-2 text-red-600">
                          — pending removal
                        </span>
                      )}
                      {!staged &&
                        draft.pendingDefaultId === pm.id && (
                          <span className="ml-2 text-mathitude-purple">
                            — pending default
                          </span>
                        )}
                    </p>
                  </div>

                  {!staged && isEffectiveDefault ? (
                    <Badge className="bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20">
                      <Star className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  ) : !staged ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => stageDefault(pm.id)}
                    >
                      Set as default
                    </Button>
                  ) : null}

                  {staged ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unstageDetach(pm.id)}
                    >
                      <Undo2 className="h-3 w-3" />
                      Undo
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => stageDetach(pm.id)}
                      className="text-red-600 hover:bg-red-50"
                      title="Remove card (takes effect after Save Changes)"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
        {dirty && (
          <Button
            variant="outline"
            size="sm"
            onClick={discard}
            disabled={saving}
          >
            Discard
          </Button>
        )}
        <Button
          size="sm"
          onClick={save}
          disabled={!dirty || saving || noDefaultAfterSave}
          className="bg-[#7030A0] hover:bg-[#5d288a] text-white uppercase tracking-wide"
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {!dirty && (
        <p className="text-xs text-neutral-400 text-right">
          Changes to your cards take effect after you click Save Changes.
        </p>
      )}
    </div>
  );
}
