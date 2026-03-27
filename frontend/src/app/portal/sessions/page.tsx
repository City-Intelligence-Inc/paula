'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Badge from '@/components/Badge';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import type { Session } from '@/types';
import { CalendarDays, Clock, BookOpen } from 'lucide-react';

export default function PortalSessionsPage() {
  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <PortalSessionsContent />
    </ProtectedRoute>
  );
}

function PortalSessionsContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const s = await api.get<Session[]>('/portal/sessions');
        setSessions(s);
      } catch {
        toast('Failed to load sessions', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              Session History
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Past and upcoming sessions for your children.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-slate-400 shadow-sm">
              <CalendarDays className="mb-2 h-8 w-8" />
              <p className="text-sm">No sessions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {session.studentName || 'Session'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(session.date).toLocaleDateString(
                            'en-US',
                            {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            },
                          )}{' '}
                          at{' '}
                          {new Date(session.date).toLocaleTimeString(
                            [],
                            { hour: '2-digit', minute: '2-digit' },
                          )}{' '}
                          &middot; {session.duration} min
                          {session.subject
                            ? ` &middot; ${session.subject}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(session.status)}>
                      {session.status}
                    </Badge>
                  </div>

                  {/* Client note only — never show internal notes */}
                  {session.clientNote ? (
                    <div className="mt-2 rounded-lg bg-slate-50 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                        <BookOpen className="h-3.5 w-3.5" />
                        Session Notes
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-line">
                        {session.clientNote}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs italic text-slate-400">
                      No notes for this session.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
