"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor, RichTextView, type MentionShortcut } from "./rich-text";
import {
  type PortalRole,
  type SessionNote,
  type SessionNoteFields,
  type DemoStudent,
  NOTE_FIELDS,
  ROLES,
  columnsFor,
  CAN_EDIT_NOTES,
  CAN_SEE_BILLING,
  emptyNoteFields,
  HISTORY_EXPANDED,
} from "@/lib/session-notes";

// The Session Notes board — FEATURE_LIST N-1..N-9.
// One component drives every portal; the role decides which columns show
// (columnsFor) and whether the entry row is editable (CAN_EDIT_NOTES). The
// staff "In-session view" switch hides Private Notes (N-3); history stacks
// beneath each field, most-recent-first, with the recent 5 expanded (N-2/N-6).

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SessionNotesBoard({
  role,
  students,
  selectedStudentId,
  onSelectStudent,
  notes,
  shortcuts = [],
  onSaveNote,
  onCreateShortcut,
}: {
  role: PortalRole;
  students: DemoStudent[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  notes: SessionNote[]; // most-recent-first, already role-filtered upstream
  shortcuts?: MentionShortcut[];
  onSaveNote: (
    fields: SessionNoteFields,
    meta: { dateTime: string; durationMin: number },
  ) => void;
  onCreateShortcut?: (shortcut: string, href: string) => MentionShortcut | void;
}) {
  const canEdit = CAN_EDIT_NOTES[role];
  const [inSessionView, setInSessionView] = React.useState(false);
  const columns = columnsFor(role, inSessionView);

  const student = students.find((s) => s.id === selectedStudentId);

  // Draft entry row (new session, or an existing session loaded for editing).
  const [draft, setDraft] = React.useState<SessionNoteFields>(emptyNoteFields());
  const [editingDateTime, setEditingDateTime] = React.useState<string | null>(null);
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = React.useState("12:00");
  const [durationMin, setDurationMin] = React.useState(60);
  const [saving, setSaving] = React.useState(false);

  const recent = notes.slice(0, HISTORY_EXPANDED);
  const older = notes.slice(HISTORY_EXPANDED);
  const [showOlder, setShowOlder] = React.useState(false);

  function resetDraft() {
    setDraft(emptyNoteFields());
    setEditingDateTime(null);
    setDate(new Date().toISOString().slice(0, 10));
    setTime("12:00");
    setDurationMin(60);
  }

  function loadForEdit(n: SessionNote) {
    setDraft({
      sessionPlan: n.sessionPlan,
      privateNotes: n.privateNotes,
      sessionActivities: n.sessionActivities,
      publicNotes: n.publicNotes,
    });
    setEditingDateTime(n.dateTime);
    setDate(n.date);
    setTime(n.dateTime.slice(11, 16));
    setDurationMin(n.durationMin);
  }

  function submit() {
    setSaving(true);
    const dateTime = editingDateTime || new Date(`${date}T${time}:00`).toISOString();
    onSaveNote(draft, { dateTime, durationMin });
    setSaving(false);
    resetDraft();
  }

  // Grid template: a slim date/meta column + one column per visible field.
  const gridCols = `140px repeat(${columns.length}, minmax(0, 1fr))`;

  return (
    <div className="rounded-lg border border-border-warm bg-surface-card">
      {/* Top bar — mirrors the STAFF_LOG_NOTES mockup header */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border-warm bg-surface-paper px-4 py-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">Student</span>
          <select
            value={selectedStudentId}
            onChange={(e) => onSelectStudent(e.target.value)}
            className="rounded-md border border-border-warm bg-white px-2 py-1 text-sm"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </label>
        <span className="text-sm text-text-muted">
          Grade <span className="text-text-primary">{student?.grade ?? "—"}</span>
        </span>
        {CAN_SEE_BILLING[role] && (
          <span className="text-sm text-text-muted">
            Rate{" "}
            <span className="text-text-primary">${student?.rate ?? "—"}/hr</span>
          </span>
        )}
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1"
          style={{ color: ROLES[role].accent, borderColor: ROLES[role].accent }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: ROLES[role].accent }}
          />
          {ROLES[role].label}
        </span>
        {canEdit && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">In-session view</span>
            <Switch
              checked={inSessionView}
              onCheckedChange={setInSessionView}
              aria-label="Hide private notes for in-session view"
            />
          </label>
        )}
      </div>

      {!canEdit && (
        <p className="border-b border-border-warm bg-white px-4 py-2 text-xs text-text-muted">
          Read-only — you can view{" "}
          {columns.map((c) => NOTE_FIELDS[c].label).join(" and ")}.
        </p>
      )}

      {/* Chart grid */}
      <div className="max-h-[60vh] overflow-auto">
        {/* Header row (sticky) */}
        <div
          className="sticky top-0 z-10 grid border-b border-border-warm bg-white"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Session
          </div>
          {columns.map((c) => (
            <div
              key={c}
              className="border-l border-border-warm px-3 py-2"
            >
              <div className="text-sm font-semibold text-text-primary">
                {NOTE_FIELDS[c].label}
              </div>
              <div className="text-[10px] text-text-muted">
                {NOTE_FIELDS[c].audience}
              </div>
            </div>
          ))}
        </div>

        {/* Entry row (editable roles only) */}
        {canEdit && (
          <div
            className="grid border-b-2 border-mathitude-purple/30 bg-mathitude-purple/[0.03]"
            style={{ gridTemplateColumns: gridCols }}
          >
            <div className="space-y-2 px-3 py-3">
              <p className="text-xs font-semibold text-mathitude-purple">
                {editingDateTime ? "Editing session" : "Logging new session"}
              </p>
              <input
                type="date"
                value={date}
                disabled={!!editingDateTime}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded border border-border-warm px-2 py-1 text-xs disabled:opacity-60"
              />
              <input
                type="time"
                value={time}
                disabled={!!editingDateTime}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded border border-border-warm px-2 py-1 text-xs disabled:opacity-60"
              />
              <select
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full rounded border border-border-warm px-2 py-1 text-xs"
              >
                {[30, 45, 60, 90].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
              <div className="flex flex-col gap-1 pt-1">
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                  className="rounded-full bg-mathitude-purple px-3 py-1.5 text-xs font-medium text-white hover:bg-mathitude-purple/90 disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingDateTime ? "Update session" : "Submit session"}
                </button>
                <button
                  type="button"
                  onClick={resetDraft}
                  className="rounded-full px-3 py-1 text-xs text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
            {columns.map((c) => (
              <div key={c} className="border-l border-border-warm p-2">
                <RichTextEditor
                  value={draft[c]}
                  onChange={(html) => setDraft((d) => ({ ...d, [c]: html }))}
                  placeholder={NOTE_FIELDS[c].placeholder}
                  shortcuts={shortcuts}
                  onCreateShortcut={onCreateShortcut}
                />
              </div>
            ))}
          </div>
        )}

        {/* History rows */}
        {notes.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-text-muted">
            No session notes yet.
          </p>
        )}
        {recent.map((n) => (
          <HistoryRow
            key={n.id}
            note={n}
            columns={columns}
            gridCols={gridCols}
            canEdit={canEdit}
            onEdit={() => loadForEdit(n)}
          />
        ))}
        {older.length > 0 && !showOlder && (
          <button
            type="button"
            onClick={() => setShowOlder(true)}
            className="w-full border-t border-border-warm py-2 text-center text-xs text-mathitude-purple hover:bg-surface-paper"
          >
            Show {older.length} older session{older.length > 1 ? "s" : ""}
          </button>
        )}
        {showOlder &&
          older.map((n) => (
            <HistoryRow
              key={n.id}
              note={n}
              columns={columns}
              gridCols={gridCols}
              canEdit={canEdit}
              onEdit={() => loadForEdit(n)}
            />
          ))}
      </div>
    </div>
  );
}

function HistoryRow({
  note,
  columns,
  gridCols,
  canEdit,
  onEdit,
}: {
  note: SessionNote;
  columns: (keyof SessionNoteFields)[];
  gridCols: string;
  canEdit: boolean;
  onEdit: () => void;
}) {
  return (
    <div
      className="grid border-b border-border-warm last:border-b-0 hover:bg-surface-paper/60"
      style={{ gridTemplateColumns: gridCols }}
    >
      <div className="px-3 py-3">
        <div className="text-sm font-medium text-text-primary">
          {formatDate(note.dateTime)}
        </div>
        <div className="text-[11px] text-text-muted">{note.durationMin} min</div>
        {note.groupLabel && (
          <div className="mt-1 inline-block rounded bg-mathitude-teal/10 px-1.5 py-0.5 text-[10px] text-[#1e9390]">
            {note.groupLabel}
          </div>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="mt-2 block text-[11px] text-mathitude-purple hover:underline"
          >
            Edit
          </button>
        )}
      </div>
      {columns.map((c) => (
        <div key={c} className="border-l border-border-warm px-3 py-3">
          <RichTextView html={note[c] ?? ""} />
        </div>
      ))}
    </div>
  );
}
