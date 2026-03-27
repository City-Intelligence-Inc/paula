'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import DataTable, { type Column } from '@/components/DataTable';
import Badge from '@/components/Badge';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import type { Package, Payment } from '@/types';
import { CreditCard, DollarSign, Receipt } from 'lucide-react';

export default function BillingPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <BillingContent />
    </ProtectedRoute>
  );
}

function BillingContent() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'packages' | 'payments'>(
    'packages',
  );
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const [pkg, pay] = await Promise.all([
          api.get<Package[]>('/packages'),
          api.get<Payment[]>('/payments'),
        ]);
        setPackages(pkg);
        setPayments(pay);
      } catch {
        toast('Failed to load billing data', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const packageColumns: Column<Package>[] = [
    {
      key: 'familyName',
      header: 'Family',
      render: (p) => (
        <span className="font-medium text-slate-900">
          {p.familyName || '-'}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Package',
      render: (p) => <span>{p.name}</span>,
    },
    {
      key: 'sessions',
      header: 'Sessions',
      render: (p) => (
        <div>
          <span className="font-medium text-slate-900">
            {p.usedSessions}
          </span>
          <span className="text-slate-400"> / {p.totalSessions}</span>
          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${Math.min(
                  (p.usedSessions / p.totalSessions) * 100,
                  100,
                )}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'pricePerSession',
      header: 'Rate',
      render: (p) => <span>${p.pricePerSession}/session</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <Badge
          variant={p.status === 'active' ? 'success' : 'neutral'}
        >
          {p.status}
        </Badge>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (p) => (
        <span>{new Date(p.startDate).toLocaleDateString()}</span>
      ),
    },
  ];

  const paymentColumns: Column<Payment>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (p) => (
        <span className="font-medium text-slate-900">
          {new Date(p.date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'familyName',
      header: 'Family',
      render: (p) => <span>{p.familyName || '-'}</span>,
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="md:ml-64">
        <div className="px-4 py-8 md:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
            <p className="mt-1 text-sm text-slate-500">
              Packages and payment history.
            </p>
          </div>

          {/* Summary cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Active Packages</p>
                  <p className="text-lg font-bold text-slate-900">
                    {packages.filter((p) => p.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Received</p>
                  <p className="text-lg font-bold text-slate-900">
                    $
                    {payments
                      .filter((p) => p.status === 'paid')
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pending</p>
                  <p className="text-lg font-bold text-slate-900">
                    $
                    {payments
                      .filter((p) => p.status === 'pending')
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'packages'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Packages
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'payments'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Payments
            </button>
          </div>

          {activeTab === 'packages' ? (
            <DataTable
              columns={packageColumns}
              data={packages}
              loading={loading}
              emptyMessage="No packages found."
            />
          ) : (
            <DataTable
              columns={paymentColumns}
              data={payments}
              loading={loading}
              emptyMessage="No payments recorded."
            />
          )}
        </div>
      </main>
    </div>
  );
}
