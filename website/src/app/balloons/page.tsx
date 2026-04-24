import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

export const metadata = {
  title: "Tetra Balloon Hats & Sierpinski Triangle Structures — Mathitude",
  description:
    "Learn how to make a tetra balloon hat, explore Sierpinski triangles and fractals, and meet Wacław Sierpiński — a hands-on fractal activity from Paula Hamilton.",
};

export default function BalloonsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-28">
            <p className="text-sm uppercase tracking-[0.18em] text-[#7030A0]/70 text-center mb-6 font-medium">
              <Link
                href="/free-resources"
                className="hover:text-[#7030A0] transition-colors"
              >
                Free Resources
              </Link>{" "}
              / Tetra Balloon Hats
            </p>
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-[#7030A0] tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Tetra Balloon Hats &amp; Sierpinski Triangle Structures
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              Benji will show you the ins and outs of making a tetra balloon
              hat in this video. Download detailed instructions below!
            </p>
          </div>
        </section>

        {/* Video */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-200 shadow-sm bg-black">
              <iframe
                src="https://www.youtube-nocookie.com/embed/oEkl7nYkf1s"
                title="Benji makes a tetra balloon hat"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <p className="mt-6 text-center">
              <a
                href="https://www.mathitude.com/balloons"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-[#7030A0] hover:text-[#5d288a] transition-colors"
              >
                Download the instructions here &rarr;
              </a>
            </p>
          </div>
        </section>

        {/* Why Tetra Hats? */}
        <section className="bg-neutral-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
              Why are they called Tetra Hats?
            </h2>
            <p className="mt-5 text-base md:text-lg text-black leading-relaxed">
              The name comes from the hat&apos;s 4 sides. The hat is an example
              of a shape called a <span className="font-semibold">tetrahedron</span>
              , which uses the Greek roots for 4 (&ldquo;tetra&rdquo;) and side
              or base (&ldquo;hedron&rdquo;). Do you see the 4 sides?
            </p>
          </div>
        </section>

        {/* Sierpinski levels */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
              What is a Sierpinski triangle?
            </h2>

            <div className="mt-8 relative w-full rounded-lg overflow-hidden bg-white">
              <Image
                src="/balloons/sierpinski-levels.png"
                alt="Sierpinski triangles at Level 0, Level 1, Level 2, Level 3, and Level 4"
                width={1360}
                height={222}
                className="w-full h-auto"
                priority
              />
              <div className="mt-3 grid grid-cols-5 gap-2 text-xs md:text-sm text-[#8b8589] text-center font-medium">
                <span>Level 0</span>
                <span>Level 1</span>
                <span>Level 2</span>
                <span>Level 3</span>
                <span>Level 4</span>
              </div>
            </div>

            <div className="mt-8 space-y-4 text-base md:text-lg text-black leading-relaxed">
              <p>
                Benji&apos;s tetra hat is an example of a 3-D Level 0 Sierpinski
                triangle. A Sierpinski triangle follows an interesting pattern.
                We can categorize its &ldquo;level&rdquo; based on how many
                sizes of white, upside-down triangles are within it.
              </p>
              <p>
                The Level 0 triangle (the same level as Benji&apos;s 3-D hat)
                has 0 sizes of white triangles in it, since it has 0 white
                triangles in it at all. The Level 1 triangle has 1 white
                triangle, so it has 1 size of triangle. The Level 2 has 2
                different sizes of white triangles. The Level 3 has 3
                different sizes of white triangles.
              </p>
            </div>

            {/* Questions */}
            <div className="mt-10 space-y-5">
              <div className="rounded-lg border border-[#7030A0]/20 bg-[#7030A0]/5 p-5 md:p-6">
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#7030A0] mb-2">
                  Q
                </p>
                <p className="text-base md:text-lg text-black leading-relaxed">
                  How many sizes of white triangle are in the Level 4 triangle?
                </p>
              </div>
              <div className="rounded-lg border border-[#7030A0]/20 bg-[#7030A0]/5 p-5 md:p-6">
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#7030A0] mb-2">
                  Challenge question
                </p>
                <p className="text-base md:text-lg text-black leading-relaxed">
                  Can you predict how many white triangles will be in the Level
                  5 triangle?
                </p>
              </div>
            </div>

            <div className="mt-10 space-y-4 text-base md:text-lg text-black leading-relaxed">
              <p className="font-semibold text-black">
                Another way to explore: pick any two levels above and compare
                them.
              </p>
              <p>
                How many white triangles does each level have? How many more
                triangles does the bigger level have than the smaller one?
                What&apos;s the relationship between the two numbers? Is there
                a pattern to how many white triangles are in each level? Do
                you see similarities between the two shapes?
              </p>
            </div>
          </div>
        </section>

        {/* Fractals */}
        <section className="bg-neutral-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
              What is a fractal?
            </h2>
            <div className="mt-5 space-y-4 text-base md:text-lg text-black leading-relaxed">
              <p>
                A Level Infinity Sierpinski triangle is called a{" "}
                <span className="font-semibold">&ldquo;fractal.&rdquo;</span>{" "}
                When you zoom into a Sierpinski triangle fractal, you&apos;ll
                see infinite white triangles inside it. This means it will keep
                repeating itself as you zoom in further on it.
              </p>
              <p>
                There are lots of cool fractals in the world, and many occur in
                nature. Try asking an adult to help show you more fractals
                online.
              </p>
            </div>
          </div>
        </section>

        {/* Sierpinski */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
              Who was Sierpinski?
            </h2>
            <p className="mt-5 text-base md:text-lg text-black leading-relaxed">
              <span className="font-semibold">Wacław Sierpiński (1882–1969)</span>{" "}
              was a Polish mathematician who explored many important and
              interesting topics in math, including set theory, number theory,
              and topology. He&apos;s best known today as the namesake of three
              fractals.
            </p>
          </div>
        </section>

        {/* Level 4 tetrahedron photo */}
        <section className="bg-neutral-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight text-center">
              Check out our Level Four Sierpinski Balloon Tetrahedron!
            </h2>
            <div className="mt-10 relative aspect-[4/3] w-full rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/balloons/balloon-tetrahedron.jpg"
                alt="Mathitude's Level 4 Sierpinski balloon tetrahedron — kids inside a giant blue, green, and white balloon fractal structure"
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
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
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-white text-neutral-900 hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Request a consultation
                </Link>
                <Link
                  href="/free-resources"
                  className="inline-flex items-center justify-center rounded-md border border-white/20 text-white hover:bg-white/10 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Back to Free Resources
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
