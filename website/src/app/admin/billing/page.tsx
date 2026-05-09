"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
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
}

interface ApproveResult {
  studentId: string;
  dateTime: string;
  ok: boolean;
  status?: string;
  error?: string;
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

export default function AdminBillingPage() {
  const fetchApi = useApi();
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [results, setResults] = useState<ApproveResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rowKey = (r: QueueRow) => `${r.studentId}#${r.dateTime}`;

  async function loadQueue() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi("/api/billing/queue");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load queue");
      setQueue(data.queue || []);
      setSelected(new Set((data.queue || []).map((r: QueueRow) => rowKey(r))));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
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

  const toggleAll = () => {
    if (selected.size === queue.length) setSelected(new Set());
    else setSelected(new Set(queue.map((r) => rowKey(r))));
  };

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
          Completed sessions waiting to be charged. Review, deselect any
          holds, then approve.
        </p>
      </div>

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
          <Button
            variant="outline"
            size="sm"
            onClick={loadQueue}
            disabled={loading || charging}
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            disabled={loading || charging || queue.length === 0}
          >
            {selected.size === queue.length ? "Deselect all" : "Select all"}
          </Button>
        </div>
        <Button
          onClick={approveSelected}
          disabled={charging || selectedRows.length === 0}
          className="bg-mathitude-purple text-white hover:bg-mathitude-purple/90"
        >
          <CreditCard className="h-3 w-3" />
          {charging
            ? "Charging…"
            : `Approve & charge ${selectedRows.length || ""}`.trim()}
        </Button>
      </div>

      {error && (
        <Card className="py-3 border border-red-200 rounded-lg bg-red-50">
          <CardContent>
            <p className="text-sm text-red-600">{error}</p>
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
                key={`${r.studentId}#${r.dateTime}`}
                className="flex items-center gap-3 text-sm"
              >
                {r.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-neutral-900 font-medium">
                  {r.studentId}
                </span>
                <span className="text-neutral-500 text-xs">
                  {formatDate(r.dateTime)}
                </span>
                <span
                  className={`text-xs ${
                    r.ok ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {r.ok ? r.status || "succeeded" : r.error || "failed"}
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
                No completed sessions waiting to be billed.
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
              return (
                <div
                  key={key}
                  className="grid grid-cols-1 sm:grid-cols-[40px_1fr_120px_80px_120px_120px_100px] gap-2 sm:gap-4 items-center px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRow(key)}
                    disabled={charging}
                    className="h-4 w-4 rounded border-neutral-300 text-mathitude-purple focus:ring-mathitude-purple"
                  />
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">
                      {r.studentName}
                    </p>
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
    </div>
  );
}
