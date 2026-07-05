"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import {
  DollarSign,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SortableHeader, useSort } from "@/components/admin/sortable-th";
import { titleCase } from "@/lib/title-case";
import { downloadCsv } from "@/lib/csv";
import type { Student, Payment } from "@/lib/types";

type BillingSortKey = "name" | "grade" | "rate" | "balance" | "status";
type PaymentSortKey = "date" | "student" | "amount" | "status";

type PaymentStatus = "paid" | "pending" | "overdue" | "failed";

function statusBadgeClass(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "badge-success border-transparent";
    case "pending":
      return "badge-warning border-transparent";
    case "overdue":
    case "failed":
      return "badge-error border-transparent";
  }
}

function statusLabel(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "overdue":
      return "Overdue";
    case "failed":
      return "Failed";
  }
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function ChargeButton({
  student,
  disabled,
  onCharged,
}: {
  student: Student;
  disabled: boolean;
  onCharged?: () => void;
}) {
  const fetchApi = useApi();
  const [charging, setCharging] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const name = `${student.firstName} ${student.lastName}`;

  const handleCharge = async () => {
    const confirmed = window.confirm(`Charge ${name} $${student.rate}?`);
    if (!confirmed) return;

    setCharging(true);
    setResult(null);

    try {
      const res = await fetchApi("/api/stripe/charge", {
        method: "POST",
        body: JSON.stringify({
          studentId: student.id,
          amount: Math.round(student.rate * 100), // dollars → cents
          description: `Tutoring session - ${name}`,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setResult({
          type: "error",
          message: data.error || "Charge failed.",
        });
      } else {
        setResult({
          type: "success",
          message: `Charged $${student.rate} to ${name}. It will appear in Stripe with MATHITUDE on the statement.`,
        });
        // Refresh so the row status flips to Paid + the payment lands in
        // history (the page loaded once on mount and never refetched).
        onCharged?.();
      }
    } catch {
      setResult({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      // Result stays in a modal until the admin dismisses it — no auto-hide,
      // so an error (e.g. "no card on file") can actually be read + acted on.
      setCharging(false);
    }
  };

  const needsCard =
    result?.type === "error" &&
    /no (stripe )?customer|no saved card|card on file/i.test(result.message);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="w-fit text-xs border-neutral-200 text-neutral-900 hover:bg-neutral-900 hover:text-white"
        disabled={disabled || charging}
        onClick={handleCharge}
      >
        <DollarSign className="h-3 w-3" />
        {charging ? "Charging..." : "Charge"}
      </Button>

      {result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setResult(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              {result.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
              )}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-neutral-900">
                  {result.type === "success"
                    ? "Payment charged"
                    : "Charge didn't go through"}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">{result.message}</p>
                {needsCard && (
                  <p className="mt-2 text-xs text-neutral-500">
                    Add a card under this family&apos;s primary payer (open the
                    family from Families → Payment method), then charge again.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button
                size="sm"
                className="bg-[#7030A0] text-white hover:bg-[#5d288a]"
                onClick={() => setResult(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Flat-rate / one-off charge — group classes, events, or any custom amount for
// a student's payer. Moved here from the (removed) Billing queue so Payments is
// the single place to charge. Bank statement still reads MATHITUDE.
function FlatRateChargeCard({ onCharged }: { onCharged?: () => void }) {
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
      .then(
        (j: {
          students?: { id: string; firstName: string; lastName: string }[];
        }) => {
          const list = (j.students || []).slice();
          list.sort((a, b) =>
            `${a.firstName} ${a.lastName}`.localeCompare(
              `${b.firstName} ${b.lastName}`,
            ),
          );
          setStudents(list);
        },
      )
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const amountCents = Math.round(Number(amount) * 100);
  const student = students.find((s) => s.id === studentId);
  const ready = !!student && amountCents > 0 && label.trim().length > 0;

  async function charge() {
    if (!ready || !student) return;
    if (
      !window.confirm(
        `Charge ${formatAmount(amountCents)} to ${student.firstName} ${student.lastName}'s payer for "${label.trim()}"?\n\nThis runs a live Stripe charge.`,
      )
    )
      return;
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
      onCharged?.();
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
        <CardTitle className="text-base">Flat-rate / one-off charge</CardTitle>
        <CardDescription>
          Group classes, events, or any custom amount. The bank statement always
          reads MATHITUDE.
        </CardDescription>
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
          <p
            className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-600"}`}
          >
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPaymentsPage() {
  const fetchApi = useApi();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const billingSort = useSort<BillingSortKey>("name");
  const paymentSort = useSort<PaymentSortKey>("date", "desc");

  const loadData = useCallback(() => {
    return Promise.all([
      fetchApi("/api/students").then((res) => res.json()),
      fetchApi("/api/payments").then((res) => res.json()),
    ])
      .then(([studentsJson, paymentsJson]) => {
        setStudents(studentsJson.students || []);
        setPayments(paymentsJson.payments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchApi]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Payments</h1>
          <p className="text-sm text-neutral-500 mt-1">Loading payment data...</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Build a map of studentId -> Student for lookups
  const studentMap = new Map(students.map((s) => [s.id, s]));

  // Build student name helper
  function studentName(studentId: string): string {
    const s = studentMap.get(studentId);
    return s ? `${s.firstName} ${s.lastName}` : studentId;
  }

  // Calculate summary stats from payments
  const totalCollected = payments
    .filter((p) => p.paymentStatus === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = payments
    .filter((p) => p.paymentStatus === "pending" || p.paymentStatus === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);
  const overdueCount = new Set(
    payments.filter((p) => p.paymentStatus === "overdue").map((p) => p.studentId)
  ).size;

  const statusOrder: Record<PaymentStatus, number> = {
    overdue: 0,
    failed: 1,
    pending: 2,
    paid: 3,
  };

  // Get recent payments sorted by current sort key
  const recentPayments = [...payments]
    .sort(
      paymentSort.compare<Payment>((p, k) => {
        switch (k) {
          case "student":
            return studentName(p.studentId);
          case "amount":
            return p.amount;
          case "status":
            return statusOrder[p.paymentStatus as PaymentStatus] ?? 999;
          case "date":
          default:
            return new Date(p.createdAt).getTime();
        }
      }),
    )
    .slice(0, 20);

  // Build per-student billing view: aggregate latest payment status per student
  const studentBilling = students
    .filter((s) => s.status === "active")
    .map((student) => {
      const studentPayments = payments
        .filter((p) => p.studentId === student.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latestPayment = studentPayments[0];
      const balance = studentPayments
        .filter((p) => p.paymentStatus === "pending" || p.paymentStatus === "overdue")
        .reduce((sum, p) => sum + p.amount, 0);
      return {
        student,
        latestStatus: latestPayment?.paymentStatus || ("pending" as PaymentStatus),
        lastPaymentDate: latestPayment?.createdAt || "",
        balance,
      };
    });

  const filteredBilling = studentBilling
    .filter((sb) =>
      `${sb.student.firstName} ${sb.student.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort(
      billingSort.compare<(typeof studentBilling)[number]>((sb, k) => {
        switch (k) {
          case "grade":
            return sb.student.grade || "";
          case "rate":
            return sb.student.rate || 0;
          case "balance":
            return sb.balance;
          case "status":
            return statusOrder[sb.latestStatus as PaymentStatus] ?? 999;
          case "name":
          default:
            return `${sb.student.firstName} ${sb.student.lastName}`;
        }
      }),
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Payments</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage billing and track payment status
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={payments.length === 0}
          onClick={() => {
            const studentName = (sid: string) => {
              const s = students.find((x) => x.id === sid);
              return s
                ? `${titleCase(s.firstName || "")} ${titleCase(s.lastName || "")}`.trim()
                : sid;
            };
            downloadCsv(
              payments.map((p) => ({
                createdAt: p.createdAt,
                student: studentName(p.studentId),
                description: p.description || "",
                amount: ((p.amount || 0) / 100).toFixed(2),
                status: p.paymentStatus,
                stripePaymentIntentId: p.stripePaymentIntentId || "",
                stripeChargeId: p.stripeChargeId || "",
                studentId: p.studentId,
              })),
              [
                { key: "createdAt", header: "Date" },
                { key: "student", header: "Student" },
                { key: "description", header: "Description" },
                { key: "amount", header: "Amount (USD)" },
                { key: "status", header: "Status" },
                { key: "stripePaymentIntentId", header: "Stripe payment intent" },
                { key: "stripeChargeId", header: "Stripe charge" },
                { key: "studentId", header: "Student ID" },
              ],
              "payments",
            );
          }}
          className="border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-md self-start"
        >
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="py-4 border border-neutral-200 rounded-lg bg-white">
          <CardContent className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-500">Collected</p>
              <p className="text-xl font-bold text-neutral-900">
                {formatAmount(totalCollected)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4 border border-neutral-200 rounded-lg bg-white">
          <CardContent className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-500">Outstanding</p>
              <p className="text-xl font-bold text-neutral-900">
                {formatAmount(totalOutstanding)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4 border border-neutral-200 rounded-lg bg-white">
          <CardContent className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-500">Overdue</p>
              <p className="text-xl font-bold text-neutral-900">
                {overdueCount} student{overdueCount !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe note */}
      <Card className="py-3 border border-neutral-200 rounded-lg bg-neutral-50">
        <CardContent className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-neutral-400 shrink-0" />
          <p className="text-sm text-neutral-600">
            <span className="font-medium">Stripe integration active.</span>{" "}
            Click &ldquo;Charge&rdquo; to bill a student&rsquo;s saved card for their monthly rate.
          </p>
        </CardContent>
      </Card>

      {/* Student billing */}
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Student Billing
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
        </div>

        <div className="overflow-hidden border border-[color:var(--color-border-warm)] rounded-lg bg-white">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_80px_100px] gap-4 px-4 py-2.5 bg-neutral-50 border-b border-[color:var(--color-border-warm)]">
            <SortableHeader sortKey="name" activeKey={billingSort.key} dir={billingSort.dir} onClick={billingSort.toggle}>Student</SortableHeader>
            <SortableHeader sortKey="grade" activeKey={billingSort.key} dir={billingSort.dir} onClick={billingSort.toggle}>Grade</SortableHeader>
            <SortableHeader sortKey="rate" activeKey={billingSort.key} dir={billingSort.dir} onClick={billingSort.toggle}>Rate/mo</SortableHeader>
            <SortableHeader sortKey="balance" activeKey={billingSort.key} dir={billingSort.dir} onClick={billingSort.toggle}>Balance</SortableHeader>
            <SortableHeader sortKey="status" activeKey={billingSort.key} dir={billingSort.dir} onClick={billingSort.toggle}>Status</SortableHeader>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[color:var(--color-border-warm)]">
            {filteredBilling.length === 0 && students.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <p className="text-sm">No students yet.</p>
              </div>
            )}

            {filteredBilling.map((sb) => (
              <div
                key={sb.student.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_100px_80px_100px] gap-2 sm:gap-4 items-center px-4 py-2.5"
              >
                <div>
                  <p className="font-medium text-neutral-900 text-sm">
                    {sb.student.firstName} {sb.student.lastName}
                  </p>
                  <p className="text-xs text-neutral-400 sm:hidden">
                    Grade {sb.student.grade} &middot; ${sb.student.rate}/mo
                  </p>
                </div>
                <span className="hidden sm:block text-sm text-neutral-600">
                  {sb.student.grade}
                </span>
                <span className="hidden sm:block text-sm text-neutral-600">
                  ${sb.student.rate}
                </span>
                <span
                  className={`hidden sm:block text-sm font-medium ${
                    sb.balance > 0 ? "text-red-600" : "text-neutral-400"
                  }`}
                >
                  {sb.balance > 0
                    ? formatAmount(sb.balance)
                    : "$0"}
                </span>
                <Badge className={statusBadgeClass(sb.latestStatus)}>
                  {statusLabel(sb.latestStatus)}
                </Badge>
                <ChargeButton
                  student={sb.student}
                  disabled={sb.latestStatus === "paid"}
                  onCharged={loadData}
                />
              </div>
            ))}

            {filteredBilling.length === 0 && students.length > 0 && (
              <div className="text-center py-8 text-neutral-500">
                <p className="text-sm">No students found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Recent Payment History
        </h2>
        <div className="overflow-hidden border border-[color:var(--color-border-warm)] rounded-lg bg-white">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[120px_1fr_100px_80px_80px] gap-4 px-4 py-2.5 bg-neutral-50 border-b border-[color:var(--color-border-warm)]">
            <SortableHeader sortKey="date" activeKey={paymentSort.key} dir={paymentSort.dir} onClick={paymentSort.toggle}>Date</SortableHeader>
            <SortableHeader sortKey="student" activeKey={paymentSort.key} dir={paymentSort.dir} onClick={paymentSort.toggle}>Student</SortableHeader>
            <SortableHeader sortKey="amount" activeKey={paymentSort.key} dir={paymentSort.dir} onClick={paymentSort.toggle}>Amount</SortableHeader>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Desc</span>
            <SortableHeader sortKey="status" activeKey={paymentSort.key} dir={paymentSort.dir} onClick={paymentSort.toggle}>Status</SortableHeader>
          </div>

          <div className="divide-y divide-[color:var(--color-border-warm)]">
            {recentPayments.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <p className="text-sm">No payment history yet.</p>
              </div>
            )}

            {recentPayments.map((payment, idx) => (
              <div
                key={`${payment.studentId}-${payment.createdAt}-${idx}`}
                className="grid grid-cols-1 sm:grid-cols-[120px_1fr_100px_80px_80px] gap-2 sm:gap-4 items-center px-4 py-2.5"
              >
                <span className="text-sm text-neutral-500 font-tabular">{formatDate(payment.createdAt)}</span>
                <span className="text-sm font-medium text-neutral-900">
                  {studentName(payment.studentId)}
                </span>
                <span className="text-sm text-neutral-600 font-tabular">
                  {formatAmount(payment.amount)}
                </span>
                <span className="hidden sm:block text-sm text-neutral-500 truncate">
                  {payment.description}
                </span>
                <Badge className={statusBadgeClass(payment.paymentStatus)}>
                  {statusLabel(payment.paymentStatus)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <FlatRateChargeCard onCharged={loadData} />
      </div>
    </div>
  );
}
