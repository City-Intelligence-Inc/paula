import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

export default function MathEngagementPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-[#7030A0] tracking-tight text-center" style={{ fontFamily: "var(--font-original-surfer)" }}>
              Math Engagement
            </h1>
            <p className="mt-6 text-lg md:text-xl text-neutral-500 leading-relaxed text-center max-w-2xl mx-auto">
              At Mathitude, we believe anyone can do math — and anyone can have
              fun doing it. Our approach integrates deep math mastery with
              exciting engagement, fostering big mathematical thinking through
              fun, collaborative learning.
            </p>
          </div>
        </section>

        {/* Sub-sections */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <div className="space-y-0 divide-y divide-neutral-200">
              {/* Enrichment Books */}
              <div className="py-12 first:pt-0">
                <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
                  Enrichment Books
                </h2>
                <p className="mt-4 text-black leading-relaxed">
                  Paula&apos;s signature math engagement workbooks are designed
                  to integrate skills in a way that combines deep math mastery
                  with fun, exciting presentation. Rather than drilling students
                  on isolated skills or calculations, each workbook weaves
                  together concepts so learners build genuine mathematical
                  understanding while enjoying every page.
                </p>
                <p className="mt-3 text-black leading-relaxed">
                  Available for elementary and middle-grade students, these
                  workbooks are a cornerstone of the Mathitude philosophy —
                  that math should be both rigorous and joyful.
                </p>
                <Link
                  href="/shop"
                  className="mt-4 inline-flex text-sm font-medium text-black hover:text-[#7030A0] transition-colors"
                >
                  Browse books &rarr;
                </Link>
              </div>

              {/* Individual & Small Group Tutoring */}
              <div className="py-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
                  Individual &amp; Small Group Tutoring
                </h2>
                <p className="mt-4 text-black leading-relaxed">
                  Paula offers private math coaching for students of all ages,
                  from pre-K through college. Sessions are available in-person
                  at our Menlo Park location and virtually, either one-on-one
                  or in small groups.
                </p>
                <p className="mt-3 text-black leading-relaxed">
                  About 60% of Mathitude&apos;s tutoring work is enrichment —
                  helping students explore their curiosity and develop their
                  superpowers as mathematicians. The remaining 40% is academic
                  support, strengthening foundational skills and building
                  confidence.
                </p>
                <Link
                  href="/tutoring"
                  className="mt-4 inline-flex text-sm font-medium text-black hover:text-[#7030A0] transition-colors"
                >
                  Learn about tutoring &rarr;
                </Link>
              </div>

              {/* Puzzles & Activities */}
              <div className="py-12 last:pb-0">
                <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
                  Puzzles &amp; Activities
                </h2>
                <p className="mt-4 text-black leading-relaxed">
                  Mathitude&apos;s collection of downloadable puzzles and
                  activities brings math to life beyond the classroom. From
                  swamp puzzles that challenge strategic thinking to
                  Pascal&apos;s Triangle explorations that reveal surprising
                  patterns, each activity is crafted to spark curiosity and
                  build problem-solving skills.
                </p>
                <p className="mt-3 text-black leading-relaxed">
                  Paula also shares strategy videos and mathematical
                  explorations that parents and students can enjoy together,
                  reinforcing the collaborative spirit at the heart of
                  Mathitude&apos;s approach.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-snug tracking-tight">
                Ready to explore math engagement?
              </h2>
              <p className="mt-4 text-white/60 max-w-xl mx-auto leading-relaxed">
                Reach out to learn how Mathitude can help your student discover
                the joy of mathematics.
              </p>
              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-white text-black hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
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
