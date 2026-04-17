import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

const puzzles = [
  {
    level: "Level 1",
    title: "Level 1 Puzzles",
    description:
      "The gentlest entry to Paula's signature strategic puzzles — perfect for younger solvers building logical thinking and perseverance.",
    file: "/swamp-puzzles/level-1.pdf",
    cover: "/swamp-puzzles/cover-level-1.jpg",
  },
  {
    level: "Level 2",
    title: "Level 2 Puzzles",
    description:
      "A step up in challenge. Classic Swamp Puzzles that reward patient reasoning and creative problem-solving.",
    file: "/swamp-puzzles/level-2.pdf",
    cover: "/swamp-puzzles/cover-level-2.jpg",
  },
  {
    level: "Level 3",
    title: "Level 3 Puzzles",
    description:
      "Paula's hardest set. Serious puzzle-lovers — try these first, then watch the hacks video on the original Mathitude site if you get stuck.",
    file: "/swamp-puzzles/level-3.pdf",
    cover: "/swamp-puzzles/cover-level-3.jpg",
  },
];

export default function SwampPuzzlesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative bg-white animate-fade-in-up overflow-hidden">
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-16 right-6 lg:right-16 w-28 lg:w-36 rotate-6 opacity-95 pointer-events-none"
          >
            <Image
              src="/brand/rubiks-boy.png"
              alt=""
              width={280}
              height={320}
              className="w-full h-auto drop-shadow-md"
            />
          </div>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-28 relative">
            <p className="text-sm uppercase tracking-[0.18em] text-mathitude-purple/70 text-center mb-6 font-medium">
              <Link
                href="/free-resources"
                className="hover:text-mathitude-purple transition-colors"
              >
                Free Resources
              </Link>{" "}
              / Swamp Puzzles
            </p>
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-mathitude-purple tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Swamp Puzzles
            </h1>
            <p className="mt-6 text-lg md:text-xl text-neutral-600 leading-relaxed text-center max-w-2xl mx-auto">
              Paula&apos;s signature strategic puzzles, designed to build
              logical thinking and perseverance. A favorite at math festivals
              and Mathitude tutoring sessions for all ages. Click a cover to
              open the full PDF, or download for offline printing.
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-32">
            <div className="grid md:grid-cols-3 gap-8 md:gap-6 lg:gap-10">
              {puzzles.map((puzzle) => (
                <div key={puzzle.level} className="flex flex-col">
                  <a
                    href={puzzle.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block relative rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 hover-lift"
                    aria-label={`Open ${puzzle.title} PDF in a new tab`}
                  >
                    <div className="relative aspect-[16/9]">
                      <Image
                        src={puzzle.cover}
                        alt={`${puzzle.title} cover`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-end justify-start p-4 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="inline-flex items-center gap-1.5 text-white text-sm font-medium">
                        Open PDF &rarr;
                      </span>
                    </div>
                  </a>

                  <p
                    className="mt-5 text-xs uppercase tracking-[0.18em] text-mathitude-purple font-medium"
                  >
                    {puzzle.level}
                  </p>
                  <h2
                    className="mt-1 text-2xl text-neutral-900"
                    style={{ fontFamily: "var(--font-original-surfer)" }}
                  >
                    {puzzle.title}
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                    {puzzle.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <a
                      href={puzzle.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md bg-mathitude-purple text-white hover:bg-[#5d288a] font-medium text-sm px-4 py-2.5 transition-colors"
                    >
                      View PDF
                    </a>
                    <a
                      href={puzzle.file}
                      download
                      className="inline-flex items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:text-neutral-900 font-medium text-sm px-4 py-2.5 transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl text-white leading-snug tracking-tight"
                style={{ fontFamily: "var(--font-original-surfer)" }}
              >
                Want more puzzles?
              </h2>
              <p className="mt-4 text-white/60 max-w-xl mx-auto leading-relaxed">
                Browse Paula&apos;s full collection of math engagement
                workbooks, or reach out about tutoring.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-md bg-white text-neutral-900 hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Shop Books
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md border border-white/20 text-white hover:bg-white/10 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Contact Paula
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
