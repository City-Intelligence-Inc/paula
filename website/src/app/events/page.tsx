import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

export default function EventsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-mathitude-purple tracking-tight text-center" style={{ fontFamily: "var(--font-original-surfer)" }}>
              Events &amp; News
            </h1>
            <p className="mt-6 text-lg md:text-xl text-neutral-500 leading-relaxed text-center max-w-2xl mx-auto">
              Math festivals, workshops, and community events where Mathitude
              brings the joy of mathematics to life.
            </p>
          </div>
        </section>

        {/* Upcoming events */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight">
              Upcoming Events
            </h2>

            <div className="mt-8 space-y-0 divide-y divide-neutral-200">
              <div className="py-8 first:pt-0">
                <p className="text-sm font-medium text-mathitude-purple">
                  May 2026
                </p>
                <h3 className="mt-1 text-lg font-medium text-neutral-900">
                  Bay Area Math Festival
                </h3>
                <p className="mt-2 text-neutral-600 leading-relaxed">
                  Join Paula and the Mathitude team at the Bay Area Math
                  Festival for a day of hands-on mathematical exploration.
                  Expect swamp puzzles, Pascal&apos;s Triangle activities, and
                  collaborative problem-solving for all ages.
                </p>
              </div>

              <div className="py-8">
                <p className="text-sm font-medium text-mathitude-purple">
                  May 2026
                </p>
                <h3 className="mt-1 text-lg font-medium text-neutral-900">
                  Nueva School STEM Fair
                </h3>
                <p className="mt-2 text-neutral-600 leading-relaxed">
                  Mathitude will be presenting at the Nueva School STEM Fair,
                  showcasing engaging math activities and enrichment resources
                  for elementary and middle-grade students.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* JRMF */}
        <section className="bg-neutral-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight">
              Julia Robinson Mathematics Festival
            </h2>
            <p className="mt-4 text-neutral-600 leading-relaxed">
              Paula is an active participant and contributor to the Julia
              Robinson Mathematics Festival (JRMF), a national program that
              inspires students to explore the richness and beauty of
              mathematics through collaborative, non-competitive problem
              solving. JRMF events bring together students, teachers, and
              mathematicians for hands-on activities that spark curiosity and
              build a lifelong love of math.
            </p>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              Mathitude&apos;s swamp puzzles and engagement activities are
              regular favorites at JRMF events throughout the Bay Area.
            </p>
            <a
              href="https://www.jrmf.org"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm font-medium text-neutral-900 hover:text-mathitude-purple transition-colors"
            >
              Learn more about JRMF &rarr;
            </a>
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight">
                Stay Updated
              </h2>
              <p className="mt-4 text-neutral-500 leading-relaxed max-w-xl mx-auto">
                Stay updated with Mathitude news, upcoming events, and new
                resources. Sign up for our newsletter to hear from Paula
                directly.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full sm:flex-1 h-11 px-4 text-sm border border-neutral-200 rounded-md bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-colors"
                  disabled
                />
                <button
                  disabled
                  className="w-full sm:w-auto h-11 px-6 text-sm font-medium bg-neutral-900 text-white rounded-md opacity-50 cursor-not-allowed"
                >
                  Subscribe
                </button>
              </div>
              <p className="mt-3 text-xs text-neutral-400">
                Newsletter signup coming soon.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-snug tracking-tight">
                Want Mathitude at your event?
              </h2>
              <p className="mt-4 text-white/60 max-w-xl mx-auto leading-relaxed">
                Paula brings engaging math activities to schools, festivals, and
                community events.
              </p>
              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-white text-neutral-900 hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Get in Touch
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
