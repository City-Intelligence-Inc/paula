import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

export default function PrivateTutoringPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-white animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <p className="text-sm uppercase tracking-[0.18em] text-neutral-400 text-center mb-6">
              <Link
                href="/tutoring"
                className="hover:text-neutral-600 transition-colors"
              >
                Tutoring &amp; Groups
              </Link>{" "}
              / Private Tutoring
            </p>
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-[#7030A0] tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Private Math Tutoring in Menlo Park
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              Our goal is lifetime math engagement for all, and we love helping
              students develop their superpowers as mathematicians.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-[#7030A0] text-white hover:bg-[#5d288a] font-medium text-base px-8 py-3.5 transition-colors shadow-sm hover:shadow-md"
              >
                Request a consultation
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <div className="space-y-0 divide-y divide-neutral-200">
              <div className="py-10 first:pt-0">
                <h2 className="text-lg font-medium text-black">
                  In-person &amp; virtual
                </h2>
                <p className="mt-2 text-black leading-relaxed">
                  Sessions are available in-person at our professional building
                  in Menlo Park (one block from Trader Joe&apos;s) and
                  virtually for families anywhere. Whether your student thrives
                  face-to-face or prefers the convenience of online learning,
                  Mathitude brings the same warmth and rigor to every session.
                </p>
              </div>

              <div className="py-10">
                <h2 className="text-lg font-medium text-black">
                  Solo &amp; small group
                </h2>
                <p className="mt-2 text-black leading-relaxed">
                  Individual sessions offer focused, personalized coaching
                  tailored to your student&apos;s needs. Small group sessions
                  bring the added dimension of collaborative problem-solving,
                  where students learn from each other and build mathematical
                  confidence together.
                </p>
              </div>

              <div className="py-10">
                <h2 className="text-lg font-medium text-black">
                  Pre-K through college
                </h2>
                <p className="mt-2 text-black leading-relaxed">
                  Mathitude enjoys working with learners at every stage — from
                  young children building number sense for the first time to
                  college students deepening their mathematical reasoning. Each
                  student&apos;s journey is unique, and Mathitude meets them
                  exactly where they are.
                </p>
              </div>

              <div className="py-10">
                <h2 className="text-lg font-medium text-black">
                  Enrichment &amp; academic support
                </h2>
                <p className="mt-2 text-black leading-relaxed">
                  About 60% of Mathitude&apos;s tutoring work is enrichment —
                  exploring curiosity, building deep thinking, and developing
                  mathematical superpowers. The remaining 40% is academic
                  support: strengthening foundational skills, building
                  confidence, and helping students succeed in their coursework.
                </p>
              </div>

              <div className="py-10">
                <h2 className="text-lg font-medium text-black">
                  Waitlist
                </h2>
                <p className="mt-2 text-black leading-relaxed">
                  Due to high demand, Mathitude tutoring is currently on a
                  waitlist basis. We encourage families to reach out early to
                  secure a spot. Mathitude works closely with each family and
                  takes great care in matching students with the right format
                  and schedule.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-neutral-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
                Curious about private group camps?
              </h2>
              <p className="mt-4 text-black leading-relaxed max-w-xl mx-auto">
                Mathitude also runs private group camps during summer and
                school breaks — a different format for a different goal.
              </p>
              <Link
                href="/tutoring/camps"
                className="mt-6 inline-flex text-sm font-medium text-black hover:text-[#7030A0] transition-colors"
              >
                See group camps &rarr;
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-snug tracking-tight">
                Ready to get started?
              </h2>
              <p className="mt-4 text-white/60 max-w-xl mx-auto leading-relaxed">
                Reach out to discuss your student&apos;s goals and join the
                Mathitude waitlist.
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
