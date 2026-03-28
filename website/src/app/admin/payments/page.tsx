"use client";

import { useEffect, useState } from "react";
  const fetchApi = useApi();
import { useApi } from "@/hooks/use-api";
import {
  DollarSign,
  CreditCard,
  Clock,
  AlertCircle,
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
import type { Student, Payment } from "@/lib/types";

type PaymentStatus = "paid" | "pending" | "overdue" | "failed";

function statusBadgeClass(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "bg-neutral-900/5 text-neutral-900 border-neutral-200";
    case "pending":
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
    case "overdue":
    case "failed":
      return "bg-red-50 text-red-600 border-red-200";
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
}: {
  student: Student;
  disabled: boolean;
}) {
  const [charging, setCharging] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleCharge = async () => {
    const name = `${student.firstName} ${student.lastName}`;
    const confirmed = window.confirm(
      `Charge ${name} $${student.rate}?`
    );
    if (!confirmed) return;

    setCharging(true);
    setResult(null);

    try {
      const res = await fetchApi("/api/stripe/charge", {
        method: "POST",
        body: JSON.stringify({
          studentId: student.id,
          amount: student.rate * 100, // convert to cents
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
        setResult({ type: "success", message: "Charged!" });
      }
    } catch {
      setResult({
        type: "error",
        message: "An unexpected error occurred.",
      });
    } finally {
      setCharging(false);
      // Clear the result message after 3 seconds
      setTimeout(() => setResult(null), 3000);
    }
  };

  return (
    <div className="flex items-center gap-2">
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
        <span
          className={`text-xs font-medium ${
            result.type === "success"
              ? "text-neutral-600"
              : "text-red-500"
          }`}
        >
          {result.message}
        </span>
      )}
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetchApi("/api/students").then((res) => res.json()),
      fetchApi("/api/payments").then((res) => res.json()),
    ])
      .then(([studentsJson, paymentsJson]) => {
        setStudents(studentsJson.students || []);
        setPayments(paymentsJson.payments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif italic font-medium text-neutral-900 tracking-tight">Payments</h1>
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

  // Get recent payments sorted by date
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

  const filteredBilling = studentBilling.filter((sb) =>
    `${sb.student.firstName} ${sb.student.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif italic font-medium text-neutral-900 tracking-tight">Payments</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage billing and track payment status
        </p>
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

        <Card className="py-0 overflow-hidden border border-neutral-200 rounded-lg">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_80px_100px] gap-4 px-4 py-3 bg-neutral-50 text-xs font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
            <span>Student</span>
            <span>Grade</span>
            <span>Rate/mo</span>
            <span>Balance</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-neutral-200">
            {filteredBilling.length === 0 && students.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <p className="text-sm">No students yet.</p>
              </div>
            )}

            {filteredBilling.map((sb) => (
              <div
                key={sb.student.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_100px_80px_100px] gap-2 sm:gap-4 items-center px-4 py-3"
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
                />
              </div>
            ))}

            {filteredBilling.length === 0 && students.length > 0 && (
              <div className="text-center py-8 text-neutral-500">
                <p className="text-sm">No students found.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Payment history */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Recent Payment History
        </h2>
        <Card className="py-0 overflow-hidden border border-neutral-200 rounded-lg">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[120px_1fr_100px_80px_80px] gap-4 px-4 py-3 bg-neutral-50 text-xs font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
            <span>Date</span>
            <span>Student</span>
            <span>Amount</span>
            <span>Desc</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-neutral-200">
            {recentPayments.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <p className="text-sm">No payment history yet.</p>
              </div>
            )}

            {recentPayments.map((payment, idx) => (
              <div
                key={`${payment.studentId}-${payment.createdAt}-${idx}`}
                className="grid grid-cols-1 sm:grid-cols-[120px_1fr_100px_80px_80px] gap-2 sm:gap-4 items-center px-4 py-3"
              >
                <span className="text-sm text-neutral-500">{formatDate(payment.createdAt)}</span>
                <span className="text-sm font-medium text-neutral-900">
                  {studentName(payment.studentId)}
                </span>
                <span className="text-sm text-neutral-600">
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
        </Card>
      </div>
    </div>
  );
}
