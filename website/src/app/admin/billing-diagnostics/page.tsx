"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CreditCard, RefreshCw, Search } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

// Human-readable copy + severity for every flag the diagnostics API emits.
const FLAG_META: Record<string, { label: string; severity: "error" | "warn" | "info" }> = {
  "multiple-customers": {
    label: "Multiple Stripe customers on one family",
    severity: "error",
  },
  "card-on-non-primary-payer": {
    label: "A card is on a parent who isn't the primary payer",
    severity: "warn",
  },
  "no-primary-payer-set": {
    label: "No primary payer set on the family",
    severity: "warn",
  },
  "primary-payer-no-customer": {
    label: "Primary payer has no Stripe customer",
    severity: "warn",
  },
  "primary-payer-no-card": {
    label: "Primary payer has no card on file",
    severity: "warn",
  },
  "has-card-not-primary": {
    label: "Has a card but isn't the primary payer",
    severity: "warn",
  },
  "no-default-set": {
    label: "Cards on file but no default selected",
    severity: "warn",
  },
  "default-not-attached": {
    label: "Default points at a card that isn't attached",
    severity: "error",
  },
  "customer-deleted": {
    label: "Stripe customer was deleted",
    severity: "error",
  },
  "customer-unresolvable": {
    label: "Stripe customer ID can't be resolved (wrong mode / typo)",
    severity: "error",
  },
};

const SEVERITY_STYLES = {
  error: "bg-red-50 text-red-700 border-red-200",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
} as const;

