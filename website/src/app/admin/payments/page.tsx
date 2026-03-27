"use client";

import { useEffect, useState } from "react";
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
      return "bg-mathitude-teal/10 text-mathitude-teal border-mathitude-teal/20";
    case "pending":
      return "bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20";
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

export default function AdminPaymentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/students").then((res) => res.json()),
      fetch("/api/payments").then((res) => res.json()),
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
          <h1 className="text-2xl font-bold text-mathitude-navy">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Loading payment data...</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-mathitude-teal border-t-transparent" />
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
        <h1 className="text-2xl font-bold text-mathitude-navy">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage billing and track payment status
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-mathitude-teal/10 p-2.5">
              <DollarSign className="h-5 w-5 text-mathitude-teal" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Collected</p>
              <p className="text-xl font-bold text-mathitude-navy">
                {formatAmount(totalCollected)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-mathitude-purple/10 p-2.5">
              <Clock className="h-5 w-5 text-mathitude-purple" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Outstanding</p>
              <p className="text-xl font-bold text-mathitude-navy">
                {formatAmount(totalOutstanding)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2.5">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Overdue</p>
              <p className="text-xl font-bold text-mathitude-navy">
                {overdueCount} student{overdueCount !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe note */}
      <Card className="py-3 border-mathitude-purple/20 bg-mathitude-purple/5">
        <CardContent className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-mathitude-purple shrink-0" />
          <p className="text-sm text-mathitude-purple">
            <span className="font-medium">Stripe integration coming soon.</span>{" "}
            Charge buttons are placeholders for the upcoming payment processing
            feature.
          </p>
        </CardContent>
      </Card>

      {/* Student billing */}
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-mathitude-navy">
            Student Billing
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-mathitude-teal focus:outline-none focus:ring-2 focus:ring-mathitude-teal/20"
            />
          </div>
        </div>

        <Card className="py-0 overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_80px_100px] gap-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
            <span>Student</span>
            <span>Grade</span>
            <span>Rate/mo</span>
            <span>Balance</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {filteredBilling.length === 0 && students.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No students yet.</p>
              </div>
            )}

            {filteredBilling.map((sb) => (
              <div
                key={sb.student.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_100px_80px_100px] gap-2 sm:gap-4 items-center px-4 py-3"
              >
                <div>
                  <p className="font-medium text-mathitude-navy text-sm">
                    {sb.student.firstName} {sb.student.lastName}
                  </p>
                  <p className="text-xs text-gray-400 sm:hidden">
                    Grade {sb.student.grade} &middot; ${sb.student.rate}/mo
                  </p>
                </div>
                <span className="hidden sm:block text-sm text-gray-600">
                  {sb.student.grade}
                </span>
                <span className="hidden sm:block text-sm text-gray-600">
                  ${sb.student.rate}
                </span>
                <span
                  className={`hidden sm:block text-sm font-medium ${
                    sb.balance > 0 ? "text-red-600" : "text-gray-400"
                  }`}
                >
                  {sb.balance > 0
                    ? formatAmount(sb.balance)
                    : "$0"}
                </span>
                <Badge className={statusBadgeClass(sb.latestStatus)}>
                  {statusLabel(sb.latestStatus)}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-fit text-xs border-mathitude-teal text-mathitude-teal hover:bg-mathitude-teal hover:text-white"
                  disabled={sb.latestStatus === "paid"}
                >
                  <DollarSign className="h-3 w-3" />
                  Charge
                </Button>
              </div>
            ))}

            {filteredBilling.length === 0 && students.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No students found.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Payment history */}
      <div>
        <h2 className="text-lg font-semibold text-mathitude-navy mb-4">
          Recent Payment History
        </h2>
        <Card className="py-0 overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[120px_1fr_100px_80px_80px] gap-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
            <span>Date</span>
            <span>Student</span>
            <span>Amount</span>
            <span>Desc</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-gray-100">
            {recentPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No payment history yet.</p>
              </div>
            )}

            {recentPayments.map((payment, idx) => (
              <div
                key={`${payment.studentId}-${payment.createdAt}-${idx}`}
                className="grid grid-cols-1 sm:grid-cols-[120px_1fr_100px_80px_80px] gap-2 sm:gap-4 items-center px-4 py-3"
              >
                <span className="text-sm text-gray-500">{formatDate(payment.createdAt)}</span>
                <span className="text-sm font-medium text-mathitude-navy">
                  {studentName(payment.studentId)}
                </span>
                <span className="text-sm text-gray-700">
                  {formatAmount(payment.amount)}
                </span>
                <span className="hidden sm:block text-sm text-gray-500 truncate">
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
