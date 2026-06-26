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

// Math-flavored session divider: an actual sine wave (purple) with a cosine
// wave (taupe) overlaid a quarter-phase ahead. Computed from Math.sin/cos so
// they read unmistakably as waves. On-brand, playful, still tasteful.
function MathDivider() {
  const W = 200;
  const mid = 20;
  const amp = 13;
  const periods = 2;
  const wave = (phase: number) => {
    const pts: string[] = [];
    for (let x = 0; x <= W; x += 4) {
      const y = mid - amp * Math.sin((x / W) * periods * 2 * Math.PI + phase);
      pts.push(`${x} ${y.toFixed(1)}`);
    }
    return "M" + pts.join(" L");
  };
  return (
    <div aria-hidden className="my-7 flex justify-center">
      <svg width="200" height="40" viewBox="0 0 200 40" fill="none">
        {/* sine */}
        <path d={wave(0)} stroke="#7030A0" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
        {/* cosine (sine shifted +90°) */}
        <path d={wave(Math.PI / 2)} stroke="#8b8589" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
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
