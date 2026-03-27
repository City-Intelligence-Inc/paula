'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Badge from '@/components/Badge';
import SessionNoteEditor from '@/components/SessionNoteEditor';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import type { Session } from '@/types';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  User,
  BookOpen,
} from 'lucide-react';

export default function SessionDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <SessionDetailContent />
    </ProtectedRoute>
  );
}

function SessionDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadSession() {
    try {
      const s = await api.get<Session>(`/sessions/${params.id}`);
      setSession(s);
    } catch {
      toast('Failed to load session', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

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

  async function updateStatus(status: string) {
    try {
      await api.put(`/sessions/${params.id}`, { status });
      setSession((prev) =>
        prev ? { ...prev, status: status as Session['status'] } : prev,
      );
      toast(`Session marked as ${status}`, 'success');
    } catch {
      toast('Failed to update status', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="md:ml-64">
        <div className="px-4 py-8 md:px-8">
          {/* Back */}
          <button
            onClick={() => router.push('/sessions')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sessions
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : !session ? (
            <div className="py-16 text-center text-slate-500">
              Session not found.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Session Info */}
              <div className="lg:col-span-1">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">
                      Session Details
                    </h2>
                    <Badge variant={statusVariant(session.status)}>
                      {session.status}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <User className="h-4 w-4 text-slate-400" />
                      <div>
                        <span className="text-slate-500">Student</span>
                        <p className="font-medium text-slate-900">
                          {session.studentName || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    {session.tutorName && (
                      <div className="flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 text-slate-400" />
                        <div>
                          <span className="text-slate-500">Tutor</span>
                          <p className="font-medium text-slate-900">
                            {session.tutorName}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      <div>
                        <span className="text-slate-500">Date</span>
                        <p className="font-medium text-slate-900">
                          {new Date(session.date).toLocaleDateString(
                            'en-US',
                            {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <div>
                        <span className="text-slate-500">Time</span>
                        <p className="font-medium text-slate-900">
                          {new Date(session.date).toLocaleTimeString(
                            [],
                            { hour: '2-digit', minute: '2-digit' },
                          )}{' '}
                          &middot; {session.duration} min
                        </p>
                      </div>
                    </div>
                    {session.subject && (
                      <div className="flex items-center gap-3 text-sm">
                        <BookOpen className="h-4 w-4 text-slate-400" />
                        <div>
                          <span className="text-slate-500">Subject</span>
                          <p className="font-medium text-slate-900">
                            {session.subject}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick status actions */}
                  {session.status === 'scheduled' && (
                    <div className="mt-6 flex gap-2">
                      <button
                        onClick={() => updateStatus('completed')}
                        className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => updateStatus('cancelled')}
                        className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="lg:col-span-2">
                <SessionNoteEditor
                  sessionId={session.id}
                  initialInternalNote={session.internalNote || ''}
                  initialClientNote={session.clientNote || ''}
                  onSaved={loadSession}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
