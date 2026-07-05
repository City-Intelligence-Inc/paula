"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ParentNotesView } from "@/components/notes/parent-notes-view";
import { useApi } from "@/hooks/use-api";
import {
  DEMO_STUDENTS,
  DEMO_FAMILIES,
  DEMO_NOTES,
  studentsVisibleTo,
  type SessionNote,
} from "@/lib/session-notes";

// /notes — the family-facing notes page (FEATURE_LIST N-9), matching
// PARENT_VIEWING_NOTES.png.
//
// LIVE mode (signed-in): children + notes come from /api/me/notes, scoped
// server-side to the signed-in parent's family (or the student themself —
// R-7); replies persist via /api/students/:id/session-notes/reply.
// DEMO mode (signed-out): synthetic data with role/family switchers.

interface FamilyStudent {
  id: string;
  firstName: string;
  lastName: string;
  grade?: string;
  school?: string;
  sharedFiles?: { id: string; name: string; url: string; createdAt: string }[];
}

export default function NotesPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const fetchApi = useApi();
  const isLive = isLoaded && !!isSignedIn;

  // ── Live state ────────────────────────────────────────────────────────────
  const [liveRole, setLiveRole] = React.useState<"parent" | "student">("parent");
  const [liveStudents, setLiveStudents] = React.useState<FamilyStudent[]>([]);
  const [liveNotes, setLiveNotes] = React.useState<SessionNote[]>([]);
  const [liveLoading, setLiveLoading] = React.useState(false);
  const [liveError, setLiveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isLive) return;
    setLiveLoading(true);
    fetchApi("/api/me/notes")
      .then((r) => r.json())
      .then((j: {
        role?: "parent" | "student";
        students?: FamilyStudent[];
        notes?: SessionNote[];
        error?: string;
      }) => {
        if (j.error) { setLiveError(j.error); return; }
        setLiveRole(j.role === "student" ? "student" : "parent");
        setLiveStudents(j.students || []);
        setLiveNotes(
          (j.notes || []).map((n) => ({
            ...n,
            id: n.id || `${n.studentId}_${n.dateTime}`,
          })),
        );
      })
      .catch((e) => setLiveError(String(e)))
      .finally(() => setLiveLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive]);

  // ── Demo state ────────────────────────────────────────────────────────────
  const [asRole, setAsRole] = React.useState<"parent" | "student">("parent");
  const [familyId, setFamilyId] = React.useState(DEMO_FAMILIES[0].id);
  const [selfId, setSelfId] = React.useState(DEMO_STUDENTS[0].id);

  const demoVisible = studentsVisibleTo(asRole, { familyId, studentId: selfId });
  const [childId, setChildId] = React.useState(demoVisible[0]?.id ?? "");

  const role = isLive ? liveRole : asRole;
  const visible: FamilyStudent[] = isLive ? liveStudents : demoVisible;

  // Keep the selected child inside the current scope.
  React.useEffect(() => {
    if (visible.length && !visible.some((s) => s.id === childId)) {
      setChildId(visible[0].id);
    }
  }, [visible, childId]);

  const studentId = !isLive && asRole === "student" ? selfId : childId;
  const student = visible.find((s) => s.id === studentId) ?? visible[0];

  // Demo note state so a parent's reply persists during the demo session.
  const [demoNotes, setDemoNotes] = React.useState<SessionNote[]>(DEMO_NOTES);
  const allNotes = isLive ? liveNotes : demoNotes;
  const notes = student
    ? allNotes
        .filter((n) => n.studentId === student.id)
        .sort((a, b) => b.dateTime.localeCompare(a.dateTime))
    : [];

  // N-6: append to the shared comment thread on a note.
  async function handleAddComment(noteId: string, text: string) {
    const list = isLive ? liveNotes : demoNotes;
    const note = list.find((n) => n.id === noteId);
    if (!note) return;
    if (isLive) {
      setLiveError(null);
      try {
        const res = await fetchApi(
          `/api/students/${note.studentId}/session-notes/comments`,
          {
            method: "POST",
            body: JSON.stringify({ dateTime: note.dateTime, text }),
          },
        );
        const j = await res.json() as {
          comment?: NonNullable<SessionNote["comments"]>[number];
          error?: string;
        };
        if (!res.ok || !j.comment) {
          setLiveError(j.error || "Comment failed to post");
          return;
        }
        setLiveNotes((prev) =>
          prev.map((n) =>
            n.id === noteId
              ? { ...n, comments: [...(n.comments || []), j.comment!] }
              : n,
          ),
        );
      } catch (e) {
        setLiveError(String(e));
      }
      return;
    }
    setDemoNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              comments: [
                ...(n.comments || []),
                {
                  id: `c_${Date.now().toString(36)}`,
                  authorName: "You",
                  authorRole: "parent" as const,
                  text,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : n,
      ),
    );
  }

  async function handleReply(noteId: string, text: string) {
    if (isLive) {
      setLiveError(null);
      try {
        const note = liveNotes.find((n) => n.id === noteId);
        if (!note) return;
        const res = await fetchApi(
          `/api/students/${note.studentId}/session-notes/reply`,
          {
            method: "PUT",
            body: JSON.stringify({ dateTime: note.dateTime, familyReply: text }),
          },
        );
        if (!res.ok) {
          const j = await res.json() as { error?: string };
          setLiveError(j.error || "Reply failed to save");
          return;
        }
        setLiveNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, familyReply: text } : n)),
        );
      } catch (e) {
        setLiveError(String(e));
      }
      return;
    }
    setDemoNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, familyReply: text } : n)),
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* DEMO controls — signed-out only */}
        {!isLive && (
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 pt-6">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Demo · view as
            </span>
            {(["parent", "student"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setAsRole(r)}
                className="rounded-full px-3 py-1 text-xs font-medium ring-1 ring-border-warm transition-colors"
                style={
                  asRole === r
                    ? { backgroundColor: "#7030A0", color: "#fff" }
                    : { color: "#7030A0" }
                }
              >
                {r === "parent" ? "Parent" : "Student"}
              </button>
            ))}
            {asRole === "parent" ? (
              <label className="ml-2 flex items-center gap-1.5 text-xs text-text-muted">
                Family
                <select
                  value={familyId}
                  onChange={(e) => setFamilyId(e.target.value)}
                  className="rounded-md border border-border-warm bg-white px-2 py-1 text-xs"
                >
                  {DEMO_FAMILIES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="ml-2 flex items-center gap-1.5 text-xs text-text-muted">
                as student
                <select
                  value={selfId}
                  onChange={(e) => setSelfId(e.target.value)}
                  className="rounded-md border border-border-warm bg-white px-2 py-1 text-xs"
                >
                  {DEMO_STUDENTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        {/* Child switcher — live parents with several children, or demo */}
        {role === "parent" && visible.length > 1 && (
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 pt-4">
            <label className="flex items-center gap-1.5 text-xs text-text-muted">
              Child
              <select
                value={student?.id ?? ""}
                onChange={(e) => setChildId(e.target.value)}
                className="rounded-md border border-border-warm bg-white px-2 py-1 text-xs"
              >
                {visible.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {liveError && (
          <p className="mx-auto max-w-3xl px-4 pt-4 text-sm text-red-700">
            {liveError}
          </p>
        )}

        {/* F-2: files the team shared with this family */}
        {isLive && student && (student.sharedFiles?.length ?? 0) > 0 && (
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-4 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Shared files
            </span>
            {student.sharedFiles!.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border-warm bg-white px-3 py-1 text-xs font-medium text-mathitude-purple hover:bg-surface-paper"
              >
                {f.name}
              </a>
            ))}
          </div>
        )}

        {isLive && liveLoading ? (
          <p className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-text-muted">
            Loading notes…
          </p>
        ) : student ? (
          <ParentNotesView
            studentName={`${student.firstName} ${student.lastName}`}
            notes={notes}
            canReply={role === "parent"}
            onSaveReply={handleReply}
            canComment={role === "parent"}
            onAddComment={handleAddComment}
          />
        ) : (
          <p className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-text-muted">
            {isLive
              ? "No students found for your account."
              : "No student in scope."}
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
