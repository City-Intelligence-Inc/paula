"use client";

import * as React from "react";
import { Paperclip } from "lucide-react";
import { useApi } from "@/hooks/use-api";
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

// Render comment text with bare URLs turned into links, so uploaded-file
// attachments (which arrive as a URL line) are clickable.
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+|\/api\/files\/object\?[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^(https?:\/\/|\/api\/files\/object\?)/.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="text-mathitude-purple underline underline-offset-2 break-all"
          >
            {part.startsWith("/api/files/object") ? "attached file" : part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

export function CommentThread({
  comments = [],
  canComment,
  onAddComment,
  attachStudentId,
}: {
  comments?: NoteCommentEntry[];
  canComment: boolean;
  onAddComment?: (text: string) => Promise<void> | void;
  // N-6: when set, commenters can attach a file — uploaded to S3 via
  // presign, registered as a family-audience shared file, and linked in
  // the comment text.
  attachStudentId?: string;
}) {
  const fetchApi = useApi();
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(comments.length > 0);
  const [attachMsg, setAttachMsg] = React.useState<string | null>(null);

  async function attach(file: File) {
    if (!attachStudentId) return;
    setBusy(true);
    setAttachMsg(null);
    try {
      const pre = await fetchApi("/api/files/presign", {
        method: "POST",
        body: JSON.stringify({
          studentId: attachStudentId,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });
      const preJ = await pre.json();
      if (!pre.ok) throw new Error(preJ.error || "Uploads not available");
      const put = await fetch(preJ.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": preJ.contentType },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      const reg = await fetchApi(`/api/students/${attachStudentId}/files`, {
        method: "POST",
        body: JSON.stringify({ name: file.name, url: preJ.s3Url, audience: "family" }),
      });
      const regJ = await reg.json();
      if (!reg.ok) throw new Error(regJ.error || "Could not register file");
      const fileUrl = `/api/files/object?sid=${encodeURIComponent(attachStudentId)}&fid=${encodeURIComponent(regJ.file.id)}`;
      setText((t) => `${t}${t && !t.endsWith("\n") ? "\n" : ""}${file.name}: ${fileUrl}`);
    } catch (err) {
      setAttachMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

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
                <Linkified text={c.text} />
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
              {attachStudentId && (
                <label
                  className="mt-1 cursor-pointer text-[#8b8589] hover:text-mathitude-purple"
                  title="Attach a file"
                >
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) attach(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
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
          {attachMsg && <p className="text-xs text-red-600">{attachMsg}</p>}
        </div>
      )}
    </div>
  );
}
