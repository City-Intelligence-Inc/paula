"use client";

import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SaveCardForm } from "@/components/stripe/save-card-form";
import {
  CreditCard,
  Trash2,
  Star,
  RefreshCw,
  Undo2,
  Pencil,
  X,
  Plus,
} from "lucide-react";

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
  pendingDefaultId: string | null;
}

const EMPTY_DRAFT: DraftState = { pendingDetach: [], pendingDefaultId: null };

// PaymentMethodsPanel — read-only by default; Edit toggle reveals the Add
// Card form + per-card Set-default / Remove buttons + Save Changes.
// Stripe constraints (SetupIntent) mean adding a card still hits Stripe
// immediately, but Save Changes is required to commit detaches + default
// switches. Single source of truth across parent dashboard + admin
// family detail page.
export function PaymentMethodsPanel({ parentId }: { parentId?: string } = {}) {
  const fetchApi = useApi();
  const [data, setData] = useState<PMResponse | null>(null);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [editing, setEditing] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
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
    const onSaved = () => {
      load();
      setAddingCard(false);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("mathitude:card-saved", onSaved);
      return () => window.removeEventListener("mathitude:card-saved", onSaved);
    }
  }, [load]);

  const visibleCards = (data?.paymentMethods || []).filter(
    (pm) => !draft.pendingDetach.includes(pm.id),
  );
  const effectiveDefaultId =
    draft.pendingDefaultId ?? data?.defaultPaymentMethodId ?? null;
  const dirty =
    draft.pendingDetach.length > 0 || draft.pendingDefaultId !== null;
  const removingDefault =
    !!data?.defaultPaymentMethodId &&
    draft.pendingDetach.includes(data.defaultPaymentMethodId) &&
    draft.pendingDefaultId === null;
  const noDefaultAfterSave = removingDefault && visibleCards.length > 0;
  const noCardsAfterSave =
    visibleCards.length === 0 && (data?.paymentMethods.length || 0) > 0;

  function stageDetach(pmId: string) {
    setSuccess(null);
    setError(null);
    setDraft((d) => {
      if (d.pendingDetach.includes(pmId)) return d;
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
    setAddingCard(false);
  }

  function exitEdit() {
    discard();
    setEditing(false);
  }

  async function save() {
    setError(null);
    setSuccess(null);
    if (noDefaultAfterSave) {
      setError(
        "You're removing the default card but haven't picked a replacement. Pick a new default first.",
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
      if (!res.ok) throw new Error(json.error || "Could not save changes");
      setSuccess(
        json.cardCount === 0
          ? "Saved. No cards on file."
          : "Saved.",
      );
      await load();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  // ---- Render ----

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-14 skeleton" />
        ))}
      </div>
    );
  }

  if (!data?.stripeCustomerId) {
    return (
      <Card className="border border-dashed border-[color:var(--color-border-warm)] rounded-lg bg-[color:var(--color-surface-card)]/50">
        <CardContent className="py-4 text-sm text-neutral-600 space-y-2">
          <p>
            No cards on file yet. Click <strong>Add a card</strong> to create
            a Stripe customer + save the first card in one step.
          </p>
          {error && (
            <p className="text-xs text-[color:var(--color-state-error)]">
              {error}
            </p>
          )}
          <Button
            size="sm"
            onClick={() => {
              setEditing(true);
              setAddingCard(true);
            }}
            className="bg-[#7030A0] hover:bg-[#5d288a] text-white uppercase tracking-wide"
          >
            <Plus className="h-3 w-3" />
            Add a card
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasCards = data.paymentMethods.length > 0;
  const multipleCards = data.paymentMethods.length > 1;

  return (
    <div className="space-y-3">
      {/* Header — top-level Edit / Done button. Hidden when no cards exist
          and we're about to bootstrap the first one via the empty-state CTA. */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-neutral-500">
          {hasCards
            ? `${data.paymentMethods.length} card${
                data.paymentMethods.length === 1 ? "" : "s"
              } on file`
            : "No cards on file"}
        </p>
        {editing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={exitEdit}
            disabled={saving}
            className="border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-md text-xs"
          >
            <X className="h-3 w-3" />
            Done
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-md text-xs"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md border-0 badge-error px-3 py-2 text-sm slide-down-in">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border-0 badge-success px-3 py-2 text-sm slide-down-in">
          {success}
        </div>
      )}
      {noDefaultAfterSave && (
        <div className="rounded-md border-0 badge-warning px-3 py-2 text-sm slide-down-in">
          You&apos;re removing the default card. Pick a new default below
          before saving.
        </div>
      )}
      {noCardsAfterSave && (
        <div className="rounded-md border-0 badge-warning px-3 py-2 text-sm slide-down-in">
          You&apos;re about to remove all saved cards. Mathitude won&apos;t be
          able to charge for future sessions until a new card is added.
        </div>
      )}

      {/* Add-a-card panel — visible in edit mode */}
      {editing && (
        <div className="slide-down-in">
          {addingCard ? (
            <Card className="border border-[color:var(--color-border-warm)] rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-neutral-500">
                  {hasCards
                    ? "Each parent keeps one card on file. Adding a new card replaces the current one and becomes the card we charge. To bill a different card, switch the family's primary payer to the parent whose card you want used."
                    : "Enter the card details. Stripe stores the card; Mathitude never sees the number."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingCard(false)}
                  className="border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-md text-xs shrink-0 ml-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <SaveCardForm parentId={parentId} hideHeader fullWidth />
            </Card>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddingCard(true)}
              className="w-full border border-dashed border-[color:var(--color-border-warm)] text-neutral-700 hover:bg-neutral-50 rounded-md text-sm py-3"
            >
              <Plus className="h-4 w-4" />
              {hasCards ? "Replace card" : "Add a card"}
            </Button>
          )}
        </div>
      )}

      {/* Cards list */}
      {hasCards ? (
        <div className="space-y-2">
          {data.paymentMethods.map((pm) => {
            const staged = draft.pendingDetach.includes(pm.id);
            const isEffectiveDefault = pm.id === effectiveDefaultId;
            return (
              <Card
                key={pm.id}
                className={`py-0 border rounded-lg transition-colors ${
                  staged
                    ? "border-[color:var(--color-state-error)]/30 bg-[color:var(--color-state-error-soft)]/30"
                    : "border-[color:var(--color-border-warm)]"
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
                      <span className="font-tabular">{pm.last4 || "????"}</span>
                    </p>
                    <p className="text-xs text-neutral-500">
                      Expires {String(pm.expMonth).padStart(2, "0")}/
                      {pm.expYear}
                      {staged && (
                        <span className="ml-2 text-[color:var(--color-state-error)] pending-pulse">
                          — pending removal
                        </span>
                      )}
                      {!staged &&
                        draft.pendingDefaultId === pm.id && (
                          <span className="ml-2 text-mathitude-purple pending-pulse">
                            — pending default
                          </span>
                        )}
                    </p>
                  </div>

                  {/* Default badge — always shown when it IS the default */}
                  {!staged && isEffectiveDefault && (
                    <Badge className="bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20">
                      <Star className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  )}

                  {/* Edit-mode actions */}
                  {editing && !staged && !isEffectiveDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => stageDefault(pm.id)}
                      className="border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-md text-xs"
                    >
                      Set as default
                    </Button>
                  )}
                  {editing && staged && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unstageDetach(pm.id)}
                      className="border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-md text-xs"
                    >
                      <Undo2 className="h-3 w-3" />
                      Undo
                    </Button>
                  )}
                  {editing && !staged && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => stageDetach(pm.id)}
                      className="text-[color:var(--color-state-error)] hover:bg-[color:var(--color-state-error-soft)] rounded-md text-xs"
                      title="Remove card (takes effect after Save Changes)"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Each parent has one card on file. To switch which card is
              charged, switch the family's primary payer to the parent
              whose card you want billed. */}
          {editing && !multipleCards && (
            <p className="text-xs text-neutral-500 px-1">
              This parent has one card on file. To charge a different card,
              switch the family&apos;s primary payer to a different parent
              (above), or replace this card.
            </p>
          )}
        </div>
      ) : (
        <Card className="border border-dashed border-[color:var(--color-border-warm)] rounded-lg bg-[color:var(--color-surface-card)]/50">
          <CardContent className="py-4 text-sm text-neutral-500">
            No cards saved yet.
          </CardContent>
        </Card>
      )}

      {/* Footer — Save / Discard, only visible in edit mode with pending changes */}
      {editing && dirty && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[color:var(--color-border-warm)]">
          <Button
            variant="outline"
            size="sm"
            onClick={discard}
            disabled={saving}
            className="border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-md text-xs"
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={save}
            disabled={saving || noDefaultAfterSave}
            className="bg-[#7030A0] hover:bg-[#5d288a] text-white uppercase tracking-wide"
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
