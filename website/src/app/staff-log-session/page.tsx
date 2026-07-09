"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { AdminShell } from "@/components/admin/shell";
import { SessionNotesBoard } from "@/components/notes/session-notes-board";
import { ParentNotesView } from "@/components/notes/parent-notes-view";
import type { MentionShortcut } from "@/components/notes/rich-text";
import { useApi } from "@/hooks/use-api";
import {
  type PortalRole,
  type SessionNote,
  type SessionNoteFields,
  type DemoStudent,
  DEMO_STUDENTS,
  DEMO_NOTES,
  DEMO_SHORTCUTS,
  DEMO_TUTORS,
  DEMO_FAMILIES,
  ROLES,
  VISIBLE_FIELDS,
  ROLE_ALIASES,
  studentsVisibleTo,
} from "@/lib/session-notes";

// /staff-log-session — Session Notes (FEATURE_LIST Roles + Notes).
//
// LIVE mode (signed-in): role + students come from the real API; saves go to
// DynamoDB via /api/students/:id/session-notes.
// DEMO mode (not signed-in): synthetic data + role switcher, backed by
// localStorage so edits survive page refresh.

const ALL_ROLES: PortalRole[] = [
  "super_admin",
  "office_staff",
  "tutor",
  "parent",
  "student",
];

const NOTES_KEY = "mathitude_session_notes_v1";
const SHORTCUTS_KEY = "mathitude_note_shortcuts_v1";

// Normalize a raw DDB / API session-note record to the SessionNote shape.
function apiNoteToSessionNote(n: Record<string, unknown>): SessionNote {
  return {
    id: String(n.id || `${n.studentId}_${n.dateTime}`),
    studentId: String(n.studentId || ""),
    dateTime: String(n.dateTime || ""),
    date: String(n.date || String(n.dateTime || "").slice(0, 10)),
    durationMin: Number(n.durationMin ?? n.duration ?? 60),
    createdBy: String(n.createdBy || ""),
    updatedAt: String(n.updatedAt || n.dateTime || ""),
    sessionPlan: String(n.sessionPlan || ""),
    privateNotes: String(n.privateNotes || ""),
    sessionActivities: String(n.sessionActivities || ""),
    publicNotes: String(n.publicNotes || ""),
    noteGroupId: n.noteGroupId as string | undefined,
    groupLabel: n.groupLabel as string | undefined,
    familyReply: n.familyReply as string | undefined,
    comments: n.comments as SessionNote["comments"],
  };
}

// Mirror the server's noteForActor for demo mode.
function visibleNote(role: PortalRole, n: SessionNote): SessionNote {
  const allowed = VISIBLE_FIELDS[role];
  return {
    ...n,
    sessionPlan: allowed.includes("sessionPlan") ? n.sessionPlan : "",
    privateNotes: allowed.includes("privateNotes") ? n.privateNotes : "",
  };
}

