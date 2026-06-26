"use client";

import * as React from "react";
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

export function sanitizeNoteHtml(html: string): string {
  if (typeof window === "undefined" || !html) return stripTagsServer(html);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (!ALLOWED_TAGS.has(el.tagName)) {
          // Unwrap disallowed elements: keep their text, drop the tag.
          el.replaceWith(...Array.from(el.childNodes));
          continue;
        }
        // Strip every attribute except a safe href on <a>.
        for (const attr of Array.from(el.attributes)) {
          if (el.tagName === "A" && attr.name === "href" && isSafeHref(attr.value)) {
            continue;
          }
          el.removeAttribute(attr.name);
        }
        if (el.tagName === "A") {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener noreferrer");
        }
        walk(el);
      }
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

function isSafeHref(href: string): boolean {
  return /^(https?:|mailto:)/i.test(href.trim());
}

// Server-side / no-DOM fallback: strip all tags to plain text rather than risk
// rendering unsanitized markup.
function stripTagsServer(html: string): string {
  return (html || "").replace(/<[^>]*>/g, "");
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
        "prose-notes text-sm leading-relaxed text-text-primary [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-mathitude-purple [&_a]:underline",
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
    if (url && isSafeHref(url)) exec("createLink", url);
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
            <b>B</b>
          </ToolBtn>
          <ToolBtn label="Bullet list" onClick={() => exec("insertUnorderedList")}>
            ☰
          </ToolBtn>
          <ToolBtn label="Add link" onClick={addLink}>
            🔗
          </ToolBtn>
          {shortcuts.length > 0 && (
            <span className="ml-auto text-[10px] text-text-muted">
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
          "min-h-24 px-3 py-2 text-sm leading-relaxed text-text-primary outline-none",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-mathitude-purple [&_a]:underline",
          "empty:before:text-zinc-400 empty:before:italic empty:before:content-[attr(data-placeholder)]",
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
              <span className="text-mathitude-purple">🔗</span>
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
