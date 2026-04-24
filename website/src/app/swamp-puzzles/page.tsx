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
      "Paula's hardest set. Serious puzzle-lovers — try these first, then watch the hacks video below if you get stuck.",
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
            <p className="text-sm uppercase tracking-[0.18em] text-[#7030A0]/70 text-center mb-6 font-medium">
              <Link
                href="/free-resources"
                className="hover:text-[#7030A0] transition-colors"
              >
                Free Resources
              </Link>{" "}
              / Swamp Puzzles
            </p>
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-[#7030A0] tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Swamp Puzzles
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              Swamp puzzles: beautiful but dangerous. Paula&apos;s signature
              strategic puzzles, designed to build logical thinking and
              perseverance. A favorite at math festivals and Mathitude
              tutoring sessions for all ages.
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-32">
            <div className="space-y-20 md:space-y-24">
              {puzzles.map((puzzle) => (
                <article key={puzzle.level} className="flex flex-col items-center text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7030A0] font-medium">
                    {puzzle.level}
                  </p>
                  <h2
                    className="mt-2 text-4xl md:text-5xl text-black"
                    style={{ fontFamily: "var(--font-original-surfer)" }}
                  >
                    <a
                      href={puzzle.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#7030A0] transition-colors"
                    >
                      {puzzle.title}
                    </a>
                  </h2>
                  <p className="mt-3 text-base md:text-lg text-black leading-relaxed max-w-xl">
                    {puzzle.description}
                  </p>

                  <a
                    href={puzzle.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${puzzle.title} PDF in a new tab`}
                    className="group mt-8 block w-full rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-[16/9]">
                      <Image
                        src={puzzle.cover}
                        alt={`${puzzle.title} cover`}
                        fill
                        sizes="(max-width: 768px) 100vw, 720px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        priority={puzzle.level === "Level 1"}
                      />
                      <div className="absolute inset-0 flex items-end justify-center pb-6 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center justify-center rounded-full bg-white text-[#7030A0] font-medium text-sm px-5 py-2.5 shadow-md">
                          Open PDF &rarr;
                        </span>
                      </div>
                    </div>
                  </a>

                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <a
                      href={puzzle.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md bg-[#7030A0] text-white hover:bg-[#5d288a] font-medium text-sm px-5 py-2.5 transition-colors"
                    >
                      View PDF
                    </a>
                    <a
                      href={puzzle.file}
                      download
                      className="inline-flex items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:text-black font-medium text-sm px-5 py-2.5 transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </article>
              ))}

              {/* Level 3 Hacks video */}
              <article className="flex flex-col items-center text-center">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7030A0] font-medium">
                  Bonus
                </p>
                <h2
                  className="mt-2 text-4xl md:text-5xl text-black"
                  style={{ fontFamily: "var(--font-original-surfer)" }}
                >
                  Level 3 Hacks Video
                </h2>
                <p className="mt-3 text-base md:text-lg text-black leading-relaxed max-w-xl">
                  Stuck on a Level 3 puzzle? Paula walks through the toughest
                  tricks and strategies in this video.
                </p>
                <div className="mt-8 w-full rounded-xl overflow-hidden border border-neutral-200 shadow-sm">
                  <div className="relative aspect-[16/9] bg-black">
                    <iframe
                      src="https://www.youtube-nocookie.com/embed/Vdr-YgJ-j4w"
                      title="Level 3 Hacks Video"
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </div>
              </article>
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
                  className="inline-flex items-center justify-center rounded-md bg-white text-black hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
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