export default function StaffLogSessionPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const fetchApi = useApi();

  // ── Live (authenticated) state ───────────────────────────────────────────
  const [liveRole, setLiveRole] = React.useState<PortalRole | null>(null);
  const [liveIsAdmin, setLiveIsAdmin] = React.useState(false);
  // Admin "preview as" — see exactly what each role sees, on real data, without
  // logging in as five separate accounts. null = the admin's own view.
  const [previewRole, setPreviewRole] = React.useState<PortalRole | null>(null);
  const [liveStudents, setLiveStudents] = React.useState<DemoStudent[]>([]);
  const [liveNotes, setLiveNotes] = React.useState<SessionNote[]>([]);
  // Family live mode: all children's notes from /api/me/notes (filtered per
  // selected child client-side — the staff per-student endpoint 403s families).
  const [liveFamilyNotes, setLiveFamilyNotes] = React.useState<SessionNote[]>([]);
  const [liveShortcuts, setLiveShortcuts] = React.useState<MentionShortcut[]>([]);
  const [notesLoading, setNotesLoading] = React.useState(false);
  const [liveSaving, setLiveSaving] = React.useState(false);
  const [liveError, setLiveError] = React.useState<string | null>(null);

  // ── Demo (unauthenticated) state ─────────────────────────────────────────
  const [demoRole, setDemoRole] = React.useState<PortalRole>("super_admin");
  const [demoTutorId, setDemoTutorId] = React.useState(DEMO_TUTORS[0].id);
  const [demoFamilyId, setDemoFamilyId] = React.useState(DEMO_FAMILIES[0].id);
  const [demoSelfId, setDemoSelfId] = React.useState(DEMO_STUDENTS[0].id);
  const [demoNotes, setDemoNotes] = React.useState<SessionNote[]>(() => {
    if (typeof window === "undefined") return DEMO_NOTES;
    try {
      const s = localStorage.getItem(NOTES_KEY);
      if (s) return JSON.parse(s) as SessionNote[];
    } catch {}
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(DEMO_NOTES)); } catch {}
    return DEMO_NOTES;
  });
  const [demoShortcuts, setDemoShortcuts] = React.useState<MentionShortcut[]>(() => {
    if (typeof window === "undefined") return DEMO_SHORTCUTS;
    try {
      const s = localStorage.getItem(SHORTCUTS_KEY);
      if (s) return JSON.parse(s) as MentionShortcut[];
    } catch {}
    try { localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(DEMO_SHORTCUTS)); } catch {}
    return DEMO_SHORTCUTS;
  });

  // ── Shared selected-student ───────────────────────────────────────────────
  const [selectedStudentId, setSelectedStudentId] = React.useState(
    DEMO_STUDENTS[0].id,
  );

  // Two single-session layouts to compare (7/4 feedback).
  const [noteLayout, setNoteLayout] = React.useState<
    "notes-column" | "notes-fullwidth"
  >("notes-column");

  // ── Fetch role + students when signed in ─────────────────────────────────
  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function loadLiveData() {
      try {
        // 1. Resolve role.
        const meRes = await fetchApi("/api/me/is-admin");
        const me = await meRes.json() as {
          role: string;
          isAdmin: boolean;
          isMaster: boolean;
        };
        let role = ROLE_ALIASES[me.role] ?? "parent";
        setLiveIsAdmin(!!me.isAdmin);

        // 2. Fetch students based on role.
        let students: DemoStudent[] = [];
        if (me.isAdmin) {
          const r = await fetchApi("/api/students");
          const j = await r.json() as { students?: Record<string, unknown>[] };
          students = (j.students || []) as unknown as DemoStudent[];
        } else if (role === "tutor") {
          const r = await fetchApi("/api/tutor/students");
          const j = await r.json() as { students?: Record<string, unknown>[] };
          students = (j.students || []) as unknown as DemoStudent[];
        } else {
          // Family member — children (or self) + all their notes in one call.
          const r = await fetchApi("/api/me/notes");
          const j = await r.json() as {
            role?: string;
            students?: Record<string, unknown>[];
            notes?: Record<string, unknown>[];
          };
          if (j.role === "student") role = "student";
          students = (j.students || []) as unknown as DemoStudent[];
          setLiveFamilyNotes((j.notes || []).map(apiNoteToSessionNote));
        }
        setLiveRole(role);
        setLiveStudents(students);
        if (students.length) setSelectedStudentId(students[0].id);

        // 3. Load shortcuts from API.
        const scRes = await fetchApi("/api/note-resources");
        if (scRes.ok) {
          const scJson = await scRes.json() as { resources?: MentionShortcut[] };
          setLiveShortcuts(scJson.resources || []);
        }
      } catch (err) {
        setLiveError(String(err));
      }
    }

    loadLiveData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  // ── Fetch notes when selected student changes (live mode) ─────────────────
  React.useEffect(() => {
    if (!isSignedIn || !selectedStudentId || liveStudents.length === 0) return;
    // Family roles already have every note from /api/me/notes.
    if (liveRole === "parent" || liveRole === "student") return;
    setNotesLoading(true);
    setLiveError(null);
    fetchApi(`/api/students/${selectedStudentId}/session-notes`)
      .then((r) => r.json())
      .then((j: { notes?: Record<string, unknown>[]; error?: string }) => {
        if (j.error) { setLiveError(j.error); return; }
        setLiveNotes((j.notes || []).map(apiNoteToSessionNote));
      })
      .catch((e) => setLiveError(String(e)))
      .finally(() => setNotesLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, selectedStudentId, liveStudents.length, liveRole]);

  // ── Save handler ──────────────────────────────────────────────────────────
  async function handleSave(
    fields: SessionNoteFields,
    meta: { dateTime: string; durationMin: number },
  ) {
    if (isSignedIn) {
      setLiveSaving(true);
      setLiveError(null);
      try {
        const res = await fetchApi(
          `/api/students/${selectedStudentId}/session-notes`,
          {
            method: "PUT",
            body: JSON.stringify({ ...fields, ...meta }),
          },
        );
        if (!res.ok) {
          const j = await res.json() as { error?: string };
          setLiveError(j.error || "Save failed");
          return;
        }
        // Refresh notes from server so updatedAt and any server-side fields sync.
        const refresh = await fetchApi(`/api/students/${selectedStudentId}/session-notes`);
        const rj = await refresh.json() as { notes?: Record<string, unknown>[] };
        setLiveNotes((rj.notes || []).map(apiNoteToSessionNote));
      } catch (e) {
        setLiveError(String(e));
      } finally {
        setLiveSaving(false);
      }
      return;
    }

    // Demo mode: update state + localStorage.
    setDemoNotes((prev) => {
      const idx = prev.findIndex(
        (n) => n.studentId === selectedStudentId && n.dateTime === meta.dateTime,
      );
      const next: SessionNote = {
        id: idx >= 0 ? prev[idx].id : `note_${Date.now().toString(36)}`,
        studentId: selectedStudentId,
        dateTime: meta.dateTime,
        date: meta.dateTime.slice(0, 10),
        durationMin: meta.durationMin,
        createdBy: "you",
        updatedAt: new Date().toISOString(),
        ...fields,
      };
      const updated =
        idx >= 0
          ? prev.map((n, i) => (i === idx ? { ...n, ...next } : n))
          : [next, ...prev];
      try { localStorage.setItem(NOTES_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  // Delete a past session note (super admin + tutors — server re-checks).
  async function handleDelete(note: SessionNote) {
    if (isSignedIn) {
      setLiveError(null);
      try {
        const res = await fetchApi(
          `/api/students/${note.studentId}/session-notes?dateTime=${encodeURIComponent(note.dateTime)}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const j = await res.json() as { error?: string };
          setLiveError(j.error || "Delete failed");
          return;
        }
        setLiveNotes((prev) => prev.filter((n) => n.id !== note.id));
      } catch (e) {
        setLiveError(String(e));
      }
      return;
    }
    setDemoNotes((prev) => {
      const updated = prev.filter((n) => n.id !== note.id);
      try { localStorage.setItem(NOTES_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  // N-6: append to a note's shared comment thread.
  async function handleAddComment(note: SessionNote, text: string) {
    if (isSignedIn) {
      setLiveError(null);
      try {
        const res = await fetchApi(
          `/api/students/${note.studentId}/session-notes/comments`,
          {
            method: "POST",
            body: JSON.stringify({ dateTime: note.dateTime, text }),
          },
        );
        const j = await res.json() as { comment?: NonNullable<SessionNote["comments"]>[number]; error?: string };
        if (!res.ok || !j.comment) {
          setLiveError(j.error || "Comment failed to post");
          return;
        }
        const append = (n: SessionNote): SessionNote =>
          n.id === note.id
            ? { ...n, comments: [...(n.comments || []), j.comment!] }
            : n;
        setLiveNotes((prev) => prev.map(append));
        setLiveFamilyNotes((prev) => prev.map(append));
      } catch (e) {
        setLiveError(String(e));
      }
      return;
    }
    setDemoNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === note.id
          ? {
              ...n,
              comments: [
                ...(n.comments || []),
                {
                  id: `c_${Date.now().toString(36)}`,
                  authorName: "You",
                  authorRole:
                    demoRole === "parent" || demoRole === "student"
                      ? ("parent" as const)
                      : demoRole === "tutor"
                        ? ("tutor" as const)
                        : ("staff" as const),
                  text,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : n,
      );
      try { localStorage.setItem(NOTES_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  // N-5: a parent's reply on a completed session.
  async function handleReply(noteId: string, text: string) {
    if (isSignedIn) {
      setLiveError(null);
      try {
        const note = liveFamilyNotes.find((n) => n.id === noteId);
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
        setLiveFamilyNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, familyReply: text } : n)),
        );
      } catch (e) {
        setLiveError(String(e));
      }
      return;
    }
    setDemoNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === noteId ? { ...n, familyReply: text } : n,
      );
      try { localStorage.setItem(NOTES_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  function handleCreateShortcut(shortcut: string, href: string): MentionShortcut {
    const list = isSignedIn ? liveShortcuts : demoShortcuts;
    const existing = list.find(
      (s) => s.shortcut.toLowerCase() === shortcut.toLowerCase() || s.href === href,
    );
    if (existing) return existing;
    const created: MentionShortcut = {
      id: `sc_${Date.now().toString(36)}`,
      shortcut,
      label: shortcut,
      href,
    };
    if (isSignedIn) {
      setLiveShortcuts((prev) => [...prev, created]);
    } else {
      setDemoShortcuts((prev) => {
        const updated = [...prev, created];
        try { localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
    return created;
  }

  // ── Derive display values ─────────────────────────────────────────────────
  const isLive = isLoaded && !!isSignedIn;

  // Demo scope (only used when not signed in).
  const demoVisibleStudents = React.useMemo(
    () => studentsVisibleTo(demoRole, { tutorId: demoTutorId, familyId: demoFamilyId, studentId: demoSelfId }),
    [demoRole, demoTutorId, demoFamilyId, demoSelfId],
  );
  React.useEffect(() => {
    if (isLive) return;
    if (demoVisibleStudents.length && !demoVisibleStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(demoVisibleStudents[0].id);
    }
  }, [isLive, demoVisibleStudents, selectedStudentId]);

  // Admins can preview any role; everyone else is locked to their own.
  const canPreview = isLive && liveIsAdmin;
  const role: PortalRole = isLive
    ? canPreview && previewRole
      ? previewRole
      : liveRole ?? "parent"
    : demoRole;
  // True when an admin is actively looking through another role's eyes — the
  // whole board goes read-only so they inspect visibility without mutating.
  const isPreview = canPreview && previewRole != null && previewRole !== liveRole;
  const students: DemoStudent[] = isLive ? liveStudents : demoVisibleStudents;
  const notes: SessionNote[] = React.useMemo(() => {
    if (isLive) {
      // Admins fetch the full note set for the selected student (staff endpoint);
      // gate the fields client-side to whatever role is being viewed/previewed.
      if (liveIsAdmin) {
        return [...liveNotes]
          .sort((a, b) => b.dateTime.localeCompare(a.dateTime))
          .map((n) => visibleNote(role, n));
      }
      if (liveRole === "parent" || liveRole === "student") {
        return liveFamilyNotes.filter((n) => n.studentId === selectedStudentId);
      }
      return liveNotes;
    }
    return demoNotes
      .filter((n) => n.studentId === selectedStudentId)
      .sort((a, b) => b.dateTime.localeCompare(a.dateTime))
      .map((n) => visibleNote(demoRole, n));
  }, [isLive, liveIsAdmin, role, liveRole, liveNotes, liveFamilyNotes, demoNotes, selectedStudentId, demoRole]);
  const shortcuts = isLive ? liveShortcuts : demoShortcuts;

  const selStudent = students.find((s) => s.id === selectedStudentId) ?? students[0];
  const isFamily = role === "parent" || role === "student";

  // ── Render ────────────────────────────────────────────────────────────────
  const content = (
    <>
          <header className="mb-5">
            <h1
              className="text-3xl text-[#7030A0]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Session Notes
            </h1>
            <p className="mt-1 text-sm text-[#8b8589]">
              {isLive
                ? isPreview
                  ? `Previewing as ${ROLES[role]?.label ?? role} · your account is ${ROLES[liveRole ?? "parent"]?.label ?? liveRole}`
                  : `Signed in · ${ROLES[role]?.label ?? role}`
                : "Log a session and review history. MVP on synthetic data — no real student information."}
            </p>
          </header>

          {/* Demo controls — only when not signed in */}
          {!isLive && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border-warm bg-surface-paper px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Demo · view as
              </span>
              {ALL_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDemoRole(r)}
                  className="rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors"
                  style={
                    demoRole === r
                      ? { backgroundColor: ROLES[r].accent, color: "#fff", borderColor: ROLES[r].accent }
                      : { color: ROLES[r].accent, borderColor: "var(--color-border-warm)" }
                  }
                >
                  {ROLES[r].label}
                </button>
              ))}

              {demoRole === "tutor" && (
                <label className="ml-2 flex items-center gap-1.5 text-xs text-text-muted">
                  as tutor
                  <select
                    value={demoTutorId}
                    onChange={(e) => setDemoTutorId(e.target.value)}
                    className="rounded-md border border-border-warm bg-white px-2 py-1 text-xs"
                  >
                    {DEMO_TUTORS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {demoRole === "parent" && (
                <label className="ml-2 flex items-center gap-1.5 text-xs text-text-muted">
                  in
                  <select
                    value={demoFamilyId}
                    onChange={(e) => setDemoFamilyId(e.target.value)}
                    className="rounded-md border border-border-warm bg-white px-2 py-1 text-xs"
                  >
                    {DEMO_FAMILIES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {demoRole === "student" && (
                <label className="ml-2 flex items-center gap-1.5 text-xs text-text-muted">
                  as student
                  <select
                    value={demoSelfId}
                    onChange={(e) => setDemoSelfId(e.target.value)}
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

              <span className="ml-auto text-[11px] text-text-muted">
                {demoRole === "tutor" && "Tutors see only their portfolio."}
                {demoRole === "parent" && "Parents see only their family's children."}
                {demoRole === "student" && "Students see only their own notes."}
                {(demoRole === "super_admin" || demoRole === "office_staff") &&
                  "Staff see every student."}
              </span>
            </div>
          )}

          {/* Admin "preview as" — see each role's view on real data, one account */}
          {canPreview && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border-warm bg-surface-paper px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Preview as
              </span>
              <button
                type="button"
                onClick={() => setPreviewRole(null)}
                className="rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors"
                style={
                  previewRole === null
                    ? { backgroundColor: "#7030A0", color: "#fff", borderColor: "#7030A0" }
                    : { color: "#7030A0", borderColor: "var(--color-border-warm)" }
                }
              >
                Your view
              </button>
              {ALL_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPreviewRole(r)}
                  className="rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors"
                  style={
                    previewRole === r
                      ? { backgroundColor: ROLES[r].accent, color: "#fff", borderColor: ROLES[r].accent }
                      : { color: ROLES[r].accent, borderColor: "var(--color-border-warm)" }
                  }
                >
                  {ROLES[r].label}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-text-muted">
                {isPreview
                  ? "Read-only preview — this is exactly what that role sees."
                  : "See what each role sees, on real data."}
              </span>
            </div>
          )}

          {/* Error banner */}
          {liveError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {liveError}
            </div>
          )}

          {/* Saving indicator */}
          {liveSaving && (
            <div className="mb-4 rounded-lg border border-border-warm bg-surface-paper px-4 py-3 text-sm text-text-muted">
              Saving…
            </div>
          )}

          {/* Loading state */}
          {isLive && notesLoading && (
            <div className="mb-4 rounded-lg border border-border-warm bg-surface-paper px-4 py-3 text-sm text-text-muted">
              Loading notes…
            </div>
          )}

          {students.length === 0 ? (
            <p className="rounded-lg border border-border-warm bg-surface-card px-4 py-8 text-center text-sm text-text-muted">
              {isLive ? "No students found for your account." : "No students in scope."}
            </p>
          ) : isFamily ? (
            <>
              {role === "parent" && students.length > 1 && (
                <div className="mb-3 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-text-muted">
                    Child
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="rounded-md border border-border-warm bg-white px-2 py-1 text-xs"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <ParentNotesView
                studentName={selStudent ? `${selStudent.firstName} ${selStudent.lastName}` : ""}
                notes={notes}
                canReply={!isPreview && role === "parent"}
                onSaveReply={handleReply}
                canComment={!isPreview && role === "parent"}
                onAddComment={(noteId, text) => {
                  const n = notes.find((x) => x.id === noteId);
                  if (n) return handleAddComment(n, text);
                }}
              />
            </>
          ) : (
            <>
              {/* Compare the two single-session layouts */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Note layout
                </span>
                {(
                  [
                    ["notes-column", "Notes column (V1)"],
                    ["notes-fullwidth", "Full-width notes (V2)"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNoteLayout(val)}
                    className="rounded-full px-3 py-1 text-xs font-medium ring-1 ring-border-warm transition-colors"
                    style={
                      noteLayout === val
                        ? { backgroundColor: "#7030A0", color: "#fff" }
                        : { color: "#7030A0" }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <SessionNotesBoard
                role={role}
                students={students}
                selectedStudentId={selectedStudentId}
                onSelectStudent={setSelectedStudentId}
                notes={notes}
                shortcuts={shortcuts}
                onSaveNote={handleSave}
                onCreateShortcut={isPreview ? undefined : handleCreateShortcut}
                onDeleteNote={isPreview ? undefined : handleDelete}
                onAddComment={isPreview ? undefined : handleAddComment}
                layout={noteLayout}
                readOnly={isPreview}
              />
            </>
          )}
    </>
  );

  // Admins keep the left admin sidebar (AdminShell) so navigating here from the
  // sidebar doesn't drop it. Tutors/parents/students get the marketing chrome.
  if (isLive && liveIsAdmin) {
    return <AdminShell>{content}</AdminShell>;
  }
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-8">{content}</div>
      </main>
      <Footer />
    </>
  );
}
