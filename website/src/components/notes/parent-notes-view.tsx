"use client";

import * as React from "react";
import { RichTextView } from "./rich-text";
import { CommentThread } from "./comment-thread";
import type { SessionNote } from "@/lib/session-notes";

// Parent/student notes view (N-5) — compact spreadsheet matching the staff side
// (7/4 feedback): sessions stacked as rows, family-facing fields as columns,
// sticky header, scrollable, maximizing space for the notes. Only the two
// family-facing fields (Activities, Notes) are shown. A parents-only "Family
// reply" column lets a parent respond to a completed session; it is never
// editable by students and never touches the staff notes columns.

function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// One session's family-reply cell: an editable textarea for parents (saved on
// blur or via the button), read-only text for students.
function FamilyReply({
  note,
  canReply,
  onSaveReply,
}: {
  note: SessionNote;
  canReply: boolean;
  onSaveReply?: (noteId: string, text: string) => void;
}) {
  const [text, setText] = React.useState(note.familyReply ?? "");
  React.useEffect(() => {
    setText(note.familyReply ?? "");
  }, [note.familyReply, note.id]);

  if (!canReply) {
    return note.familyReply ? (
      <p className="whitespace-pre-wrap text-sm leading-6 text-black">
        {note.familyReply}
      </p>
    ) : (
      <span className="text-xs text-[#8b8589]">—</span>
    );
  }

  const dirty = text !== (note.familyReply ?? "");
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => dirty && onSaveReply?.(note.id, text)}
        placeholder="Add a note back to your tutor…"
        className="min-h-[84px] w-full resize-y rounded-md border border-border-warm bg-white px-3 py-2 text-sm"
      />
      {dirty && (
        <button
          type="button"
          onClick={() => onSaveReply?.(note.id, text)}
          className="mt-1 rounded-full bg-mathitude-purple px-3 py-1 text-xs font-medium text-white hover:bg-mathitude-purple/90"
        >
          Save reply
        </button>
      )}
    </div>
  );
}

export function ParentNotesView({
  studentName,
  notes,
  canReply = false,
  onSaveReply,
  canComment = false,
  onAddComment,
}: {
  studentName: string;
  notes: SessionNote[]; // most-recent-first, already limited to shared fields
  canReply?: boolean;
  onSaveReply?: (noteId: string, text: string) => void;
  canComment?: boolean;
  onAddComment?: (noteId: string, text: string) => Promise<void> | void;
}) {
  const grid = "120px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)";
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8">
      <h1
        className="mb-5 text-center text-4xl text-mathitude-purple"
        style={{ fontFamily: "var(--font-original-surfer)" }}
      >
        {studentName}
      </h1>

      {notes.length === 0 ? (
        <p className="mt-10 text-center text-sm text-text-muted">
          No session notes yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-warm bg-white">
          <div className="max-h-[78vh] overflow-auto">
            {/* Sticky header — Session Date leads, matching the staff view */}
            <div
              className="sticky top-0 z-10 grid border-b border-border-warm bg-white"
              style={{ gridTemplateColumns: grid }}
            >
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#8b8589]">
                Session Date
              </div>
              <div className="border-l border-border-warm px-3 py-2 text-sm font-semibold text-black">
                Activities
              </div>
              <div className="border-l border-border-warm px-3 py-2 text-sm font-semibold text-black">
                Notes
              </div>
              <div className="border-l border-border-warm px-3 py-2 text-sm font-semibold text-black">
                Family reply
              </div>
            </div>
            {notes.map((n) => (
              <div
                key={n.id}
                className="grid border-b border-border-warm"
                style={{ gridTemplateColumns: grid }}
              >
                <div className="px-3 py-3">
                  <div className="text-sm font-medium text-black">
                    {formatShort(n.dateTime)}
                  </div>
                  {n.groupLabel && (
                    <div className="mt-1 inline-block rounded bg-[#8b8589]/10 px-1.5 py-0.5 text-[10px] text-[#8b8589]">
                      {n.groupLabel}
                    </div>
                  )}
                </div>
                <div className="border-l border-border-warm px-3 py-3">
                  <RichTextView
                    html={n.sessionActivities ?? ""}
                    className="text-sm leading-6"
                  />
                </div>
                <div className="border-l border-border-warm px-3 py-3">
                  <RichTextView
                    html={n.publicNotes ?? ""}
                    className="text-sm leading-6"
                  />
                </div>
                <div className="border-l border-border-warm px-3 py-3">
                  <FamilyReply
                    note={n}
                    canReply={canReply}
                    onSaveReply={onSaveReply}
                  />
                  <CommentThread
                    comments={n.comments}
                    canComment={canComment}
                    attachStudentId={n.studentId}
                    onAddComment={
                      onAddComment ? (text) => onAddComment(n.id, text) : undefined
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
