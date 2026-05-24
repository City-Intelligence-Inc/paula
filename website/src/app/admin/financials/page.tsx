"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, AlertCircle, FileWarning } from "lucide-react";

interface Financials {
  revenuePaidCents: number;
  pendingCents: number;
  overdueCents: number;
  failedCents: number;
  unbilledCents: number;
  unbilledCount: number;
  counts: {
    paid: number;
    pending: number;
    overdue: number;
    failed: number;
    sessionsTotal: number;
    sessionsCompleted: number;
  };
  monthsSorted: { month: string; cents: number }[];
  topStudents: { studentId: string; name: string; cents: number }[];
  recentPayments: {
    studentId: string;
    studentName: string;
    createdAt: string;
    amount?: number;
    paymentStatus?: string;
    description?: string;
  }[];
}

function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  // Warm semantic palette per DESIGN.md — moss/mustard/cranberry, not the
  // generic emerald/amber/red Tailwind defaults.
  const cls =
    status === "paid"
      ? "badge-success border-transparent"
      : status === "pending"
        ? "badge-warning border-transparent"
        : "badge-error border-transparent";
  return <Badge className={cls}>{status}</Badge>;
}

export default function AdminFinancialsPage() {
  const fetchApi = useApi();
  const [data, setData] = useState<Financials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi("/api/admin/financials")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        setData(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [fetchApi]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Financials
        </h1>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Financials
        </h1>
        <Card className="border border-transparent rounded-lg badge-error">
          <CardContent className="py-4 text-sm text-red-700">
            {error || "No data."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxMonth = Math.max(1, ...data.monthsSorted.map((m) => m.cents));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Financials
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Revenue, pending invoices, and uncharged sessions at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border border-neutral-200 rounded-lg">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
              <DollarSign className="h-3 w-3" />
              Revenue (paid)
            </div>
            <p className="text-2xl font-semibold text-neutral-900 mt-1">
              {dollars(data.revenuePaidCents)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {data.counts.paid} payments
            </p>
          </CardContent>
        </Card>
        <Card className="border border-neutral-200 rounded-lg">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
              <Clock className="h-3 w-3" />
              Pending
            </div>
            <p className="text-2xl font-semibold text-[color:var(--color-state-warning)] mt-1">
              {dollars(data.pendingCents)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {data.counts.pending} payments
            </p>
          </CardContent>
        </Card>
        <Card className="border border-neutral-200 rounded-lg">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
              <AlertCircle className="h-3 w-3" />
              Overdue + failed
            </div>
            <p className="text-2xl font-semibold text-[color:var(--color-state-error)] mt-1">
              {dollars(data.overdueCents + data.failedCents)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {data.counts.overdue + data.counts.failed} payments
            </p>
          </CardContent>
        </Card>
        <Card className="border border-neutral-200 rounded-lg">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
              <FileWarning className="h-3 w-3" />
              Unbilled sessions
            </div>
            <p className="text-2xl font-semibold text-neutral-900 mt-1">
              {dollars(data.unbilledCents)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {data.unbilledCount} completed sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {data.monthsSorted.length > 0 && (
        <Card className="border border-neutral-200 rounded-lg">
          <CardContent className="py-4">
            <h2 className="font-medium text-neutral-900 mb-3">
              Revenue by month
            </h2>
            <div className="space-y-2">
              {data.monthsSorted.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-neutral-500">
                    {m.month}
                  </span>
                  <div className="flex-1 bg-neutral-100 rounded h-3 overflow-hidden">
                    <div
                      className="h-full bg-mathitude-purple"
                      style={{ width: `${(m.cents / maxMonth) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 text-sm text-neutral-700 text-right font-tabular">
                    {dollars(m.cents)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.topStudents.length > 0 && (
        <Card className="border border-neutral-200 rounded-lg">
          <CardContent className="py-4">
            <h2 className="font-medium text-neutral-900 mb-3">
              Top students by paid revenue
            </h2>
            <div className="space-y-1">
              {data.topStudents.map((s) => (
                <div
                  key={s.studentId}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="text-neutral-900 truncate">{s.name}</span>
                  <span className="text-neutral-700 font-tabular">
                    {dollars(s.cents)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-neutral-200 rounded-lg">
        <CardContent className="py-4">
          <h2 className="font-medium text-neutral-900 mb-3">
            Recent payments
          </h2>
          {data.recentPayments.length === 0 ? (
            <p className="text-sm text-neutral-500">No payments yet.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {data.recentPayments.map((p, i) => (
                <div
                  key={`${p.studentId}-${p.createdAt}-${i}`}
                  className="flex items-center justify-between py-2 gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {p.studentName}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {p.description || "Tutoring session"} •{" "}
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-neutral-900 font-tabular">
                    {dollars(p.amount || 0)}
                  </span>
                  <StatusBadge status={p.paymentStatus} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
