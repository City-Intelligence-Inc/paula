"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { ArrowLeft, FileText, CalendarClock, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { gradeLabel } from "@/lib/grades";

// Tutor-facing, read-mostly student view. The /admin pages redirect non-admins
// to /dashboard, so assigned tutors land here instead. Everything it shows is
// scoped + pricing-stripped server-side by the student/sessions/notes APIs
// (see lib/server/access.ts) — a "limited" class instructor only sees group
// sessions and their own notes.
interface Student {
  id: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  status?: string;
  sessionType?: string;
}

interface SessionRow {
  studentId: string;
  dateTime: string;
  date?: string;
  time?: string;
  duration?: number;
  type?: string;
  status?: string;
  notes?: string;
  content?: string;
  createdBy?: string;
}

export default function TutorStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);
  const fetchApi = useApi();
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [notes, setNotes] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const sRes = await fetchApi(`/api/students/${id}`);
      if (sRes.status === 403 || sRes.status === 401) {
        if (!cancelled) {
          setForbidden(true);
          setLoading(false);
        }
        return;
      }
      const sJson = await sRes.json().catch(() => ({}));
      const [sessRes, notesRes] = await Promise.all([
        fetchApi(`/api/students/${id}/sessions`),
        fetchApi(`/api/students/${id}/notes`),
      ]);
      const sessJson = await sessRes.json().catch(() => ({}));
      const notesJson = await notesRes.json().catch(() => ({}));
      if (!cancelled) {
        setStudent(sJson.student || null);
        setSessions((sessJson.sessions || []).filter((s: SessionRow) => s.type !== "note"));
        setNotes(notesJson.notes || []);
        setLoading(false);
      }
    }
    load().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchApi, id]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetchApi(`/api/students/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        setNotes((prev) => [json.note, ...prev]);
        setNewNote("");
      }
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/tutor"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portal
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
          </div>
        ) : forbidden ? (
          <Card className="border border-neutral-200 rounded-lg">
            <div className="p-10 text-center text-sm text-neutral-500">
              You don&apos;t have access to this student. You can only view the
              students assigned to you.
            </div>
          </Card>
        ) : !student ? (
          <Card className="border border-neutral-200 rounded-lg">
            <div className="p-10 text-center text-sm text-neutral-500">
              Student not found.
            </div>
          </Card>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                {gradeLabel(student.grade)}
                {student.sessionType ? ` · ${student.sessionType}` : ""}
              </p>
            </div>

            {/* Notes */}
            <Card className="border border-neutral-200 rounded-lg mb-6">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-neutral-400" />
                  <h2 className="text-lg font-semibold text-neutral-900">Notes</h2>
                </div>
                <form onSubmit={addNote} className="mb-5">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    placeholder="Add a session note…"
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-neutral-900/10 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !newNote.trim()}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#7030A0] text-white hover:bg-[#5d288a] disabled:opacity-50 px-4 py-2 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    {savingNote ? "Saving…" : "Add note"}
                  </button>
                </form>
                {notes.length === 0 ? (
                  <p className="text-sm text-neutral-400">No notes yet.</p>
                ) : (
                  <div className="space-y-3">
                    {notes.map((n) => (
                      <div
                        key={n.dateTime}
                        className="rounded-md border border-neutral-100 bg-neutral-50 p-3"
                      >
                        <p className="text-xs text-neutral-400">
                          {n.date} {n.time}
                        </p>
                        <p className="mt-1 text-sm text-neutral-800 whitespace-pre-wrap">
                          {n.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Session history */}
            <Card className="border border-neutral-200 rounded-lg">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarClock className="h-5 w-5 text-neutral-400" />
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Session History
                  </h2>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-sm text-neutral-400">No sessions to show.</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {sessions.map((s) => (
                      <div key={s.dateTime} className="py-3 flex items-baseline justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-neutral-800">
                            {s.date} {s.time ? `· ${s.time}` : ""}
                          </p>
                          {s.notes && (
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {s.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-neutral-400 shrink-0">
                          {s.type}
                          {s.duration ? ` · ${s.duration}m` : ""}
                          {s.status ? ` · ${s.status}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
