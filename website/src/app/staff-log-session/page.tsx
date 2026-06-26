"use client";

import * as React from "react";
import { SessionNotesBoard } from "@/components/notes/session-notes-board";
import type { MentionShortcut } from "@/components/notes/rich-text";
import {
  type PortalRole,
  type SessionNote,
  type SessionNoteFields,
  DEMO_STUDENTS,
  DEMO_NOTES,
  DEMO_SHORTCUTS,
  ROLES,
  VISIBLE_FIELDS,
} from "@/lib/session-notes";

// /staff-log-session — Session Notes MVP (FEATURE_LIST Roles + Notes).
// Runs on SYNTHETIC data so it renders without Clerk/DynamoDB. The role
// switcher is a DEMO affordance to show the visibility model (R-1..R-7,
// N-8/N-9) in one place — in production the role comes from the signed-in
// session, not a dropdown. Swap DEMO_* for the API once Ari wires it:
//   notes      <- GET /api/students/:id/session-notes
//   onSaveNote -> POST/PUT /api/students/:id/session-notes
//   shortcuts  <- GET /api/note-resources ; onCreateShortcut -> POST it
const ALL_ROLES: PortalRole[] = [
  "super_admin",
  "office_staff",
  "tutor",
  "parent",
  "student",
];

// Mirror the server's noteForActor: hide staff-only fields from non-staff so
// the data itself (not just the columns) reflects what a family may see.
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
  const [selectedStudentId, setSelectedStudentId] = React.useState(
    DEMO_STUDENTS[0].id,
  );
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

  function handleCreateShortcut(shortcut: string, href: string): MentionShortcut {
    const created: MentionShortcut = {
      id: `sc_${Date.now().toString(36)}`,
      shortcut,
      label: shortcut,
      href,
    };
    setShortcuts((prev) => [...prev, created]);
    return created;
  }

  return (
    <main className="mx-auto max-w-[1152px] px-4 py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-medium tracking-tight text-text-primary">
          Session Notes
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Log a session and review history. MVP on synthetic data — no real
          student information.
        </p>
      </header>

      {/* DEMO role switcher — not part of production UI */}
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
        <span className="ml-auto text-[11px] text-text-muted">
          Production reads the role from the signed-in user, not this switch.
        </span>
      </div>

      <SessionNotesBoard
        role={role}
        students={DEMO_STUDENTS}
        selectedStudentId={selectedStudentId}
        onSelectStudent={setSelectedStudentId}
        notes={notes}
        shortcuts={shortcuts}
        onSaveNote={handleSave}
        onCreateShortcut={handleCreateShortcut}
      />
    </main>
  );
}
