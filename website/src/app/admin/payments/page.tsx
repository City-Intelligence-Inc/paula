"use client";

import { useState } from "react";
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

type PaymentStatus = "Paid" | "Pending" | "Overdue";

interface StudentPayment {
  id: number;
  name: string;
  grade: string;
  monthlyRate: number;
  status: PaymentStatus;
  lastPayment: string;
  balance: number;
}

interface PaymentRecord {
  id: number;
  date: string;
  student: string;
  amount: number;
  method: string;
  status: PaymentStatus;
}

const studentPayments: StudentPayment[] = [
  {
    id: 1,
    name: "Aarav Patel",
    grade: "5th",
    monthlyRate: 280,
    status: "Paid",
    lastPayment: "Mar 1, 2026",
    balance: 0,
  },
  {
    id: 2,
    name: "Sofia Martinez",
    grade: "7th",
    monthlyRate: 280,
    status: "Paid",
    lastPayment: "Mar 3, 2026",
    balance: 0,
  },
  {
    id: 3,
    name: "Ethan Chen",
    grade: "4th",
    monthlyRate: 240,
    status: "Pending",
    lastPayment: "Feb 5, 2026",
    balance: 240,
  },
  {
    id: 4,
    name: "Rohan Gupta",
    grade: "8th",
    monthlyRate: 320,
    status: "Paid",
    lastPayment: "Mar 2, 2026",
    balance: 0,
  },
  {
    id: 5,
    name: "Emma Wilson",
    grade: "3rd",
    monthlyRate: 240,
    status: "Overdue",
    lastPayment: "Jan 15, 2026",
    balance: 480,
  },
  {
    id: 6,
    name: "Liam Nakamura",
    grade: "5th",
    monthlyRate: 280,
    status: "Paid",
    lastPayment: "Mar 1, 2026",
    balance: 0,
  },
  {
    id: 7,
    name: "Noah Kim",
    grade: "4th",
    monthlyRate: 240,
    status: "Pending",
    lastPayment: "Feb 3, 2026",
    balance: 240,
  },
  {
    id: 8,
    name: "Zara Ahmed",
    grade: "7th",
    monthlyRate: 280,
    status: "Paid",
    lastPayment: "Mar 5, 2026",
    balance: 0,
  },
  {
    id: 9,
    name: "Aiden O'Brien",
    grade: "5th",
    monthlyRate: 280,
    status: "Paid",
    lastPayment: "Mar 1, 2026",
    balance: 0,
  },
  {
    id: 10,
    name: "Priya Sharma",
    grade: "8th",
    monthlyRate: 320,
    status: "Overdue",
    lastPayment: "Jan 20, 2026",
    balance: 640,
  },
];

const paymentHistory: PaymentRecord[] = [
  {
    id: 1,
    date: "Mar 5, 2026",
    student: "Zara Ahmed",
    amount: 280,
    method: "Card",
    status: "Paid",
  },
  {
    id: 2,
    date: "Mar 3, 2026",
    student: "Sofia Martinez",
    amount: 280,
    method: "Card",
    status: "Paid",
  },
  {
    id: 3,
    date: "Mar 2, 2026",
    student: "Rohan Gupta",
    amount: 320,
    method: "ACH",
    status: "Paid",
  },
  {
    id: 4,
    date: "Mar 1, 2026",
    student: "Aarav Patel",
    amount: 280,
    method: "Card",
    status: "Paid",
  },
  {
    id: 5,
    date: "Mar 1, 2026",
    student: "Liam Nakamura",
    amount: 280,
    method: "Card",
    status: "Paid",
  },
  {
    id: 6,
    date: "Mar 1, 2026",
    student: "Aiden O'Brien",
    amount: 280,
    method: "ACH",
    status: "Paid",
  },
  {
    id: 7,
    date: "Feb 5, 2026",
    student: "Ethan Chen",
    amount: 240,
    method: "Card",
    status: "Paid",
  },
  {
    id: 8,
    date: "Feb 3, 2026",
    student: "Noah Kim",
    amount: 240,
    method: "Card",
    status: "Paid",
  },
];

function statusBadgeClass(status: PaymentStatus) {
  switch (status) {
    case "Paid":
      return "bg-mathitude-teal/10 text-mathitude-teal border-mathitude-teal/20";
    case "Pending":
      return "bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20";
    case "Overdue":
      return "bg-red-50 text-red-600 border-red-200";
  }
}

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");

  const filtered = studentPayments.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = studentPayments.reduce(
    (sum, s) => sum + s.balance,
    0
  );
  const overdueCount = studentPayments.filter(
    (s) => s.status === "Overdue"
  ).length;

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
              <p className="text-xs text-gray-500">Collected (Mar)</p>
              <p className="text-xl font-bold text-mathitude-navy">
                ${totalCollected.toLocaleString()}
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
                ${totalOutstanding.toLocaleString()}
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
            {filtered.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_100px_80px_100px] gap-2 sm:gap-4 items-center px-4 py-3"
              >
                <div>
                  <p className="font-medium text-mathitude-navy text-sm">
                    {student.name}
                  </p>
                  <p className="text-xs text-gray-400 sm:hidden">
                    Grade {student.grade} &middot; ${student.monthlyRate}/mo
                  </p>
                </div>
                <span className="hidden sm:block text-sm text-gray-600">
                  {student.grade}
                </span>
                <span className="hidden sm:block text-sm text-gray-600">
                  ${student.monthlyRate}
                </span>
                <span
                  className={`hidden sm:block text-sm font-medium ${
                    student.balance > 0 ? "text-red-600" : "text-gray-400"
                  }`}
                >
                  {student.balance > 0
                    ? `$${student.balance}`
                    : "$0"}
                </span>
                <Badge className={statusBadgeClass(student.status)}>
                  {student.status}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-fit text-xs border-mathitude-teal text-mathitude-teal hover:bg-mathitude-teal hover:text-white"
                  disabled={student.status === "Paid"}
                >
                  <DollarSign className="h-3 w-3" />
                  Charge
                </Button>
              </div>
            ))}

            {filtered.length === 0 && (
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
            <span>Method</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-gray-100">
            {paymentHistory.map((payment) => (
              <div
                key={payment.id}
                className="grid grid-cols-1 sm:grid-cols-[120px_1fr_100px_80px_80px] gap-2 sm:gap-4 items-center px-4 py-3"
              >
                <span className="text-sm text-gray-500">{payment.date}</span>
                <span className="text-sm font-medium text-mathitude-navy">
                  {payment.student}
                </span>
                <span className="text-sm text-gray-700">
                  ${payment.amount}
                </span>
                <span className="hidden sm:block text-sm text-gray-500">
                  {payment.method}
                </span>
                <Badge className={statusBadgeClass(payment.status)}>
                  {payment.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
