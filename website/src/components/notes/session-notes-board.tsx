"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
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

function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Was this session edited after it happened? (last-updated later than its date)
function wasEdited(n: SessionNote): boolean {
  return !!n.updatedAt && n.updatedAt.slice(0, 10) > n.date;
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
  layout = "notes-column",
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
  // Single-session layout variant (7/4 feedback — two options to compare):
  //  "notes-column"    — Plan | Activities | (Private over Public) as a 3rd wide column
  //  "notes-fullwidth" — Plan | Activities on top (thin), Private then Public full-width below
  layout?: "notes-column" | "notes-fullwidth";
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
  const [pickerOpen, setPickerOpen] = React.useState(false);
  // Default to the full session history on load (7/4 feedback) — staff/tutor/
  // super-admin land on the whole chart, not a blank input. Authors drop into
  // the single-session editor from here via "Single session view".
  const [viewAll, setViewAll] = React.useState(true);

  // Keep the pointer valid when the student / scope changes.
  React.useEffect(() => {
    setViewIndex(0);
    setPickerOpen(false);
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
    const wasEditing = editingDateTime; // null = new session
    const dateTime = wasEditing || new Date(`${date}T${time}:00`).toISOString();
    onSaveNote(draft, { dateTime, durationMin });
    setSaving(false);
    resetDraft();
    // After editing a past session, stay on it (read-only) so the user can see
    // their edits instead of bouncing back to the empty current-session pane.
    // (Position is unchanged because editing keeps the same dateTime.)
    if (wasEditing) {
      const idx = notes.findIndex((n) => n.dateTime === wasEditing);
      if (idx >= 0) setViewIndex(editPane + idx);
    }
  }

  // Single-session layout (7/4 feedback): Session Plan and Session Activities
  // are their own thinner columns; Private + Public notes stack (private on top)
  // in one wider "Notes" column so there's more room to write. Date/time/duration
  // are compact controls up top, not columns.
  const leftFields = columns.filter(
    (c) => c === "sessionPlan" || c === "sessionActivities",
  );
  const notesStack = columns.filter(
    (c) => c === "privateNotes" || c === "publicNotes",
  ); // VISIBLE_FIELDS order → private first, then public
  // Past (read-only) sessions show every field side by side, with Private and
  // Public adjacent (7/4 feedback) — the stacking is only to give writing room.
  const readFields = [...leftFields, ...notesStack];
  const singleCols = [
    ...leftFields.map(() => "minmax(0, 1fr)"),
    ...(notesStack.length ? ["minmax(0, 1.7fr)"] : []),
  ].join(" ");

  // One note field: header + editor (edit pane) or read-only view. `minH` is the
  // Tailwind min-height class (shorter for the two stacked notes fields).
  function fieldColumn(c: keyof SessionNoteFields, minH: string) {
    return (
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
            editorMinHeight={minH}
            shortcuts={shortcuts}
            onCreateShortcut={onCreateShortcut}
          />
        ) : (
          <div className={cn(minH, "overflow-auto rounded-md border border-border-warm bg-white px-4 py-3")}>
            <RichTextView html={pastNote?.[c] ?? ""} />
          </div>
        )}
      </div>
    );
  }

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
        <span className="text-[15px] text-[#8b8589]">
          School <span className="text-black">{student?.school ?? "—"}</span>
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

      {viewAll ? (
        <CompareAll notes={notes} columns={columns} onExit={() => setViewAll(false)} />
      ) : (
      <>
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

        {/* Calendar: jump straight to any attended session */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-warm px-3 py-1.5 text-sm text-black hover:bg-surface-paper"
          >
            <CalendarDays className="size-4 text-mathitude-purple" /> Pick session
          </button>
          {pickerOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 max-h-72 w-72 overflow-auto rounded-md border border-border-warm bg-white py-1 shadow-lg">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8b8589]">
                Attended sessions
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => { setViewIndex(0); setPickerOpen(false); }}
                  className={cn(
                    "flex w-full items-center px-3 py-1.5 text-left text-sm text-mathitude-purple hover:bg-surface-paper",
                    onEditPane && "bg-surface-paper font-medium",
                  )}
                >
                  Current / upcoming session
                </button>
              )}
              {notes.map((n, i) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { setViewIndex(editPane + i); setPickerOpen(false); }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-black hover:bg-surface-paper",
                    viewIndex === editPane + i && "bg-surface-paper font-medium",
                  )}
                >
                  <span>{formatShort(n.dateTime)}</span>
                  {wasEdited(n) && <span className="text-[10px] text-[#8b8589]">edited</span>}
                </button>
              ))}
              {notes.length === 0 && (
                <p className="px-3 py-2 text-xs text-[#8b8589]">No attended sessions yet.</p>
              )}
            </div>
          )}
        </div>

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

        <div className="ml-auto flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => setViewIndex(0)}
              disabled={onEditPane}
              className="rounded-full bg-mathitude-purple px-3.5 py-1.5 text-sm font-medium text-white hover:bg-mathitude-purple/90 disabled:opacity-40"
            >
              Current session
            </button>
          )}
          {/* Toggle to the full history — sits where "Single session view" is in
              the compare view, so it reads as one toggle (7/4 feedback). */}
          <button
            type="button"
            onClick={() => setViewAll(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-warm px-3 py-1.5 text-sm text-black hover:bg-surface-paper"
          >
            <LayoutList className="size-4 text-mathitude-purple" /> View all sessions
          </button>
        </div>
      </div>

      {/* Compact session meta — date · time · duration up top in one tidy row,
          so the note fields below get the full page width. */}
      {onEditPane ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border-warm px-5 py-3 text-sm">
          <label className="flex items-center gap-1.5">
            <span className="text-[#8b8589]">Date</span>
            <input
              type="date"
              value={date}
              disabled={!!editingDateTime}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-border-warm px-2.5 py-1.5 text-sm disabled:opacity-60"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-[#8b8589]">Time</span>
            <input
              type="time"
              value={time}
              disabled={!!editingDateTime}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-md border border-border-warm px-2.5 py-1.5 text-sm disabled:opacity-60"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-[#8b8589]">Duration</span>
            <select
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="rounded-md border border-border-warm px-2.5 py-1.5 text-sm"
            >
              {[30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </label>
        </div>
      ) : pastNote ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border-warm px-5 py-3 text-sm">
          <span className="font-medium text-black">{formatShort(pastNote.dateTime)}</span>
          <span className="text-[#8b8589]">{formatTime(pastNote.dateTime)}</span>
          <span className="text-[#8b8589]">{pastNote.durationMin} min</span>
          {wasEdited(pastNote) && (
            <span className="text-xs text-[#8b8589]">
              Last updated {formatDateTime(pastNote.updatedAt)}
            </span>
          )}
          {pastNote.groupLabel && (
            <span className="rounded bg-[#8b8589]/10 px-2 py-0.5 text-xs text-[#8b8589]">
              {pastNote.groupLabel}
            </span>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => loadForEdit(pastNote)}
              className="ml-auto rounded-md border border-border-warm px-3 py-1.5 text-sm text-mathitude-purple hover:bg-surface-paper"
            >
              Edit this session
            </button>
          )}
        </div>
      ) : null}

      {/* The single session — two layout variants to compare (edit pane only);
          old sessions always render every field side by side. */}
      {slotCount === 0 ? (
        <p className="px-5 py-16 text-center text-[15px] text-[#8b8589]">No session notes yet.</p>
      ) : !onEditPane ? (
        /* Old session (read-only): Plan · Activities · Private · Public side by side. */
        <div
          className="grid items-start gap-4 px-5 pb-5 pt-4"
          style={{ gridTemplateColumns: `repeat(${readFields.length}, minmax(0, 1fr))` }}
        >
          {readFields.map((c) => fieldColumn(c, "min-h-[56vh]"))}
        </div>
      ) : layout === "notes-fullwidth" ? (
        /* Plan | Activities on top (thin & short); Private then Public full-width below. */
        <div className="px-5 pb-5 pt-4">
          {leftFields.length > 0 && (
            <div
              className="grid items-start gap-4"
              style={{ gridTemplateColumns: `repeat(${leftFields.length}, minmax(0, 1fr))` }}
            >
              {leftFields.map((c) => fieldColumn(c, "min-h-[24vh]"))}
            </div>
          )}
          {notesStack.length > 0 && (
            <div className="mt-4 flex flex-col gap-4">
              {notesStack.map((c) => fieldColumn(c, "min-h-[30vh]"))}
            </div>
          )}
        </div>
      ) : (
        /* Plan | Activities as thin columns; Private over Public in a wider 3rd column. */
        <div className="grid items-start gap-4 px-5 pb-5 pt-4" style={{ gridTemplateColumns: singleCols }}>
          {leftFields.map((c) => fieldColumn(c, "min-h-[56vh]"))}
          {notesStack.length > 0 && (
            <div className="flex min-w-0 flex-col gap-4">
              {notesStack.map((c) => fieldColumn(c, "min-h-[26vh]"))}
            </div>
          )}
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

      </>
      )}
    </div>
  );
}

