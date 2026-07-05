"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Wallet, PiggyBank, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// B-4: per-family ledger with deposit tracking. One row per family — deposit,
// drawdown across the year's first sessions, banked (makeup-eligible) sessions,
// charges vs payments, and the resulting balance.

interface LedgerSessionRow {
  date: string;
  student: string;
  amountCents: number;
  coveredByDeposit: boolean;
}

interface FamilyLedger {
  familyId: string;
  name: string;
  students: string[];
  depositCents: number;
  depositReceivedAt?: string;
  depositAppliedCents: number;
  depositRemainingCents: number;
  sessionsCoveredByDeposit: number;
  chargesCents: number;
  paymentsCents: number;
  balanceCents: number;
  bankedSessions: { date: string; student: string }[];
  sessions: LedgerSessionRow[];
}

function dollars(cents: number): string {
  const v = cents / 100;
  return `$${v.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function DepositCell({
  fam,
  onSaved,
}: {
  fam: FamilyLedger;
  onSaved: () => void;
}) {
  const fetchApi = useApi();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    fam.depositCents ? String(fam.depositCents / 100) : "500",
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const dollarsNum = Number(value);
    if (!Number.isFinite(dollarsNum) || dollarsNum < 0) return;
    setSaving(true);
    try {
      await fetchApi(`/api/families/${fam.familyId}`, {
        method: "PUT",
        body: JSON.stringify({ depositCents: Math.round(dollarsNum * 100) }),
      });
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        className="text-sm text-left hover:underline decoration-dotted underline-offset-2"
        title="Click to record or edit the deposit"
        onClick={() => setEditing(true)}
      >
        {fam.depositCents > 0 ? (
          <span className="font-medium text-neutral-900">
            {dollars(fam.depositCents)}
          </span>
        ) : (
          <span className="text-neutral-400">Record deposit</span>
        )}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-neutral-500">$</span>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm"
        inputMode="decimal"
      />
      <Button size="sm" onClick={save} disabled={saving}>
        {saving ? "…" : "Save"}
      </Button>
    </div>
  );
}

export default function FamilyLedgerPage() {
  const fetchApi = useApi();
  const [families, setFamilies] = useState<FamilyLedger[]>([]);
  const [yearStart, setYearStart] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchApi("/api/admin/ledger")
      .then((r) => r.json())
      .then((j) => {
        setFamilies(j.families || []);
        setYearStart(j.yearStart || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchApi]);

  useEffect(load, [load]);

  const totalDeposits = families.reduce((a, f) => a + f.depositCents, 0);
  const totalBanked = families.reduce((a, f) => a + f.bankedSessions.length, 0);
  const totalOutstanding = families.reduce(
    (a, f) => a + Math.max(0, f.balanceCents),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
          <Wallet className="h-6 w-6 text-mathitude-purple" />
          Family Ledger
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Deposits, drawdown, and banked sessions since {yearStart || "the academic year start"}.
          Click a deposit to record it; click a row for the session-by-session drawdown.
        </p>
      </div>

      {!loading && families.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <PiggyBank className="h-4 w-4" /> Deposits on file
            </div>
            <p className="text-xl font-semibold text-neutral-900 mt-1">
              {dollars(totalDeposits)}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <CalendarClock className="h-4 w-4" /> Banked sessions
            </div>
            <p className="text-xl font-semibold text-neutral-900 mt-1">
              {totalBanked}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Wallet className="h-4 w-4" /> Outstanding balances
            </div>
            <p className="text-xl font-semibold text-neutral-900 mt-1">
              {dollars(totalOutstanding)}
            </p>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      ) : families.length === 0 ? (
        <Card className="p-10 text-center text-sm text-neutral-500">
          No families yet. Families appear here once created under Families.
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3 font-medium">Family</th>
                  <th className="px-4 py-3 font-medium">Deposit</th>
                  <th className="px-4 py-3 font-medium">Deposit used</th>
                  <th className="px-4 py-3 font-medium">Deposit left</th>
                  <th className="px-4 py-3 font-medium">Banked</th>
                  <th className="px-4 py-3 font-medium">Charges</th>
                  <th className="px-4 py-3 font-medium">Payments</th>
                  <th className="px-4 py-3 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {families.map((f) => (
                  <>
                    <tr
                      key={f.familyId}
                      className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                      onClick={() =>
                        setOpenId(openId === f.familyId ? null : f.familyId)
                      }
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{f.name}</p>
                        <p className="text-xs text-neutral-500">
                          {f.students.join(", ") || "No students linked"}
                        </p>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <DepositCell fam={f} onSaved={load} />
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {f.depositCents > 0 ? (
                          <>
                            {dollars(f.depositAppliedCents)}
                            <span className="text-xs text-neutral-400">
                              {" "}
                              · {f.sessionsCoveredByDeposit} session
                              {f.sessionsCoveredByDeposit === 1 ? "" : "s"}
                            </span>
                          </>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {f.depositCents > 0 ? (
                          <Badge
                            className={
                              f.depositRemainingCents > 0
                                ? "badge-success border-transparent"
                                : "bg-neutral-100 text-neutral-600 border-neutral-200"
                            }
                          >
                            {dollars(f.depositRemainingCents)}
                          </Badge>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {f.bankedSessions.length > 0 ? (
                          <Badge className="badge-warning border-transparent">
                            {f.bankedSessions.length}
                          </Badge>
                        ) : (
                          <span className="text-neutral-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {dollars(f.chargesCents)}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {dollars(f.paymentsCents)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            f.balanceCents > 0
                              ? "font-semibold text-neutral-900"
                              : "font-medium text-emerald-700"
                          }
                        >
                          {f.balanceCents < 0
                            ? `${dollars(-f.balanceCents)} credit`
                            : dollars(f.balanceCents)}
                        </span>
                      </td>
                    </tr>
                    {openId === f.familyId && (
                      <tr key={`${f.familyId}-detail`} className="border-b border-neutral-100 bg-neutral-50/60">
                        <td colSpan={8} className="px-4 py-3">
                          {f.sessions.length === 0 &&
                          f.bankedSessions.length === 0 ? (
                            <p className="text-xs text-neutral-500">
                              No sessions this academic year.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {f.sessions.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-neutral-600 mb-1">
                                    Session drawdown
                                  </p>
                                  <div className="space-y-0.5">
                                    {f.sessions.map((s, i) => (
                                      <p key={i} className="text-xs text-neutral-600">
                                        {s.date} · {s.student} ·{" "}
                                        {dollars(s.amountCents)}
                                        {s.coveredByDeposit && (
                                          <span className="ml-2 text-emerald-700">
                                            covered by deposit
                                          </span>
                                        )}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {f.bankedSessions.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-neutral-600 mb-1">
                                    Banked sessions (cancelled with notice — makeup owed)
                                  </p>
                                  {f.bankedSessions.map((b, i) => (
                                    <p key={i} className="text-xs text-neutral-600">
                                      {b.date} · {b.student}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
