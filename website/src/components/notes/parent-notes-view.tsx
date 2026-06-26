"use client";

import * as React from "react";
import { RichTextView } from "./rich-text";
import type { SessionNote } from "@/lib/session-notes";

// Parent/student notes view (FEATURE_LIST N-9) — matches PARENT_VIEWING_NOTES.png:
// a warm, per-session stacked layout (not the staff spreadsheet). Each session
// is a block with a centered date heading and two labelled sections,
// "Activities" and "Notes", separated by a Hitomezashi-stitch divider. Only the
// two family-facing fields are ever shown.

function formatLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Decorative stitch band, evoking the Hitomezashi projects Paula runs. Pure CSS
// (a woven grid of short dashes) so there's no asset to ship.
function StitchDivider() {
  return (
    <div
      aria-hidden
      className="mx-auto my-2 h-3 w-40 opacity-70"
      style={{
        color: "#8b8589",
        backgroundImage:
          "repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 8px), repeating-linear-gradient(0deg, currentColor 0 2px, transparent 2px 8px)",
        backgroundSize: "8px 8px",
      }}
    />
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
          {i > 0 && <StitchDivider />}
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
                <h3 className="mb-1.5 text-sm font-semibold text-mathitude-purple">
                  Activities
                </h3>
                <RichTextView html={n.sessionActivities ?? ""} />
              </div>
              <div>
                <h3 className="mb-1.5 text-sm font-semibold text-mathitude-purple">
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
