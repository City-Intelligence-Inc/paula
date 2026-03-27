'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import DataTable, { type Column } from '@/components/DataTable';
import Badge from '@/components/Badge';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import type { Payment } from '@/types';
import { DollarSign } from 'lucide-react';

export default function PortalPaymentsPage() {
  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <PortalPaymentsContent />
    </ProtectedRoute>
  );
}

function PortalPaymentsContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const p = await api.get<Payment[]>('/portal/payments');
        setPayments(p);
      } catch {
        toast('Failed to load payments', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: Column<Payment>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (p) => (
        <span className="font-medium text-slate-900">
          {new Date(p.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (p) => <span>{p.description}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (p) => (
        <span className="font-medium text-slate-900">
          ${p.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <Badge
          variant={
            p.status === 'paid'
              ? 'success'
              : p.status === 'pending'
                ? 'warning'
                : 'danger'
          }
        >
          {p.status}
        </Badge>
      ),
    },
  ];

  // Summary
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="md:ml-64">
        <div className="px-4 py-8 md:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
            <p className="mt-1 text-sm text-slate-500">
              Your payment history.
            </p>
          </div>

          {/* Summary */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Paid</p>
                <p className="text-xl font-bold text-slate-900">
                  ${totalPaid.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={payments}
            loading={loading}
            emptyMessage="No payment records found."
          />
        </div>
      </main>
    </div>
  );
}
