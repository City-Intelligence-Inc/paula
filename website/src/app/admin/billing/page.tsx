"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface QueueRow {
  studentId: string;
  chargeStudentId?: string | null;
  sessionStatus?: string; // completed | failed (retry) | hold
  lastBillingError?: string | null;
  dateTime: string;
  date: string;
  duration: number;
  type: string;
  tutorId: string | null;
  offering: string;
  notes: string;
  studentName: string;
  amountCents: number;
  hasFamilyOnFile: boolean;
  splitIndex?: number;
  splitLabel?: string | null;
  payerFamilyId?: string | null;
  payerParentId?: string | null;
  payerCounterpartyName?: string | null;
}

interface ApproveResult {
  studentId: string;
  dateTime: string;
  splitIndex?: number;
  splitLabel?: string | null;
  ok: boolean;
  status?: string;
  error?: string;
  familyId?: string;
}

function formatAmount(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Flat-rate charge — group classes (8–12 weeks, paid upfront by the payer)
// and one-off group events. Charges the student's resolved payer directly via
// the locked-down /api/stripe/charge path; no session row required.
function FlatRateChargeCard() {
  const fetchApi = useApi();
  const [students, setStudents] = useState<
    { id: string; firstName: string; lastName: string }[]
  >([]);
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  useEffect(() => {
    fetchApi("/api/students")
      .then((r) => r.json())
      .then((j: { students?: { id: string; firstName: string; lastName: string }[] }) => {
        const list = (j.students || []).slice();
        list.sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
        );
        setStudents(list);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const amountCents = Math.round(Number(amount) * 100);
  const student = students.find((s) => s.id === studentId);
  const ready = !!student && amountCents > 0 && label.trim().length > 0;

  async function charge() {
    if (!ready || !student) return;
    const confirmed = window.confirm(
      `Charge ${formatAmount(amountCents)} to ${student.firstName} ${student.lastName}'s payer for "${label.trim()}"?\n\nThis runs a live Stripe charge.`,
    );
    if (!confirmed) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetchApi("/api/stripe/charge", {
        method: "POST",
        body: JSON.stringify({
          studentId: student.id,
          amount: amountCents,
          offering: "group-class",
          label: label.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Charge failed");
      setMessage({
        ok: true,
        text: `Charged ${formatAmount(amountCents)} — ${data.status || "succeeded"}.`,
      });
      setAmount("");
      setLabel("");
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border border-neutral-200 rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">Flat-rate charge</CardTitle>
        <p className="text-sm text-neutral-500">
          Group classes and events, paid upfront by the payer. Same privacy
          guardrails: the bank statement always reads MATHITUDE.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm sm:w-56"
          >
            <option value="">Select student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount ($)"
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm sm:w-32"
          />
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="What for — e.g. Fall 2026 geometry class (10 weeks)"
            className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm"
          />
          <Button
            onClick={charge}
            disabled={busy || !ready}
            className="bg-mathitude-purple text-white hover:bg-mathitude-purple/90"
          >
            <CreditCard className="h-3 w-3" />
            {busy ? "Charging…" : "Charge"}
          </Button>
        </div>
        {message && (
          <p className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminBillingPage() {
  const fetchApi = useApi();
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [results, setResults] = useState<ApproveResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(14);
  const [truncated, setTruncated] = useState(false);
  // R-4/B-6: office staff view the queue and history but never charge —
  // actions are master-only (also enforced server-side).
  const [isMaster, setIsMaster] = useState(false);

  useEffect(() => {
    fetchApi("/api/me/is-admin")
      .then((r) => r.json())
      .then((j: { isMaster?: boolean }) => setIsMaster(!!j.isMaster))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rowKey = (r: QueueRow) => `${r.studentId}#${r.dateTime}#${r.splitIndex ?? 0}`;

  async function loadQueue(d: number = days) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi(`/api/billing/queue?days=${d}&limit=200`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load queue");
      setQueue(data.queue || []);
      setTruncated(!!data.truncated);
      // Don't auto-select. With 3000+ historical sessions in staging an
      // accidental click would otherwise fire thousands of live charges.
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRow = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectable = queue.filter((r) => r.sessionStatus !== "hold");
  const toggleAll = () => {
    if (selected.size === selectable.length) setSelected(new Set());
    else setSelected(new Set(selectable.map((r) => rowKey(r))));
  };

  // Park a session out of the charge run, or release it back.
  async function toggleHold(row: QueueRow) {
    setError(null);
    const hold = row.sessionStatus !== "hold";
    try {
      const res = await fetchApi("/api/billing/hold", {
        method: "POST",
        body: JSON.stringify({
          studentId: row.studentId,
          dateTime: row.dateTime,
          hold,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hold failed");
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const selectedRows = queue.filter((r) => selected.has(rowKey(r)));
  const selectedTotal = selectedRows.reduce((sum, r) => sum + r.amountCents, 0);

  async function approveSelected() {
    if (selectedRows.length === 0) return;
    const confirmed = window.confirm(
      `Charge ${selectedRows.length} session${
        selectedRows.length === 1 ? "" : "s"
      } for ${formatAmount(selectedTotal)}?\n\nThis will run live charges through Stripe.`,
    );
    if (!confirmed) return;

    setCharging(true);
    setResults(null);
    setError(null);

    try {
      const res = await fetchApi("/api/billing/approve", {
        method: "POST",
        body: JSON.stringify({
          rows: selectedRows.map((r) => ({
            studentId: r.studentId,
            dateTime: r.dateTime,
            amountCents: r.amountCents,
            chargeStudentId: r.chargeStudentId,
            payerFamilyId: r.payerFamilyId,
            payerParentId: r.payerParentId,
            payerCounterpartyName: r.payerCounterpartyName,
            splitIndex: r.splitIndex,
            splitLabel: r.splitLabel,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Charge run failed");
      setResults(data.results as ApproveResult[]);
      // Reload queue so successful sessions drop out.
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCharging(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Billing approval queue
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Completed sessions waiting to be charged, plus failed charges ready
          to retry. Hold a session to park it out of the run until you release
          it.
        </p>
      </div>

      {!isMaster && (
        <Card className="py-3 border border-neutral-200 rounded-lg bg-neutral-50">
          <CardContent className="flex flex-wrap items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-mathitude-purple shrink-0" />
            <p className="text-sm text-neutral-600">
              <span className="font-medium">View only.</span> Running charges,
              holds, and flat-rate billing is reserved for the super admin.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="py-3 border border-neutral-200 rounded-lg bg-neutral-50">
        <CardContent className="flex flex-wrap items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-mathitude-purple shrink-0" />
          <p className="text-sm text-neutral-600">
            <span className="font-medium">Privacy guardrails active.</span>{" "}
            Statement descriptor is locked to{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs border border-neutral-200">
              MATHITUDE
            </code>
            . Student names are sent to Stripe in metadata + description only —
            never on bank statements.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="py-4 border border-neutral-200 rounded-lg bg-white">
          <CardContent>
            <p className="text-xs text-neutral-500">Sessions in queue</p>
            <p className="text-xl font-bold text-neutral-900">{queue.length}</p>
          </CardContent>
        </Card>
        <Card className="py-4 border border-neutral-200 rounded-lg bg-white">
          <CardContent>
            <p className="text-xs text-neutral-500">Selected</p>
            <p className="text-xl font-bold text-neutral-900">
              {selectedRows.length}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4 border border-neutral-200 rounded-lg bg-white">
          <CardContent>
            <p className="text-xs text-neutral-500">Total to charge</p>
            <p className="text-xl font-bold text-neutral-900">
              {formatAmount(selectedTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => {
              const d = Number(e.target.value);
              setDays(d);
              loadQueue(d);
            }}
            disabled={loading || charging}
            className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadQueue(days)}
            disabled={loading || charging}
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            disabled={loading || charging || selectable.length === 0}
          >
            {selected.size === selectable.length && selectable.length > 0
              ? "Deselect all"
              : "Select all"}
          </Button>
        </div>
        {isMaster && (
          <Button
            onClick={approveSelected}
            disabled={charging || selectedRows.length === 0}
            data-tour="approve-billing"
            className="bg-mathitude-purple text-white hover:bg-mathitude-purple/90"
          >
            <CreditCard className="h-3 w-3" />
            {charging
              ? "Charging…"
              : `Approve & charge ${selectedRows.length || ""}`.trim()}
          </Button>
        )}
      </div>

      {error && (
        <Card className="py-3 border border-red-200 rounded-lg bg-red-50">
          <CardContent>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {truncated && (
        <Card className="py-3 border border-amber-200 rounded-lg bg-amber-50">
          <CardContent>
            <p className="text-sm text-amber-800">
              Showing the first 200 sessions in this window. Narrow the date
              range to see older ones.
            </p>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card className="border border-neutral-200 rounded-lg">
          <CardHeader>
            <CardTitle className="text-base">Charge results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((r) => (
              <div
                key={`${r.studentId}#${r.dateTime}#${r.splitIndex ?? 0}`}
                className="flex items-center gap-3 text-sm"
              >
                {r.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-neutral-900 font-medium">
                  {r.studentId}
                  {r.splitLabel ? ` · ${r.splitLabel}` : ""}
                </span>
                <span className="text-neutral-500 text-xs">
                  {formatDate(r.dateTime)}
                </span>
                <span className={`text-xs ${r.ok ? "text-emerald-600" : "text-red-500"}`}>
                  {r.ok ? (r.status || "succeeded") : (
                    <>
                      {r.error || "failed"}
                      {!r.ok && r.familyId && (r.error === "No card on file") && (
                        <Link
                          href={`/admin/families/${r.familyId}`}
                          className="ml-2 underline underline-offset-2 text-[#7030A0] hover:text-[#5d288a]"
                        >
                          Add card →
                        </Link>
                      )}
                    </>
                  )}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="py-0 overflow-hidden border border-neutral-200 rounded-lg">
        <div className="hidden sm:grid grid-cols-[40px_1fr_120px_80px_120px_120px_100px] gap-4 px-4 py-3 bg-neutral-50 border-b border-neutral-200">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            ✓
          </span>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Student
          </span>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Session date
          </span>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Duration
          </span>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Offering
          </span>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Family
          </span>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider text-right">
            Amount
          </span>
        </div>

        <div className="divide-y divide-neutral-200">
          {loading && (
            <div className="text-center py-12 text-neutral-500">
              <p className="text-sm">Loading queue…</p>
            </div>
          )}

          {!loading && queue.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              <p className="text-sm">
                No sessions waiting to be billed or retried.
              </p>
              <p className="text-xs mt-1 text-neutral-400">
                Mark a session as <code>completed</code> in the calendar to
                queue it here.
              </p>
            </div>
          )}

          {!loading &&
            queue.map((r) => {
              const key = rowKey(r);
              const isSelected = selected.has(key);
              const onHold = r.sessionStatus === "hold";
              const isRetry = r.sessionStatus === "failed";
              return (
                <div
                  key={key}
                  className={`grid grid-cols-1 sm:grid-cols-[40px_1fr_120px_80px_120px_120px_100px] gap-2 sm:gap-4 items-center px-4 py-3 ${onHold ? "opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRow(key)}
                    disabled={charging || onHold}
                    className="h-4 w-4 rounded border-neutral-300 text-mathitude-purple focus:ring-mathitude-purple"
                  />
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">
                      {r.studentName}
                      {r.splitLabel && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-[#F2E8FA] text-[#7030A0] px-2 py-0.5 text-[10px] font-medium align-middle">
                          {r.splitLabel}
                        </span>
                      )}
                      {isRetry && (
                        <Badge className="ml-2 bg-red-50 text-red-600 border-red-200 align-middle">
                          retry
                        </Badge>
                      )}
                      {onHold && (
                        <Badge className="ml-2 bg-amber-50 text-amber-700 border-amber-200 align-middle">
                          on hold
                        </Badge>
                      )}
                      {isMaster && (
                        <button
                          type="button"
                          onClick={() => toggleHold(r)}
                          disabled={charging}
                          className="ml-2 text-[11px] text-neutral-400 underline underline-offset-2 hover:text-[#7030A0] align-middle"
                        >
                          {onHold ? "Release" : "Hold"}
                        </button>
                      )}
                    </p>
                    {isRetry && r.lastBillingError && (
                      <p className="text-xs text-red-500 truncate max-w-md">
                        Last attempt: {r.lastBillingError}
                      </p>
                    )}
                    {r.notes && (
                      <p className="text-xs text-neutral-400 truncate max-w-md">
                        {r.notes}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-neutral-600">
                    {formatDate(r.dateTime)}
                  </span>
                  <span className="text-sm text-neutral-600">
                    {r.duration} min
                  </span>
                  <span className="text-sm text-neutral-600 capitalize">
                    {r.offering.replace(/-/g, " ")}
                  </span>
                  <span className="text-sm">
                    {r.hasFamilyOnFile ? (
                      <Badge className="bg-neutral-900/5 text-neutral-900 border-neutral-200">
                        on file
                      </Badge>
                    ) : (
                      <Badge className="bg-red-50 text-red-600 border-red-200">
                        missing
                      </Badge>
                    )}
                  </span>
                  <span className="text-sm font-medium text-neutral-900 text-right">
                    {formatAmount(r.amountCents)}
                  </span>
                </div>
              );
            })}
        </div>
      </Card>

      {isMaster && <FlatRateChargeCard />}
    </div>
  );
}
