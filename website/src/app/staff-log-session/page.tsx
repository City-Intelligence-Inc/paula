"use client";

import * as React from "react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { SessionNotesBoard } from "@/components/notes/session-notes-board";
import { ParentNotesView } from "@/components/notes/parent-notes-view";
import type { MentionShortcut } from "@/components/notes/rich-text";
import {
  type PortalRole,
  type SessionNote,
  type SessionNoteFields,
  DEMO_STUDENTS,
  DEMO_NOTES,
  DEMO_SHORTCUTS,
  DEMO_TUTORS,
  DEMO_FAMILIES,
  ROLES,
  VISIBLE_FIELDS,
  studentsVisibleTo,
} from "@/lib/session-notes";

// /staff-log-session — Session Notes MVP (FEATURE_LIST Roles + Notes).
// SYNTHETIC data; the "Demo · view as" switcher shows every portal's visibility
// + scope in one place. In production both the role AND the scope (which
// students you may touch) come from the signed-in user, not these controls.
// Swap DEMO_* for the API once Ari wires it (see SESSION_NOTES_MVP.md).
const ALL_ROLES: PortalRole[] = [
  "super_admin",
  "office_staff",
  "tutor",
  "parent",
  "student",
];

// Mirror the server's noteForActor: hide staff-only fields from non-staff.
function visibleNote(role: PortalRole, n: SessionNote): SessionNote {
  const allowed = VISIBLE_FIELDS[role];
  return {
    ...n,
    sessionPlan: allowed.includes("sessionPlan") ? n.sessionPlan : "",
    privateNotes: allowed.includes("privateNotes") ? n.privateNotes : "",
  };
}

export default function StaffLogSessionPage() {
  const [role, setRole] = React.useState<PortalRole>("super_admin");
  // Demo "identity" behind the role — drives scope (R-2/R-5/R-6/R-7).
  const [tutorId, setTutorId] = React.useState(DEMO_TUTORS[0].id);
  const [familyId, setFamilyId] = React.useState(DEMO_FAMILIES[0].id);
  const [selfId, setSelfId] = React.useState(DEMO_STUDENTS[0].id);
  // Two single-session layouts to compare (7/4 feedback).
  const [noteLayout, setNoteLayout] = React.useState<
    "notes-column" | "notes-fullwidth"
  >("notes-column");

  const visibleStudents = React.useMemo(
    () => studentsVisibleTo(role, { tutorId, familyId, studentId: selfId }),
    [role, tutorId, familyId, selfId],
  );

  const [selectedStudentId, setSelectedStudentId] = React.useState(
    DEMO_STUDENTS[0].id,
  );
  // Keep the selected student inside the current scope (fail-closed).
  React.useEffect(() => {
    if (
      visibleStudents.length &&
      !visibleStudents.some((s) => s.id === selectedStudentId)
    ) {
      setSelectedStudentId(visibleStudents[0].id);
    }
  }, [visibleStudents, selectedStudentId]);

  const [allNotes, setAllNotes] = React.useState<SessionNote[]>(DEMO_NOTES);
  const [shortcuts, setShortcuts] =
    React.useState<MentionShortcut[]>(DEMO_SHORTCUTS);

  const notes = React.useMemo(
    () =>
      allNotes
        .filter((n) => n.studentId === selectedStudentId)
        .sort((a, b) => b.dateTime.localeCompare(a.dateTime))
        .map((n) => visibleNote(role, n)),
    [allNotes, selectedStudentId, role],
  );

  function handleSave(
    fields: SessionNoteFields,
    meta: { dateTime: string; durationMin: number },
  ) {
    setAllNotes((prev) => {
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
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...prev[idx], ...next };
        return copy;
      }
      return [next, ...prev];
    });
  }

  function handleReply(noteId: string, text: string) {
    setAllNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, familyReply: text } : n)),
    );
  }

  function handleCreateShortcut(shortcut: string, href: string): MentionShortcut {
    // Dedupe: reuse an existing shortcut with the same name (case-insensitive)
    // or the same URL, so the shared library doesn't fill with duplicates.
    const existing = shortcuts.find(
      (s) =>
        s.shortcut.toLowerCase() === shortcut.toLowerCase() || s.href === href,
    );
    if (existing) return existing;
    const created: MentionShortcut = {
      id: `sc_${Date.now().toString(36)}`,
      shortcut,
      label: shortcut,
      href,
    };
    setShortcuts((prev) => [...prev, created]);
    return created;
  }

  const selStudent =
    visibleStudents.find((s) => s.id === selectedStudentId) ??
    visibleStudents[0];
  const isFamily = role === "parent" || role === "student";

  return (
    // Branding kit: white neutral, purple titles (Original Surfer), taupe-grey
    // accents, black headings/body. Marketing nav/footer per Sara's mockup.
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-8">
      <header className="mb-5">
        <h1
          className="text-3xl text-[#7030A0]"
          style={{ fontFamily: "var(--font-original-surfer)" }}
        >
          Session Notes
        </h1>
        <p className="mt-1 text-sm text-[#8b8589]">
          Log a session and review history. MVP on synthetic data — no real
          student information.
        </p>
      </header>

      {/* DEMO controls — role + the identity that drives scope */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border-warm bg-surface-paper px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Demo · view as
        </span>
        {ALL_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className="rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors"
            style={
              role === r
                ? { backgroundColor: ROLES[r].accent, color: "#fff", borderColor: ROLES[r].accent }
                : { color: ROLES[r].accent, borderColor: "var(--color-border-warm)" }
            }
          >
            {ROLES[r].label}
          </button>
        ))}

        {/* Identity picker — which tutor / family / student you are */}
        {role === "tutor" && (
          <label className="ml-2 flex items-center gap-1.5 text-xs text-text-muted">
            as tutor
            <select
              value={tutorId}
              onChange={(e) => setTutorId(e.target.value)}
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
        {role === "parent" && (
          <label className="ml-2 flex items-center gap-1.5 text-xs text-text-muted">
            in
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
        )}
        {role === "student" && (
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

        <span className="ml-auto text-[11px] text-text-muted">
          {role === "tutor" && "Tutors see only their portfolio."}
          {role === "parent" && "Parents see only their family's children."}
          {role === "student" && "Students see only their own notes."}
          {(role === "super_admin" || role === "office_staff") &&
            "Staff see every student."}
        </span>
      </div>

      {visibleStudents.length === 0 ? (
        <p className="rounded-lg border border-border-warm bg-surface-card px-4 py-8 text-center text-sm text-text-muted">
          No students in scope.
        </p>
      ) : isFamily ? (
        <>
          {role === "parent" && visibleStudents.length > 1 && (
            <div className="mb-3 flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-text-muted">
                Child
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="rounded-md border border-border-warm bg-white px-2 py-1 text-xs"
                >
                  {visibleStudents.map((s) => (
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
            canReply={role === "parent"}
            onSaveReply={handleReply}
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
            students={visibleStudents}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            notes={notes}
            shortcuts={shortcuts}
            onSaveNote={handleSave}
            onCreateShortcut={handleCreateShortcut}
            layout={noteLayout}
          />
        </>
      )}
        </div>
      </main>
      <Footer />
    </>
  );
}
