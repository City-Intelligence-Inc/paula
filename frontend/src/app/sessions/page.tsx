'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import type { Session, Student } from '@/types';
import {
  Plus,
  CalendarDays,
  Clock,
  Loader2,
  List,
  LayoutGrid,
} from 'lucide-react';

export default function SessionsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <SessionsContent />
    </ProtectedRoute>
  );
}

type ViewMode = 'list' | 'calendar';

function SessionsContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const router = useRouter();
  const { toast } = useToast();

  async function loadSessions() {
    try {
      const [sess, stud] = await Promise.all([
        api.get<Session[]>('/sessions'),
        api.get<Student[]>('/students'),
      ]);
      setSessions(sess);
      setStudents(stud);
    } catch {
      toast('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
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

  // Group sessions by date for calendar view
  const grouped = sessions.reduce<Record<string, Session[]>>((acc, s) => {
    const dateKey = new Date(s.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="md:ml-64">
        <div className="px-4 py-8 md:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage tutoring sessions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex rounded-lg border border-slate-200 bg-white">
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-l-lg px-3 py-2 ${
                    viewMode === 'list'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`rounded-r-lg px-3 py-2 ${
                    viewMode === 'calendar'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Session
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-slate-400 shadow-sm">
              <CalendarDays className="mb-2 h-8 w-8" />
              <p className="text-sm">No sessions found. Schedule one to get started.</p>
            </div>
          ) : viewMode === 'list' ? (
            /* List view */
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
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
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {session.studentName || 'Student'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(session.date).toLocaleDateString()}{' '}
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
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            /* Calendar-style grouped view */
            <div className="space-y-6">
              {Object.entries(grouped).map(([dateLabel, daySessions]) => (
                <div key={dateLabel}>
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">
                    {dateLabel}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {daySessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() =>
                          router.push(`/sessions/${session.id}`)
                        }
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900">
                            {session.studentName || 'Student'}
                          </span>
                          <Badge variant={statusVariant(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(session.date).toLocaleTimeString(
                            [],
                            { hour: '2-digit', minute: '2-digit' },
                          )}{' '}
                          &middot; {session.duration} min
                        </p>
                        {session.tutorName && (
                          <p className="mt-1 text-xs text-slate-400">
                            with {session.tutorName}
                          </p>
                        )}
                        {session.subject && (
                          <p className="mt-1 text-xs text-slate-400">
                            {session.subject}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AddSessionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        students={students}
        onCreated={() => {
          setShowModal(false);
          setLoading(true);
          loadSessions();
        }}
      />
    </div>
  );
}

// ── Add Session Modal ────────────────────────────────────────────────────────

function AddSessionModal({
  open,
  onClose,
  students,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  students: Student[];
  onCreated: () => void;
}) {
  const [studentId, setStudentId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [subject, setSubject] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  function reset() {
    setStudentId('');
    setDate('');
    setTime('');
    setDuration('60');
    setSubject('');
    setTutorName('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const dateTime = new Date(`${date}T${time}`).toISOString();
      await api.post('/sessions', {
        studentId,
        date: dateTime,
        duration: Number(duration),
        subject: subject || undefined,
        tutorName: tutorName || undefined,
        status: 'scheduled',
      });
      toast('Session scheduled', 'success');
      reset();
      onCreated();
    } catch {
      toast('Failed to create session', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule Session" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Student
          </label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Duration (min)
            </label>
            <input
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Algebra"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tutor Name
          </label>
          <input
            value={tutorName}
            onChange={(e) => setTutorName(e.target.value)}
            placeholder="e.g. Paula"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Schedule
          </button>
        </div>
      </form>
    </Modal>
  );
}
