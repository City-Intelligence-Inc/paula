"use client";

import * as React from "react";
import { Bold as BoldIcon, List as ListIcon, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Dependency-free rich text for session notes (spec N-4 input / N-7 display).
// We intentionally avoid pulling an editor library: org policy requires vetting
// every npm package for malware first, and contentEditable covers the MVP need
// (bold, bullets, links). When this grows (tables, @-mentions / N-5 resource
// linking) revisit with a vetted lib.
//
// SECURITY: note bodies are stored as HTML. `sanitizeNoteHtml` is an allowlist
// pass so that real, user-authored notes can't inject script/handlers. It runs
// on both write (editor onChange) and read (viewer). It is intentionally
// strict; widen the allowlist deliberately, not by default.

const ALLOWED_TAGS = new Set([
  "B", "STRONG", "I", "EM", "U", "UL", "OL", "LI", "A", "BR", "P", "SPAN", "DIV",
]);

// Allowlist sanitizer that runs IDENTICALLY on server and client — no DOM
// dependency — so SSR and hydration produce the same markup (a `typeof window`
// branch here was the original hydration-mismatch bug). Drops disallowed tags
// (keeping their text), strips every attribute except a safe href on <a>, and
// removes <script>/<style>/comments outright. Used on both write and read.
export function sanitizeNoteHtml(html: string): string {
  if (!html) return "";
  let s = html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?(script|style)\b[^>]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    // Drop a trailing, UNCLOSED tag (no closing `>`). Without this a malformed
    // `<a href="javascript:...">`-with-no-`>` skips the allowlist pass below
    // (which requires a closing `>`) and survives verbatim.
    .replace(/<\/?[a-zA-Z][^>]*$/g, "");

  s = s.replace(
    /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g,
    (_m, slash: string, tag: string, attrs: string) => {
      const upper = tag.toUpperCase();
      if (!ALLOWED_TAGS.has(upper)) return ""; // drop the tag, keep inner text
      if (slash) return `</${tag.toLowerCase()}>`;
      if (upper === "A") {
        const m = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
        const href = (m && (m[1] ?? m[2] ?? m[3])) || "";
        if (href && isSafeHref(href)) {
          return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">`;
        }
        return "<a>";
      }
      return `<${tag.toLowerCase()}>`;
    },
  );
  return s;
}

function isSafeHref(href: string): boolean {
  return /^(https?:|mailto:)/i.test(href.trim());
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function RichTextView({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const clean = React.useMemo(() => sanitizeNoteHtml(html), [html]);
  if (!clean.trim()) {
    return <p className={cn("text-sm text-zinc-400 italic", className)}>—</p>;
  }
  return (
    <div
      className={cn(
        "prose-notes text-[15px] leading-7 text-[#1a1a1a] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_a]:text-mathitude-purple [&_a]:underline",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

// A resource shortcut for the N-5 `@`-mention menu.
export interface MentionShortcut {
  id: string;
  shortcut: string;
  label: string;
  href: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  shortcuts = [],
  onCreateShortcut,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** N-5: resources offered when the user types `@` */
  shortcuts?: MentionShortcut[];
  /** N-5: called when the user opts to save a new shortcut; returns the saved one */
  onCreateShortcut?: (shortcut: string, href: string) => MentionShortcut | void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [mention, setMention] = React.useState<{
    query: string;
    top: number;
    left: number;
  } | null>(null);

  // Only sync DOM from props when they diverge, so typing doesn't reset caret.
  React.useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    // execCommand is deprecated but is the dependency-free path for an MVP.
    document.execCommand(command, false, arg);
    emit();
  };

  const emit = () => {
    if (ref.current) onChange(sanitizeNoteHtml(ref.current.innerHTML));
  };

  const addLink = () => {
    const url = window.prompt("Link URL (https://…)");
    if (!url || !isSafeHref(url)) return;
    exec("createLink", url);
    // N-5 (Paula #8): when a link is added, offer to save it as a reusable
    // shortcut available to all tutors via the @-menu.
    if (
      onCreateShortcut &&
      window.confirm("Save this link as a reusable @-shortcut for all tutors?")
    ) {
      const name = window.prompt("Shortcut name (e.g. 'Straws 1')")?.trim();
      if (name) onCreateShortcut(name, url);
    }
  };

  // Detect an `@query` token immediately before the caret and position the
  // mention menu under it.
  const detectMention = () => {
    const sel = window.getSelection();
    const host = ref.current;
    if (!sel || !sel.rangeCount || !host) return setMention(null);
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return setMention(null);
    const text = (node.textContent || "").slice(0, range.startOffset);
    const m = /@([^\s@]*)$/.exec(text);
    if (!m) return setMention(null);
    const rect = range.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    setMention({
      query: m[1].toLowerCase(),
      top: rect.bottom - hostRect.top + 4,
      left: rect.left - hostRect.left,
    });
  };

  const onInput = () => {
    emit();
    detectMention();
  };

  // Remove the in-progress `@query` text and insert a chip link in its place.
  const insertShortcut = (s: MentionShortcut) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    const before = (node.textContent || "").slice(0, range.startOffset);
    const at = before.lastIndexOf("@");
    if (at >= 0 && node.nodeType === Node.TEXT_NODE) {
      const del = document.createRange();
      del.setStart(node, at);
      del.setEnd(node, range.startOffset);
      del.deleteContents();
      const a = document.createElement("a");
      a.href = s.href;
      a.textContent = s.label;
      del.insertNode(a);
      // place caret after the inserted chip + a trailing space
      const space = document.createTextNode(" ");
      a.after(space);
      const after = document.createRange();
      after.setStartAfter(space);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);
    }
    setMention(null);
    emit();
  };

  const matches = mention
    ? shortcuts.filter(
        (s) =>
          s.shortcut.toLowerCase().includes(mention.query) ||
          s.label.toLowerCase().includes(mention.query),
      )
    : [];

  const saveNew = () => {
    if (!onCreateShortcut) return;
    const name = window.prompt("Shortcut name (e.g. 'Straws 1')")?.trim();
    if (!name) return;
    const href = window.prompt("Link URL (https://…)")?.trim();
    if (!href || !isSafeHref(href)) return;
    const created = onCreateShortcut(name, href);
    if (created) insertShortcut(created);
    else setMention(null);
  };

  return (
    <div
      className={cn(
        "relative rounded-md border border-border-warm bg-white focus-within:border-mathitude-purple focus-within:ring-2 focus-within:ring-mathitude-purple/20",
        disabled && "opacity-60",
        className,
      )}
    >
      {!disabled && (
        <div className="flex items-center gap-1 border-b border-border-warm px-2 py-1">
          <ToolBtn label="Bold" onClick={() => exec("bold")}>
            <BoldIcon className="size-4" />
          </ToolBtn>
          <ToolBtn label="Bullet list" onClick={() => exec("insertUnorderedList")}>
            <ListIcon className="size-4" />
          </ToolBtn>
          <ToolBtn label="Add link" onClick={addLink}>
            <LinkIcon className="size-4" />
          </ToolBtn>
          {shortcuts.length > 0 && (
            <span className="ml-auto text-xs text-[#8b8589]">
              type <b>@</b> to link a resource
            </span>
          )}
        </div>
      )}
      <div
        ref={ref}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={onInput}
        onKeyUp={detectMention}
        onBlur={() => setTimeout(() => setMention(null), 150)}
        data-placeholder={placeholder}
        className={cn(
          "min-h-[52vh] px-4 py-3 text-[15px] leading-7 text-[#1a1a1a] outline-none",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_a]:text-mathitude-purple [&_a]:underline",
          "empty:before:text-zinc-500 empty:before:content-[attr(data-placeholder)]",
        )}
      />
      {mention && (
        <div
          className="absolute z-30 max-h-56 w-64 overflow-auto rounded-md border border-border-warm bg-white py-1 shadow-lg"
          style={{ top: mention.top, left: mention.left }}
        >
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            Resources
          </p>
          {matches.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertShortcut(s);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-surface-paper"
            >
              <LinkIcon className="size-3.5 text-mathitude-purple" />
              <span className="truncate">{s.label}</span>
            </button>
          ))}
          {matches.length === 0 && (
            <p className="px-3 py-1.5 text-xs text-text-muted">No match</p>
          )}
          {onCreateShortcut && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveNew();
              }}
              className="mt-1 flex w-full items-center gap-2 border-t border-border-warm px-3 py-1.5 text-left text-sm text-mathitude-purple hover:bg-surface-paper"
            >
              + Save new shortcut
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // onMouseDown + preventDefault keeps the editor selection while clicking.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-xs text-text-muted hover:bg-surface-paper hover:text-text-primary"
    >
      {children}
    </button>
  );
}
