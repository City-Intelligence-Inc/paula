"use client";

import { useState, type ReactNode } from "react";

export function FlipQuestion({
  label = "Challenge question",
  question,
  answer,
}: {
  label?: string;
  question: ReactNode;
  answer: ReactNode;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="[perspective:1400px]">
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        aria-pressed={flipped}
        aria-label={flipped ? "Hide answer" : "Reveal answer"}
        className="group relative block w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7030A0] focus-visible:ring-offset-2 rounded-lg"
      >
        <div
          className="relative w-full grid transition-transform duration-700 [transform-style:preserve-3d]"
          style={{
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            gridTemplateAreas: '"stack"',
          }}
        >
          {/* Front */}
          <div
            className="[backface-visibility:hidden] rounded-lg border border-[#7030A0]/20 bg-[#7030A0]/5 p-5 md:p-6 group-hover:bg-[#7030A0]/[0.07] transition-colors flex flex-col"
            style={{ gridArea: "stack" }}
          >
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#7030A0] mb-3">
              {label}
            </p>
            <div className="text-base md:text-lg text-black leading-relaxed flex-1">
              {question}
            </div>
            <p className="mt-6 text-xs font-semibold tracking-[0.18em] uppercase text-[#7030A0]/70 text-right">
              Tap to reveal answer &rarr;
            </p>
          </div>

          {/* Back */}
          <div
            className="[backface-visibility:hidden] rounded-lg border border-[#7030A0]/40 bg-[#7030A0]/10 p-5 md:p-6 flex flex-col"
            style={{ gridArea: "stack", transform: "rotateY(180deg)" }}
            aria-hidden={!flipped}
          >
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#7030A0] mb-3">
              Answer
            </p>
            <div className="text-base md:text-lg text-black leading-relaxed flex-1">
              {answer}
            </div>
            <p className="mt-6 text-xs font-semibold tracking-[0.18em] uppercase text-[#7030A0]/70 text-right">
              &larr; Tap to flip back
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
