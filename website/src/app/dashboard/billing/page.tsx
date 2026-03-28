"use client";

import { useEffect, useState } from "react";
import { SaveCardForm } from "@/components/stripe/save-card-form";
import { api } from "@/lib/api";
import type { Payment } from "@/lib/types";

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function statusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "overdue":
      return "Overdue";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function statusClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-neutral-100 text-neutral-900";
    case "pending":
      return "bg-neutral-100 text-neutral-500";
    case "overdue":
    case "failed":
      return "bg-red-50 text-red-600";
    default:
      return "bg-neutral-100 text-neutral-500";
  }
}

export default function BillingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/payments")
      .then((res) => res.json())
      .then((data) => {
        setPayments(data.payments || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...payments].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif italic font-medium text-neutral-900 tracking-tight">
          Billing &amp; Payments
        </h1>
        <p className="mt-3 text-neutral-500 max-w-lg">
          Manage your payment method and view your payment history.
        </p>
      </div>

      {/* Save Card */}
      <div className="max-w-md">
        <div className="mb-8 space-y-3">
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">1</span>
            <p className="text-sm text-neutral-600">Enter your card details below. Your card is stored securely by Stripe — Mathitude never sees your card number.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">2</span>
            <p className="text-sm text-neutral-600">Paula will manually charge your card after each tutoring session. You&apos;ll see a record of each charge below.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">3</span>
            <p className="text-sm text-neutral-600">To update your card, simply save a new one — it will replace the old one automatically.</p>
          </div>
        </div>
        <SaveCardForm />
        <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
          Your card is stored securely by Stripe. Mathitude staff will manually
          charge your card for tutoring sessions.
        </p>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Payment History
        </h2>

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[120px_1fr_100px_80px] gap-4 px-4 py-3 bg-neutral-50 text-xs font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
            <span>Date</span>
            <span>Description</span>
            <span>Amount</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-neutral-200">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-900 border-t-transparent" />
              </div>
            )}

            {!loading && sorted.length === 0 && (
              <div className="text-center py-12 text-neutral-500">
                <p className="text-sm">No payments yet.</p>
              </div>
            )}

            {!loading &&
              sorted.map((payment, idx) => (
                <div
                  key={`${payment.studentId}-${payment.createdAt}-${idx}`}
                  className="grid grid-cols-1 sm:grid-cols-[120px_1fr_100px_80px] gap-2 sm:gap-4 items-center px-4 py-3"
                >
                  <span className="text-sm text-neutral-500">
                    {formatDate(payment.createdAt)}
                  </span>
                  <span className="text-sm text-neutral-900">
                    {payment.description}
                  </span>
                  <span className="text-sm font-medium text-neutral-900">
                    {formatAmount(payment.amount)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium w-fit ${statusClass(
                      payment.paymentStatus
                    )}`}
                  >
                    {statusLabel(payment.paymentStatus)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
