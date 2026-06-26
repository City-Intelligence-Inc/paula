"use client";

import * as React from "react";
import { RichTextView } from "./rich-text";
import type { SessionNote } from "@/lib/session-notes";

// Parent/student notes view (FEATURE_LIST N-9) — matches PARENT_VIEWING_NOTES.png:
// a warm, per-session stacked layout (not the staff spreadsheet). Each session
// is a block with a centered date heading and two labelled sections,
// "Activities" and "Notes", separated by a subtle sine-wave divider. Only the
// two family-facing fields are ever shown.

function formatLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// A quiet, math-flavored session divider: a single sine wave in brand purple
// at low opacity. Subtle, on-brand, not gaudy.
function MathDivider() {
  return (
    <div aria-hidden className="my-6 flex justify-center text-mathitude-purple/35">
      <svg width="180" height="20" viewBox="0 0 180 20" fill="none">
        <path
          d="M2 10 q 11 -7 22 0 t 22 0 t 22 0 t 22 0 t 22 0 t 22 0 t 22 0 t 22 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function ParentNotesView({
  studentName,
  notes,
}: {
  studentName: string;
  notes: SessionNote[]; // most-recent-first, already limited to shared fields
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1
        className="text-center text-4xl text-mathitude-purple"
        style={{ fontFamily: "var(--font-original-surfer)" }}
      >
        {studentName}
      </h1>

      {notes.length === 0 && (
        <p className="mt-10 text-center text-sm text-text-muted">
          No session notes yet.
        </p>
      )}

      {notes.map((n, i) => (
        <React.Fragment key={n.id}>
          {i > 0 && <MathDivider />}
          <section className="py-8">
            <h2 className="text-center text-lg font-semibold text-mathitude-purple">
              {formatLong(n.dateTime)}
            </h2>
            {n.groupLabel && (
              <p className="mt-1 text-center text-xs text-text-muted">
                {n.groupLabel}
              </p>
            )}
            <div className="mt-5 grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="mb-1.5 text-base font-semibold text-mathitude-purple">
                  Activities
                </h3>
                <RichTextView html={n.sessionActivities ?? ""} />
              </div>
              <div>
                <h3 className="mb-1.5 text-base font-semibold text-mathitude-purple">
                  Notes
                </h3>
                <RichTextView html={n.publicNotes ?? ""} />
              </div>
            </div>
          </section>
        </React.Fragment>
      ))}
    </div>
  );
}
