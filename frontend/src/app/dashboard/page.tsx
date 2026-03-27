'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import Badge from '@/components/Badge';
import api from '@/lib/api';
import type { DashboardStats, Session } from '@/types';
import {
  GraduationCap,
  CalendarDays,
  CalendarCheck,
  DollarSign,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const [s, sessions] = await Promise.all([
          api.get<DashboardStats>('/dashboard/stats'),
          api.get<Session[]>('/sessions?filter=today'),
        ]);
        setStats(s);
        setTodaySessions(sessions);
      } catch {
        // If API is down, show zeroes
        setStats({
          totalStudents: 0,
          sessionsToday: 0,
          sessionsThisWeek: 0,
          monthlyRevenue: 0,
        });
        setTodaySessions([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusVariant = (s: string) => {
    switch (s) {
      case 'completed':
        return 'success' as const;
      case 'cancelled':
        return 'danger' as const;
      default:
        return 'info' as const;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="md:ml-64">
        <div className="px-4 py-8 md:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back. Here is an overview of today.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Students"
                  value={stats?.totalStudents ?? 0}
                  icon={<GraduationCap className="h-6 w-6" />}
                />
                <StatsCard
                  title="Sessions Today"
                  value={stats?.sessionsToday ?? 0}
                  icon={<CalendarDays className="h-6 w-6" />}
                />
                <StatsCard
                  title="This Week"
                  value={stats?.sessionsThisWeek ?? 0}
                  icon={<CalendarCheck className="h-6 w-6" />}
                  subtitle="sessions scheduled"
                />
                <StatsCard
                  title="Monthly Revenue"
                  value={`$${(stats?.monthlyRevenue ?? 0).toLocaleString()}`}
                  icon={<DollarSign className="h-6 w-6" />}
                />
              </div>

              {/* Today's Sessions */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Today&apos;s Sessions
                  </h2>
                  <button
                    onClick={() => router.push('/sessions')}
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {todaySessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <CalendarDays className="mb-2 h-8 w-8" />
                    <p className="text-sm">No sessions scheduled for today.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {todaySessions.map((session) => (
                      <li
                        key={session.id}
                        onClick={() =>
                          router.push(`/sessions/${session.id}`)
                        }
                        className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Clock className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {session.studentName || 'Student'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {session.tutorName
                                ? `with ${session.tutorName}`
                                : ''}{' '}
                              &middot; {session.duration} min
                              {session.subject
                                ? ` &middot; ${session.subject}`
                                : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">
                            {new Date(session.date).toLocaleTimeString(
                              [],
                              { hour: '2-digit', minute: '2-digit' },
                            )}
                          </span>
                          <Badge variant={statusVariant(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
