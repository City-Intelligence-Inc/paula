"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  VISIBLE_FIELDS,
  emptyNoteFields,
} from "@/lib/session-notes";

// Session Notes board — one session per screen (current/upcoming or a previous
// one), with prev/next navigation. Four large fields per session: Session Plan,
// Private Notes, Session Activities, Public Notes. The "Private" toggle hides
// the Private Notes column for in-session viewing (spec N-3).

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
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
  const hasPrivate = VISIBLE_FIELDS[role].includes("privateNotes");
  const [showPrivate, setShowPrivate] = React.useState(true);
  const columns = columnsFor(role, hasPrivate && !showPrivate);

  const student = students.find((s) => s.id === selectedStudentId);

  // Edit pane state (the current/upcoming session, or a past one loaded to edit)
  const [draft, setDraft] = React.useState<SessionNoteFields>(emptyNoteFields());
  const [editingDateTime, setEditingDateTime] = React.useState<string | null>(null);
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = React.useState("12:00");
  const [durationMin, setDurationMin] = React.useState(60);
  const [saving, setSaving] = React.useState(false);

  // Pager: slot 0 = the edit pane (only when the role can author); the rest are
  // past sessions, most recent first.
  const editPane = canEdit ? 1 : 0;
  const slotCount = editPane + notes.length;
  const [viewIndex, setViewIndex] = React.useState(0);

  // Keep the pointer valid when the student / scope changes.
  React.useEffect(() => {
    setViewIndex(0);
  }, [selectedStudentId]);

  const onEditPane = canEdit && viewIndex === 0;
  const pastNote = onEditPane ? null : notes[viewIndex - editPane];

  function resetDraft() {
    setDraft(emptyNoteFields());
    setEditingDateTime(null);
    setDate(new Date().toISOString().slice(0, 10));
    setTime("12:00");
    setDurationMin(60);
  }

  function loadForEdit(n: SessionNote) {
    setDraft({
      sessionPlan: n.sessionPlan ?? "",
      privateNotes: n.privateNotes ?? "",
      sessionActivities: n.sessionActivities ?? "",
      publicNotes: n.publicNotes ?? "",
    });
    setEditingDateTime(n.dateTime);
    setDate(n.date);
    setTime(n.dateTime.slice(11, 16));
    setDurationMin(n.durationMin);
    setViewIndex(0); // jump to the edit pane
  }

  function submit() {
    setSaving(true);
    const dateTime = editingDateTime || new Date(`${date}T${time}:00`).toISOString();
    onSaveNote(draft, { dateTime, durationMin });
    setSaving(false);
    resetDraft();
  }

  const gridCols = `repeat(${columns.length}, minmax(0, 1fr))`;

  return (
    <div className="rounded-lg border border-border-warm bg-white">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border-warm bg-white px-5 py-3.5">
        <label className="flex items-center gap-2 text-[15px]">
          <span className="text-[#8b8589]">Student</span>
          <select
            value={selectedStudentId}
            onChange={(e) => onSelectStudent(e.target.value)}
            className="rounded-md border border-border-warm bg-white px-2.5 py-1.5 text-[15px]"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </label>
        <span className="text-[15px] text-[#8b8589]">
          Grade <span className="text-black">{student?.grade ?? "—"}</span>
        </span>
        {CAN_SEE_BILLING[role] && (
          <span className="text-[15px] text-[#8b8589]">
            Rate <span className="text-black">${student?.rate ?? "—"}/hr</span>
          </span>
        )}
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium ring-1"
          style={{ color: ROLES[role].accent, borderColor: ROLES[role].accent }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ROLES[role].accent }} />
          {ROLES[role].label}
        </span>
        {canEdit && hasPrivate && (
          <label className="flex items-center gap-2 text-[15px]">
            <Switch
              checked={showPrivate}
              onCheckedChange={setShowPrivate}
              aria-label="Show private notes column"
            />
            <span className="text-black">Private</span>
          </label>
        )}
      </div>

      {/* Pager bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border-warm px-5 py-2.5">
        <button
          type="button"
          onClick={() => setViewIndex((i) => Math.min(slotCount - 1, i + 1))}
          disabled={viewIndex >= slotCount - 1}
          className="inline-flex items-center gap-1 rounded-md border border-border-warm px-3 py-1.5 text-sm text-black hover:bg-surface-paper disabled:opacity-40"
        >
          <ChevronLeft className="size-4" /> Previous session
        </button>
        <button
          type="button"
          onClick={() => setViewIndex((i) => Math.max(0, i - 1))}
          disabled={viewIndex <= 0}
          className="inline-flex items-center gap-1 rounded-md border border-border-warm px-3 py-1.5 text-sm text-black hover:bg-surface-paper disabled:opacity-40"
        >
          Next session <ChevronRight className="size-4" />
        </button>

        <span className="text-[15px] text-black">
          {onEditPane ? (
            <span className="font-medium text-mathitude-purple">
              {editingDateTime ? "Editing session" : "Current / upcoming session"}
            </span>
          ) : (
            <>
              <span className="font-medium">{pastNote && formatDate(pastNote.dateTime)}</span>
              <span className="text-[#8b8589]">
                {" "}
                · session {viewIndex - editPane + 1} of {notes.length}
              </span>
            </>
          )}
        </span>

        {canEdit && (
          <button
            type="button"
            onClick={() => setViewIndex(0)}
            disabled={onEditPane}
            className="ml-auto rounded-full bg-mathitude-purple px-3.5 py-1.5 text-sm font-medium text-white hover:bg-mathitude-purple/90 disabled:opacity-40"
          >
            Current session
          </button>
        )}
      </div>

      {/* Session meta */}
      <div className="flex flex-wrap items-center gap-4 px-5 py-3 text-sm">
        {onEditPane ? (
          <>
            <input
              type="date"
              value={date}
              disabled={!!editingDateTime}
              onChange={(e) => setDate(e.target.value)}
              className="rounded border border-border-warm px-2.5 py-1.5 text-sm disabled:opacity-60"
            />
            <input
              type="time"
              value={time}
              disabled={!!editingDateTime}
              onChange={(e) => setTime(e.target.value)}
              className="rounded border border-border-warm px-2.5 py-1.5 text-sm disabled:opacity-60"
            />
            <select
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="rounded border border-border-warm px-2.5 py-1.5 text-sm"
            >
              {[30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </>
        ) : pastNote ? (
          <>
            <span className="text-black">{pastNote.durationMin} min</span>
            {pastNote.groupLabel && (
              <span className="rounded bg-[#8b8589]/10 px-2 py-0.5 text-xs text-[#8b8589]">
                {pastNote.groupLabel}
              </span>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => loadForEdit(pastNote)}
                className="rounded-md border border-border-warm px-3 py-1.5 text-sm text-mathitude-purple hover:bg-surface-paper"
              >
                Edit this session
              </button>
            )}
          </>
        ) : null}
      </div>

      {/* The single session — large field boxes */}
      {slotCount === 0 ? (
        <p className="px-5 py-16 text-center text-[15px] text-[#8b8589]">No session notes yet.</p>
      ) : (
        <div className="grid gap-4 px-5 pb-5" style={{ gridTemplateColumns: gridCols }}>
          {columns.map((c) => (
            <div key={c} className="flex min-w-0 flex-col">
              <div className="mb-1.5">
                <h3 className="text-base font-semibold text-black">{NOTE_FIELDS[c].label}</h3>
                <p className="text-xs text-[#8b8589]">{NOTE_FIELDS[c].audience}</p>
              </div>
              {onEditPane ? (
                <RichTextEditor
                  value={draft[c]}
                  onChange={(html) => setDraft((d) => ({ ...d, [c]: html }))}
                  placeholder={NOTE_FIELDS[c].placeholder}
                  shortcuts={shortcuts}
                  onCreateShortcut={onCreateShortcut}
                />
              ) : (
                <div className="min-h-[42vh] overflow-auto rounded-md border border-border-warm bg-white px-4 py-3">
                  <RichTextView html={pastNote?.[c] ?? ""} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save bar (edit pane) */}
      {onEditPane && (
        <div className="flex items-center gap-3 border-t border-border-warm px-5 py-3">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-full bg-mathitude-purple px-5 py-2 text-sm font-medium text-white hover:bg-mathitude-purple/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : editingDateTime ? "Update session" : "Submit session"}
          </button>
          <button
            type="button"
            onClick={resetDraft}
            className="rounded-full px-4 py-2 text-sm text-[#8b8589] hover:text-black"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
