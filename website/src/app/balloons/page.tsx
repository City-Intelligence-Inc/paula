import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

export const metadata = {
  title: "Sierpinski Balloons & Balloon Tetra Hats — Mathitude",
  description:
    "Twist balloons into a Sierpinski tetrahedron, then wear your mathematical creation home. A playful hands-on activity that turns fractals into party favorites.",
};

const steps = [
  {
    n: "01",
    title: "Start with one tetra",
    body:
      "Twist four long balloons (260s work great) into a single tetrahedron — four triangular faces, four vertices, six edges. This is your base unit. Every Sierpinski hat is a collection of these.",
  },
  {
    n: "02",
    title: "Iterate to the next level",
    body:
      "Build four tetrahedra, then arrange them so they share vertices at the corners of a bigger tetrahedron. You just built a level-1 Sierpinski tetrahedron: the same shape, at a larger scale, with a hollow middle.",
  },
  {
    n: "03",
    title: "Keep going if you dare",
    body:
      "Level 2 uses 16 small tetrahedra. Level 3 uses 64. The pattern keeps repeating, getting more intricate with each iteration — that's the fractal.",
  },
  {
    n: "04",
    title: "Wear it home",
    body:
      "The balloon structure is light enough to wear as a hat. Kids leave math festivals with a geometric crown, and their parents leave wondering how balloons and math connect in the first place.",
  },
];

export default function BalloonsPage() {
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
              / Sierpinski Balloons
            </p>
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-[#7030A0] tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Sierpinski Balloons &amp; Balloon Tetra Hats
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              Twist balloons into a Sierpinski tetrahedron, then wear your
              mathematical creation home. A playful hands-on activity that
              turns fractals into party favorites.
            </p>
          </div>
        </section>

        {/* What is a Sierpinski tetrahedron */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
              What is a Sierpinski tetrahedron?
            </h2>
            <div className="mt-5 space-y-4 text-base md:text-lg text-black leading-relaxed">
              <p>
                It&apos;s a 3D fractal. You start with a tetrahedron — four
                triangular faces, like a three-sided pyramid — and replace it
                with four smaller tetrahedra, each sharing a vertex with the
                big one. The middle stays empty. Repeat, and each smaller
                tetrahedron gets replaced the same way.
              </p>
              <p>
                The structure is self-similar at every scale: zoom in on any
                piece and it looks just like the whole thing. That&apos;s the
                signature property of a fractal, and kids see it immediately
                once they build a level-2 hat.
              </p>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="bg-neutral-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
              How to build one
            </h2>
            <div className="mt-8 divide-y divide-neutral-200">
              {steps.map((step) => (
                <div
                  key={step.n}
                  className="grid sm:grid-cols-[64px_1fr] gap-x-6 gap-y-2 py-8 first:pt-0 last:pb-0"
                >
                  <span className="text-3xl font-semibold text-[#7030A0]/40 leading-none tabular-nums">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-black tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-base text-black leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Materials */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
              What you&apos;ll need
            </h2>
            <ul className="mt-5 space-y-3 text-base md:text-lg text-black leading-relaxed">
              <li>
                <span className="font-medium">Twisting balloons</span> — 260Q
                (&quot;260s&quot;) are the standard size. Figure on 4 balloons
                for a single tetrahedron, 16 for a level-1 hat.
              </li>
              <li>
                <span className="font-medium">A balloon pump</span> — hand
                pumps work, but an electric pump saves a lot of breath at a
                festival table.
              </li>
              <li>
                <span className="font-medium">Patience</span> — the first
                tetra takes a few minutes. After that, kids pick up the twist
                pattern quickly.
              </li>
            </ul>
          </div>
        </section>

        {/* Where to try this */}
        <section className="bg-neutral-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
              See Paula build these in person
            </h2>
            <p className="mt-4 text-base md:text-lg text-black leading-relaxed">
              Sierpinski balloon tetras are a staple at the Julia Robinson
              Mathematics Festival and at Paula&apos;s Bay Area math events.
              Keep an eye on the Events page for upcoming festivals — balloon
              tetra hats are usually there.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-md bg-[#7030A0] text-white hover:bg-[#5d288a] font-medium text-sm px-6 py-3 transition-colors"
              >
                See upcoming events
              </Link>
              <Link
                href="/free-resources"
                className="inline-flex items-center justify-center rounded-md border border-neutral-200 text-black hover:border-[#7030A0] hover:text-[#7030A0] font-medium text-sm px-6 py-3 transition-colors"
              >
                Back to Free Resources
              </Link>
            </div>
          </div>
        </section>

        {/* Mascot nod for continuity with swamp-puzzles page */}
        <section className="relative bg-white overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative">
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-8 right-4 w-24 lg:w-28 rotate-6 opacity-95 pointer-events-none"
            >
              <Image
                src="/brand/rubiks-boy.png"
                alt=""
                width={240}
                height={280}
                className="w-full h-auto drop-shadow-md"
              />
            </div>
            <blockquote className="max-w-xl">
              <p
                className="text-2xl md:text-3xl text-black leading-[1.3] font-light"
              >
                &ldquo;The first time a kid wears a level-2 Sierpinski hat out
                of the math festival, that&apos;s when fractals stop being
                abstract.&rdquo;
              </p>
              <footer className="mt-4 text-sm text-[#8b8589]">
                — Paula Hamilton
              </footer>
            </blockquote>
          </div>
        </section>

        <section className="bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl text-white leading-snug tracking-tight"
                style={{ fontFamily: "var(--font-original-surfer)" }}
              >
                Want Paula to run this at your school?
              </h2>
              <p className="mt-4 text-white/70 max-w-xl mx-auto leading-relaxed">
                Balloon tetra workshops are part of the event programming.
                Reach out to book a session.
              </p>
              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-white text-neutral-900 hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Request a consultation
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
