'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Badge from '@/components/Badge';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import type { PortalDashboard } from '@/types';
import {
  CalendarDays,
  Clock,
  CreditCard,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export default function PortalPage() {
  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <PortalContent />
    </ProtectedRoute>
  );
}

function PortalContent() {
  const [data, setData] = useState<PortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const d = await api.get<PortalDashboard>('/portal/dashboard');
        setData(d);
      } catch {
        toast('Failed to load dashboard', 'error');
        setData({
          upcomingSessions: [],
          recentSessions: [],
          packages: [],
        });
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="md:ml-64">
        <div className="px-4 py-8 md:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome Back
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Here is what is happening with your children&apos;s tutoring.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : !data ? null : (
            <div className="space-y-6">
              {/* Package Status */}
              {data.packages.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-semibold text-slate-900">
                            {pkg.name}
                          </span>
                        </div>
                        <Badge
                          variant={
                            pkg.status === 'active'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {pkg.status}
                        </Badge>
                      </div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-slate-500">Sessions</span>
                        <span className="font-medium text-slate-900">
                          {pkg.usedSessions} / {pkg.totalSessions}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{
                            width: `${Math.min(
                              (pkg.usedSessions / pkg.totalSessions) *
                                100,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {pkg.totalSessions - pkg.usedSessions} sessions
                        remaining
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {data.nextBillingDate && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Next billing date:{' '}
                  <strong>
                    {new Date(
                      data.nextBillingDate,
                    ).toLocaleDateString()}
                  </strong>
                </div>
              )}

              {/* Upcoming Sessions */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Upcoming Sessions
                  </h2>
                  <button
                    onClick={() => router.push('/portal/sessions')}
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View All <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                {data.upcomingSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <CalendarDays className="mb-2 h-8 w-8" />
                    <p className="text-sm">No upcoming sessions.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.upcomingSessions.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between px-6 py-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Clock className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {s.studentName || 'Session'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(s.date).toLocaleDateString()} at{' '}
                              {new Date(s.date).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              &middot; {s.duration} min
                              {s.subject ? ` &middot; ${s.subject}` : ''}
                            </p>
                          </div>
                        </div>
                        <Badge variant="info">{s.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recent Session Summaries */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recent Session Summaries
                  </h2>
                </div>
                {data.recentSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <BookOpen className="mb-2 h-8 w-8" />
                    <p className="text-sm">
                      No recent session summaries available.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.recentSessions.map((s) => (
                      <li key={s.id} className="px-6 py-4">
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">
                            {s.studentName || 'Session'} &mdash;{' '}
                            {new Date(s.date).toLocaleDateString()}
                          </p>
                          <Badge
                            variant={
                              s.status === 'completed'
                                ? 'success'
                                : 'info'
                            }
                          >
                            {s.status}
                          </Badge>
                        </div>
                        {s.clientNote ? (
                          <p className="text-sm text-slate-600 whitespace-pre-line">
                            {s.clientNote}
                          </p>
                        ) : (
                          <p className="text-sm italic text-slate-400">
                            No notes for this session.
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
