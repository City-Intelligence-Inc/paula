import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* Word-reveal helper — wraps each word in an overflow-hidden span + inner animated span */
function WordReveal({ text, baseDelay = 0 }: { text: string; baseDelay?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden leading-none mr-[0.26em]">
          <span
            data-reveal="word"
            data-delay={String(Math.min(baseDelay + i + 1, 8))}
            className="inline-block"
          >
            {word}
          </span>
        </span>
      ))}
    </>
  );
}

export function CtaBanner() {
  return (
    <section data-spotlight className="relative bg-neutral-950 text-white overflow-hidden">

      {/* Aurora background — three drifting radial gradients */}
      <div
        aria-hidden="true"
        className="aurora-blob w-[600px] h-[600px] top-[-120px] left-[-80px] opacity-[0.10]"
        style={{
          background: "radial-gradient(circle, #7030A0 0%, transparent 70%)",
          animation: "aurora-1 22s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden="true"
        className="aurora-blob w-[400px] h-[400px] bottom-[-60px] right-[-40px] opacity-[0.08]"
        style={{
          background: "radial-gradient(circle, #2AB5B2 0%, transparent 70%)",
          animation: "aurora-2 30s linear infinite",
        }}
      />
      <div
        aria-hidden="true"
        className="aurora-blob w-[300px] h-[300px] top-[40%] left-[45%] opacity-[0.06]"
        style={{
          background: "radial-gradient(circle, #9B59D6 0%, transparent 70%)",
          animation: "aurora-3 18s ease-in-out infinite",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 relative z-10">
        <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-10 lg:gap-16 items-end">
          <div>
            <p
              data-reveal
              className="text-xs font-medium tracking-[0.22em] text-white/50 uppercase mb-5"
            >
              Ready when you are
            </p>
            <h2
              className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white tracking-tight leading-[1.1]"
            >
              <WordReveal text="Bring Mathitude home." baseDelay={0} />
            </h2>
            <p
              data-reveal
              data-delay="5"
              className="mt-6 text-base sm:text-lg text-white/70 leading-relaxed max-w-xl"
            >
              Tell us about your student. Paula replies with a concrete
              next step.
            </p>
          </div>

          <div
            data-reveal
            data-delay="6"
            className="flex flex-col items-start lg:items-end gap-4"
          >
            <Link
              href="/contact"
              data-magnetic
              className="inline-flex items-center justify-center rounded-full bg-white text-neutral-950 hover:bg-neutral-100 font-medium text-base px-9 py-4 transition-colors whitespace-nowrap shadow-sm"
            >
              Request a free consultation
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
