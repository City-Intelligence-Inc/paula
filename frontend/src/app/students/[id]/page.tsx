'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Badge from '@/components/Badge';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import type { Student, Session } from '@/types';
import {
  ArrowLeft,
  GraduationCap,
  CalendarDays,
  Clock,
  AlertTriangle,
  Save,
  Loader2,
} from 'lucide-react';

export default function StudentDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <StudentDetailContent />
    </ProtectedRoute>
  );
}

function StudentDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [s, sess] = await Promise.all([
          api.get<Student>(`/students/${params.id}`),
          api.get<Session[]>(`/students/${params.id}/sessions`),
        ]);
        setStudent(s);
        setSessions(sess);
        setNotes(s.notes || '');
      } catch {
        toast('Failed to load student', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await api.put(`/students/${params.id}`, { notes });
      toast('Notes saved', 'success');
    } catch {
      toast('Failed to save notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  }

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
          {/* Back button */}
          <button
            onClick={() => router.push('/students')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Students
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : !student ? (
            <div className="py-16 text-center text-slate-500">
              Student not found.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Student Info Card */}
              <div className="lg:col-span-1">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {student.firstName} {student.lastName}
                  </h2>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Grade</span>
                      <span className="font-medium text-slate-900">
                        {student.grade}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Family</span>
                      <span className="font-medium text-slate-900">
                        {student.familyName || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Enrolled</span>
                      <span className="font-medium text-slate-900">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {student.nextSession && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Next Session</span>
                        <span className="font-medium text-slate-900">
                          {new Date(
                            student.nextSession,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6 lg:col-span-2">
                {/* Internal Notes */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Internal Notes
                    </h3>
                    <Badge variant="danger">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      ADMIN ONLY
                    </Badge>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add private notes about this student..."
                    className="h-28 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={saveNotes}
                      disabled={savingNotes}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingNotes ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </button>
                  </div>
                </div>

                {/* Session History */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Session History
                    </h3>
                  </div>
                  {sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <CalendarDays className="mb-2 h-8 w-8" />
                      <p className="text-sm">No sessions yet.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {sessions.map((session) => (
                        <li
                          key={session.id}
                          onClick={() =>
                            router.push(`/sessions/${session.id}`)
                          }
                          className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <Clock className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {new Date(
                                  session.date,
                                ).toLocaleDateString()}{' '}
                                at{' '}
                                {new Date(
                                  session.date,
                                ).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              <p className="text-xs text-slate-500">
                                {session.duration} min
                                {session.subject
                                  ? ` - ${session.subject}`
                                  : ''}
                                {session.tutorName
                                  ? ` with ${session.tutorName}`
                                  : ''}
                              </p>
                            </div>
                          </div>
                          <Badge variant={statusVariant(session.status)}>
                            {session.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