// Compare-all history view (Sara's original): every session stacked as rows,
// fields as columns, read-only, scrollable — for comparing across sessions.
function CompareAll({
  notes,
  columns,
  onExit,
}: {
  notes: SessionNote[];
  columns: (keyof SessionNoteFields)[];
  onExit: () => void;
}) {
  const grid = `120px repeat(${columns.length}, minmax(0, 1fr))`;
  return (
    <div>
      <div className="flex items-center justify-between border-b border-border-warm px-5 py-2.5">
        <span className="text-[15px] font-medium text-black">All sessions — full history</span>
        <button
          type="button"
          onClick={onExit}
          className="rounded-md border border-border-warm px-3 py-1.5 text-sm text-black hover:bg-surface-paper"
        >
          Single session view
        </button>
      </div>
      {notes.length === 0 ? (
        <p className="px-5 py-12 text-center text-[15px] text-[#8b8589]">No session notes yet.</p>
      ) : (
        <div className="max-h-[82vh] overflow-auto">
          <div
            className="sticky top-0 z-10 grid border-b border-border-warm bg-white"
            style={{ gridTemplateColumns: grid }}
          >
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#8b8589]">
              Session Date
            </div>
            {columns.map((c) => (
              <div key={c} className="border-l border-border-warm px-3 py-2 text-sm font-semibold text-black">
                {NOTE_FIELDS[c].label}
              </div>
            ))}
          </div>
          {notes.map((n) => (
            <div key={n.id} className="grid border-b border-border-warm" style={{ gridTemplateColumns: grid }}>
              <div className="px-3 py-3">
                <div className="text-sm font-medium text-black">{formatShort(n.dateTime)}</div>
                <div className="text-[11px] text-[#8b8589]">{n.durationMin} min</div>
                {wasEdited(n) && (
                  <div className="text-[10px] text-[#8b8589]">edited {formatShort(n.updatedAt)}</div>
                )}
                {n.groupLabel && (
                  <div className="mt-1 inline-block rounded bg-[#8b8589]/10 px-1.5 py-0.5 text-[10px] text-[#8b8589]">
                    {n.groupLabel}
                  </div>
                )}
              </div>
              {columns.map((c) => (
                <div key={c} className="border-l border-border-warm px-3 py-3">
                  <RichTextView html={n[c] ?? ""} className="text-sm leading-6" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
