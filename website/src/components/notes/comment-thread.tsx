"use client";

import * as React from "react";
import type { NoteCommentEntry } from "@/lib/session-notes";

// N-6: the shared comment thread on a session note. One thread per session,
// visible to staff, tutors, and the family alike (staff-only discussion
// belongs in Private Notes). Compact by design — it sits under a note row.

const ROLE_ACCENT: Record<NoteCommentEntry["authorRole"], string> = {
  staff: "#7030A0",
  tutor: "#0e7490",
  parent: "#b45309",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CommentThread({
  comments = [],
  canComment,
  onAddComment,
}: {
  comments?: NoteCommentEntry[];
  canComment: boolean;
  onAddComment?: (text: string) => Promise<void> | void;
}) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(comments.length > 0);

  async function submit() {
    const t = text.trim();
    if (!t || !onAddComment) return;
    setBusy(true);
    try {
      await onAddComment(t);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  if (comments.length === 0 && !canComment) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-medium text-[#8b8589] hover:text-mathitude-purple"
      >
        Comments{comments.length ? ` (${comments.length})` : ""}
        <span className="ml-1">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="mt-1.5 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="rounded-md bg-surface-paper px-3 py-2">
              <p className="text-xs">
                <span
                  className="font-semibold"
                  style={{ color: ROLE_ACCENT[c.authorRole] || "#000" }}
                >
                  {c.authorName}
                </span>
                <span className="ml-2 text-[#8b8589]">{formatWhen(c.createdAt)}</span>
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm leading-5 text-black">
                {c.text}
              </p>
            </div>
          ))}
          {canComment && (
            <div className="flex items-start gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment…"
                rows={1}
                className="min-h-[36px] flex-1 resize-y rounded-md border border-border-warm bg-white px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={submit}
                disabled={busy || !text.trim()}
                className="rounded-full bg-mathitude-purple px-3 py-1.5 text-xs font-medium text-white hover:bg-mathitude-purple/90 disabled:opacity-40"
              >
                {busy ? "Posting…" : "Post"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
