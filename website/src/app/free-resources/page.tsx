import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

const interactives = [
  {
    title: "Pascal's Triangle Explorer",
    description:
      "An interactive tool for discovering the surprising patterns hidden inside Pascal's Triangle — from Fibonacci numbers to binomial coefficients and fractal geometry.",
    href: "/pascals-triangle",
    cta: "Explore now",
  },
  {
    title: "Swamp Puzzles",
    description:
      "Swamp puzzles: beautiful but dangerous. Mathitude's signature strategic puzzles, designed to build logical thinking and perseverance. A favorite at math festivals and Mathitude tutoring sessions for all ages. Preview and download Levels 1, 2, and 3.",
    href: "/swamp-puzzles",
    cta: "Open Swamp Puzzles",
  },
  {
    title: "Sierpinski Balloons & Balloon Tetra Hats",
    description:
      "Twist balloons into a Sierpinski tetrahedron, then wear your mathematical creation home. A playful hands-on activity that turns fractals into party favorites.",
    href: "/balloons",
    cta: "See balloon activities",
  },
  {
    title: "All Puzzles & Activities",
    description:
      "Browse Mathitude's full library of puzzles, hands-on activities, and printable challenges — organized by theme and grade level.",
    href: "/puzzles-and-activities",
    cta: "Browse the full library",
  },
];

const freePdfs = [
  {
    title: "Number Sense Warm-Ups (K–2)",
    description:
      "A printable collection of quick daily warm-ups that build number sense and mathematical fluency for early learners.",
  },
  {
    title: "Pattern Exploration Sheets (Grades 3–5)",
    description:
      "Worksheet activities that invite students to find, extend, and create patterns — building algebraic thinking from an early age.",
  },
  {
    title: "Mathematical Mindset Reflection Cards",
    description:
      "Printable reflection cards for students and families to spark mathematical conversation and build a growth mindset around math.",
  },
];

export default function FreeResourcesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-[#7030A0] tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Free Resources
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              Interactive tools, downloadable puzzles, and free PDFs from Mathitude
              — designed to spark curiosity and bring math to life at home and
              in the classroom.
            </p>
          </div>
        </section>

        {/* Interactives */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
              Interactive Tools
            </h2>

            <div className="mt-8 space-y-0 divide-y divide-neutral-200">
              {interactives.map((item) => (
                <div key={item.title} className="py-10 first:pt-0">
                  <h3 className="text-xl font-semibold text-black">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-black leading-relaxed">
                    {item.description}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex text-sm font-medium text-[#7030A0] hover:text-[#5d288a] transition-colors"
                  >
                    {item.cta} &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Free PDFs */}
        <section className="bg-neutral-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
              Free Downloads
            </h2>
            <p className="mt-3 text-black leading-relaxed">
              Free printable PDFs for students and families. No sign-up
              required.
            </p>

            <div className="mt-8 space-y-0 divide-y divide-neutral-200">
              {freePdfs.map((pdf) => (
                <div key={pdf.title} className="py-8 first:pt-0">
                  <h3 className="text-lg font-semibold text-black">
                    {pdf.title}
                  </h3>
                  <p className="mt-2 text-black leading-relaxed">
                    {pdf.description}
                  </p>
                  <p className="mt-3 text-xs text-[#8b8589]">
                    Download coming soon.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-snug tracking-tight">
                Want more resources?
              </h2>
              <p className="mt-4 text-white/70 max-w-xl mx-auto leading-relaxed">
                Browse Mathitude&apos;s full collection of math engagement
                workbooks, or reach out to learn about tutoring.
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
                  Contact Mathitude
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
