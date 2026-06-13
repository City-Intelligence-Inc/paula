import { type ReactNode } from "react";

// Previously a tap-to-reveal flip card. Per Sara (6/13) the answers now show
// directly — no interaction — on a warm taupe card with Mathitude-purple
// labels (the pale lavender fill read "too girly"). Kept the FlipQuestion name
// so the balloons page imports don't need to change.
export function FlipQuestion({
  label = "Challenge question",
  question,
  answer,
}: {
  label?: string;
  question: ReactNode;
  answer: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-black/[0.06] bg-[#EFEBE5] p-5 md:p-6">
      <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#7030A0] mb-3">
        {label}
      </p>
      <div className="text-base md:text-lg text-black leading-relaxed">
        {question}
      </div>
      <div className="mt-6 pt-5 border-t border-black/[0.08]">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#7030A0] mb-3">
          Answer
        </p>
        <div className="text-base md:text-lg text-black leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );
}
