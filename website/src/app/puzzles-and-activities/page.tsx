import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

export const metadata = {
  title: "All Puzzles & Activities — Mathitude",
  description:
    "Mathitude's library of puzzles, hands-on activities, and printable challenges — coming soon.",
  // 6/8 Sara: these activities aren't confirmed yet, so keep the page out of
  // search results until the library is real.
  robots: { index: false, follow: false },
};

export default function PuzzlesAndActivitiesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-white animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-28">
            <p className="text-sm uppercase tracking-[0.18em] text-[#7030A0]/70 text-center mb-6 font-medium">
              <Link
                href="/free-resources"
                className="hover:text-[#7030A0] transition-colors"
              >
                Free Resources
              </Link>{" "}
              / All Puzzles &amp; Activities
            </p>
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-[#7030A0] tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              All Puzzles &amp; Activities
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              A growing library of puzzles, hands-on activities, and printable
              challenges — organized by theme and grade level.
            </p>
          </div>
        </section>

        {/* Coming soon — 6/8 Sara: the full library isn't confirmed yet, so
            we hold it behind a placeholder rather than publishing the planned
            list. The three live tools stay reachable from Free Resources. */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <div className="rounded-3xl bg-[#F2E8FA]/60 ring-1 ring-[#7030A0]/10 px-6 py-16 sm:px-12 sm:py-20 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white ring-1 ring-[#7030A0]/15 mb-6">
                <Sparkles className="w-6 h-6 text-[#7030A0]" />
              </div>
              <p className="text-xs font-medium tracking-[0.22em] text-[#7030A0] uppercase">
                Coming soon
              </p>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-black tracking-tight">
                The full activity library is on its way.
              </h2>
              <p className="mt-4 text-base md:text-lg text-black leading-relaxed max-w-xl mx-auto">
                Mathitude is building out a themed, grade-leveled library of
                puzzles and hands-on activities. In the meantime, our live tools
                — Swamp Puzzles, the Pascal&apos;s Triangle Explorer, and
                Sierpinski Balloons — are ready to explore today.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/free-resources"
                  className="inline-flex items-center justify-center rounded-full bg-[#7030A0] text-white hover:bg-[#5d288a] font-medium uppercase tracking-wide text-sm px-8 py-3.5 min-h-[48px] transition-colors shadow-sm hover:shadow-md"
                >
                  Explore Free Resources
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-[#7030A0]/30 text-[#7030A0] hover:bg-white font-medium uppercase tracking-wide text-sm px-8 py-3.5 min-h-[48px] transition-colors"
                >
                  Request a Consultation
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