function Flag({ flag }: { flag: string }) {
  const meta = FLAG_META[flag] || { label: flag, severity: "info" as const };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        SEVERITY_STYLES[meta.severity],
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

interface OverviewFamily {
  familyId: string;
  label: string;
  primaryPayerId: string | null;
  parentCount: number;
  distinctCustomerCount: number;
  flags: string[];
}

interface ParentDetail {
  id: string;
  name: string;
  email: string | null;
  clerkUserId: string | null;
  isPrimaryPayer: boolean;
  stripeCustomerId: string | null;
  customerExists: boolean;
  customerDeleted: boolean;
  defaultPaymentMethodId: string | null;
  cards: Array<{
    id: string;
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    isDefault: boolean;
    created: string;
  }>;
  flags: string[];
}

interface Detail {
  mode: "detail";
  familyId: string;
  label: string;
  primaryPayerId: string | null;
  distinctCustomerCount: number;
  flags: string[];
  parents: ParentDetail[];
}

export default function BillingDiagnosticsPage() {
  const fetchApi = useApi();
  const [families, setFamilies] = useState<OverviewFamily[] | null>(null);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi("/api/admin/stripe/diagnostics");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setFamilies(json.families);
      setFlaggedCount(json.flaggedCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const loadDetail = useCallback(
    async (familyId: string) => {
      setSelected(familyId);
      setDetailLoading(true);
      setDetail(null);
      try {
        const res = await fetchApi(
          `/api/admin/stripe/diagnostics?familyId=${encodeURIComponent(familyId)}`,
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load family");
        setDetail(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load family");
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchApi],
  );

  const filtered = useMemo(() => {
    if (!families) return [];
    const q = query.trim().toLowerCase();
    if (!q) return families;
    return families.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.familyId.toLowerCase().includes(q),
    );
  }, [families, query]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Billing Diagnostics
          </h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
            Read-only view of how each family maps to Stripe. Surfaces the
            duplicate-customer and default-card mismatches behind &ldquo;cards
            not syncing&rdquo; and &ldquo;default not recognized.&rdquo; Nothing
            here changes data.
          </p>
        </div>
        <button
          type="button"
          onClick={loadOverview}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && families && (
        <div className="flex items-center gap-2 text-sm">
          {flaggedCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800 border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5" />
              {flaggedCount} of {families.length} families flagged
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              No mismatches across {families.length} families
            </span>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        {/* Family list */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search families…"
              className="w-full rounded-md border border-neutral-200 py-2 pl-9 pr-3 text-sm focus:border-[#7030A0] focus:outline-none"
            />
          </div>

          {loading ? (
            <p className="text-sm text-neutral-400 px-1">Loading families…</p>
          ) : (
            <div className="max-h-[70vh] space-y-1.5 overflow-y-auto pr-1">
              {filtered.map((f) => {
                const isFlagged = f.flags.length > 0;
                return (
                  <button
                    key={f.familyId}
                    type="button"
                    onClick={() => loadDetail(f.familyId)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                      selected === f.familyId
                        ? "border-[#7030A0] bg-[#7030A0]/5"
                        : "border-neutral-200 hover:bg-neutral-50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-neutral-900">
                        {f.label}
                      </span>
                      {isFlagged ? (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      {f.parentCount} parent{f.parentCount === 1 ? "" : "s"} ·{" "}
                      {f.distinctCustomerCount} Stripe customer
                      {f.distinctCustomerCount === 1 ? "" : "s"}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-neutral-400 px-1">
                  No families match.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Detail */}
        <div>
          {!selected ? (
            <div className="flex h-full min-h-[20rem] items-center justify-center rounded-xl border border-dashed border-neutral-200 text-sm text-neutral-400">
              Select a family to inspect its Stripe mapping.
            </div>
          ) : detailLoading ? (
            <div className="flex h-full min-h-[20rem] items-center justify-center rounded-xl border border-neutral-200 text-sm text-neutral-400">
              Loading from Stripe…
            </div>
          ) : detail ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-neutral-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {detail.label}
                  </h2>
                  <span className="font-mono text-xs text-neutral-400">
                    {detail.familyId}
                  </span>
                </div>
                {detail.flags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {detail.flags.map((flag) => (
                      <Flag key={flag} flag={flag} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    No mismatches on this family.
                  </p>
                )}
              </div>

              {detail.parents.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-xl border p-5",
                    p.isPrimaryPayer
                      ? "border-[#7030A0]/30 bg-[#7030A0]/[0.03]"
                      : "border-neutral-200",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900">
                        {p.name}
                      </span>
                      {p.isPrimaryPayer && (
                        <span className="rounded-full bg-[#7030A0] px-2 py-0.5 text-xs font-medium text-white">
                          Primary payer
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-neutral-400">
                      {p.id}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-neutral-500">
                    {p.email || "no email"}
                    {p.clerkUserId ? " · linked to a login" : " · no login linked"}
                  </div>

                  <div className="mt-3 text-sm">
                    <span className="text-neutral-500">Stripe customer: </span>
                    {p.stripeCustomerId ? (
                      <span className="font-mono text-neutral-700">
                        {p.stripeCustomerId}
                      </span>
                    ) : (
                      <span className="text-neutral-400">none</span>
                    )}
                  </div>

                  {/* Cards */}
                  {p.cards.length > 0 ? (
                    <ul className="mt-3 space-y-1.5">
                      {p.cards.map((card) => (
                        <li
                          key={card.id}
                          className="flex items-center gap-2 rounded-md border border-neutral-100 bg-white px-3 py-2 text-sm"
                        >
                          <CreditCard className="h-4 w-4 text-neutral-400" />
                          <span className="capitalize text-neutral-800">
                            {card.brand || "card"}
                          </span>
                          <span className="text-neutral-500">
                            ····{card.last4 || "????"}
                          </span>
                          <span className="text-xs text-neutral-400">
                            exp {card.expMonth}/{card.expYear}
                          </span>
                          {card.isDefault && (
                            <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                              Default
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : p.customerExists ? (
                    <p className="mt-3 text-sm text-neutral-400">
                      No cards on this customer.
                    </p>
                  ) : null}

                  {p.flags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.flags.map((flag) => (
                        <Flag key={flag} flag={flag} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
