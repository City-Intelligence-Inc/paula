import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

export const metadata = {
  title: "All Puzzles & Activities — Mathitude",
  description:
    "Paula's full library of puzzles, hands-on activities, and printable challenges — organized by theme and grade level.",
};

type Activity = {
  title: string;
  description: string;
  href?: string;
  status?: "Available" | "Coming soon";
};

type Section = {
  heading: string;
  subhead: string;
  items: Activity[];
};

const sections: Section[] = [
  {
    heading: "Strategic & Logic Puzzles",
    subhead:
      "Paula's signature puzzles — build logical thinking, pattern recognition, and the muscle to push through hard problems.",
    items: [
      {
        title: "Swamp Puzzles (Levels 1–3)",
        description:
          "Beautiful but dangerous. Three difficulty levels, plus a bonus video of Paula walking through the toughest tricks.",
        href: "/swamp-puzzles",
        status: "Available",
      },
      {
        title: "Pascal's Triangle Explorer",
        description:
          "An interactive tool for discovering the surprising patterns hidden inside Pascal's Triangle — Fibonacci numbers, binomial coefficients, fractal geometry.",
        href: "/pascals-triangle",
        status: "Available",
      },
    ],
  },
  {
    heading: "Hands-On Activities",
    subhead:
      "Math you can build, touch, and wear home. Great for festivals, camps, and classrooms.",
    items: [
      {
        title: "Sierpinski Balloons & Balloon Tetra Hats",
        description:
          "Twist 260Q balloons into a fractal tetrahedron. Four balloons makes a level-0 tetra; 16 makes a level-1 hat.",
        href: "/balloons",
        status: "Available",
      },
      {
        title: "Straw Polyhedra",
        description:
          "Build Platonic and Archimedean solids with straws and pipe cleaners. A hands-on way to see why there are exactly five Platonic solids.",
        status: "Coming soon",
      },
      {
        title: "Origami Number Line",
        description:
          "Fold a paper strip into a working number line — negatives, fractions, and decimals all in the same object.",
        status: "Coming soon",
      },
    ],
  },
  {
    heading: "Printable Challenges",
    subhead:
      "PDFs designed to pull students into a problem before they realize it&apos;s a problem.",
    items: [
      {
        title: "Number Sense Warm-Ups (K–2)",
        description:
          "A printable collection of quick daily warm-ups that build number sense and mathematical fluency for early learners.",
        status: "Coming soon",
      },
      {
        title: "Pattern Exploration Sheets (Grades 3–5)",
        description:
          "Worksheet activities that invite students to find, extend, and create patterns — building algebraic thinking from an early age.",
        status: "Coming soon",
      },
      {
        title: "Mathematical Mindset Reflection Cards",
        description:
          "Printable reflection cards for students and families to spark mathematical conversation and build a growth mindset around math.",
        status: "Coming soon",
      },
    ],
  },
];

const gradeIndex = [
  { label: "Pre-K – K", items: ["Number Sense Warm-Ups", "Sierpinski Balloons (with help)"] },
  { label: "Grades 1–2", items: ["Number Sense Warm-Ups", "Swamp Puzzles Level 1", "Sierpinski Balloons"] },
  { label: "Grades 3–5", items: ["Pattern Exploration Sheets", "Swamp Puzzles Levels 1–2", "Pascal's Triangle Explorer", "Straw Polyhedra"] },
  { label: "Grades 6–8", items: ["Swamp Puzzles Levels 2–3", "Pascal's Triangle Explorer", "Sierpinski Balloons", "Origami Number Line"] },
  { label: "Grades 9–12", items: ["Swamp Puzzles Level 3", "Pascal's Triangle Explorer", "Mathematical Mindset Reflection Cards"] },
];

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
              Paula&apos;s full library of puzzles, hands-on activities, and
              printable challenges — organized by theme and grade level.
            </p>
          </div>
        </section>

        {/* By theme */}
        <section className="bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 space-y-20">
            {sections.map((section) => (
              <div key={section.heading}>
                <div className="max-w-2xl mb-10">
                  <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
                    {section.heading}
                  </h2>
                  <p className="mt-3 text-base md:text-lg text-black leading-relaxed">
                    {section.subhead}
                  </p>
                </div>

                <div className="divide-y divide-neutral-200">
                  {section.items.map((item) => (
                    <div key={item.title} className="py-8 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-lg md:text-xl font-semibold text-black">
                          {item.title}
                        </h3>
                        {item.status && (
                          <span
                            className={
                              item.status === "Available"
                                ? "text-xs uppercase tracking-[0.16em] font-medium text-[#7030A0]"
                                : "text-xs uppercase tracking-[0.16em] font-medium text-[#8b8589]"
                            }
                          >
                            {item.status}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-base text-black leading-relaxed">
                        {item.description}
                      </p>
                      {item.href && (
                        <Link
                          href={item.href}
                          className="mt-3 inline-flex text-sm font-medium text-[#7030A0] hover:text-[#5d288a] transition-colors"
                        >
                          Open &rarr;
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* By grade */}
        <section className="bg-neutral-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
                Browse by grade
              </h2>
              <p className="mt-3 text-base md:text-lg text-black leading-relaxed">
                Not sure where to start? Pick a grade band and work through
                what&apos;s listed. Paula can recommend a tighter sequence on a
                consultation call.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-10">
              {gradeIndex.map((band) => (
                <div key={band.label}>
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#7030A0]">
                    {band.label}
                  </p>
                  <ul className="mt-3 space-y-1.5 text-base text-black">
                    {band.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
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
                Want Paula&apos;s take on what fits your student?
              </h2>
              <p className="mt-4 text-white/70 max-w-xl mx-auto leading-relaxed">
                A short conversation is enough. Paula will recommend the
                puzzles and workbooks that match where your student actually
                is.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-white text-neutral-900 hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Request a consultation
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-md border border-white/20 text-white hover:bg-white/10 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Shop workbooks
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
