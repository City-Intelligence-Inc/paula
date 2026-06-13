import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

// 6/8 + 6/10 Sara: private tutoring is the core offer, so it leads with its
// own highlighted section + image. The remaining offerings sit in a flatter
// "more ways" list, and only Small group keeps a More… link (it's the only
// other offering with a dedicated page). Everything else funnels to the
// single consultation CTA so a new client isn't overwhelmed with choices.
const featured = {
  title: "Private tutoring",
  href: "/tutoring/private",
  image: "/photos/bucky_oliver1.jpg",
  description:
    "One-on-one math tutoring in downtown Menlo Park and virtually — Pre-K through college. Mathitude brings warmth and rigor to every session, built around your student, whether the goal is enrichment or academic support.",
};

const moreOfferings = [
  {
    title: "Small group engagement",
    href: "/tutoring/camps",
    description:
      "Gather a small group — siblings, neighborhood friends, a homeschool co-op — for a focused 8–12 week run of hands-on mathematical exploration tailored to the group.",
  },
  {
    title: "Parent advisories",
    description:
      "Individual or group conversations for parents who want to think through their student's math journey — placement decisions, what to do about a specific struggle, or how to keep an enthusiastic learner engaged.",
  },
  {
    title: "Speaking engagements",
    description:
      "Talks for parent groups, school communities, and conferences on math attitude, growth mindset, and what actually moves the needle for a curious learner.",
  },
  {
    title: "School STEM workshops",
    description:
      "Mathitude brings an array of hands-on math engagement experiences directly to your school — designed to excite your students.",
  },
  {
    title: "Math festival advisories",
    description:
      "Help planning, programming, and running a math festival or community math event — drawing on years of work with the Julia Robinson Mathematics Festival and other Bay Area events.",
  },
];

export default function TutoringHubPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-white animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12 md:pb-16">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-[#7030A0] tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Math Engagement with Mathitude
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              Private tutoring is our core offer — explore it below, alongside
              more ways to work with Mathitude.
            </p>
          </div>
        </section>

        {/* Featured — private tutoring, highlighted with image */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-24">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center rounded-3xl bg-[#EFEBE5] ring-1 ring-black/[0.06] p-6 sm:p-10">
              <div className="relative aspect-[5/4] rounded-2xl overflow-hidden bg-neutral-100">
                <Image
                  src={featured.image}
                  alt="A Mathitude private tutoring session"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              <div>
                <p className="text-xs font-medium tracking-[0.22em] text-[#7030A0] uppercase mb-4">
                  Our core offer
                </p>
                <h2 className="text-3xl sm:text-4xl font-semibold text-black tracking-tight">
                  {featured.title}
                </h2>
                <p className="mt-5 text-lg text-black leading-relaxed">
                  {featured.description}{" "}
                  <Link
                    href={featured.href}
                    className="text-[#7030A0] hover:text-[#5d288a] font-medium whitespace-nowrap"
                  >
                    More&hellip;
                  </Link>
                </p>
                <Link
                  href="/contact?offering=private-tutoring"
                  className="mt-7 inline-flex items-center justify-center bg-[#7030A0] text-white hover:bg-[#5d288a] rounded-full px-8 py-3.5 text-sm font-medium uppercase tracking-wide transition-colors min-h-[48px] shadow-sm hover:shadow-md"
                >
                  Request a Consultation
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* More ways to work with Mathitude */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-32">
            <h2 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight mb-2">
              More ways to work with Mathitude
            </h2>
            <p className="text-base text-[#6b6f76] mb-6">
              All of our services — choose the path that fits your student, your
              family, or your school.
            </p>
            <div className="space-y-0 divide-y divide-neutral-200">
              {moreOfferings.map((o) => (
                <div key={o.title} className="py-8 first:pt-2">
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
                    {o.href ? (
                      <Link
                        href={o.href}
                        className="text-[#7030A0] hover:text-[#5d288a] transition-colors"
                      >
                        {o.title}
                      </Link>
                    ) : (
                      <span className="text-black">{o.title}</span>
                    )}
                  </h3>
                  <p className="mt-3 text-black leading-relaxed text-base">
                    {o.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-snug tracking-tight">
                Not sure which fits?
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                Reach out and Mathitude will help you figure out the right path
                for your student, family, or school.
              </p>
              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full bg-white text-neutral-900 hover:bg-neutral-100 font-medium uppercase tracking-wide text-sm px-8 py-3.5 min-w-[200px] min-h-[48px] transition-colors"
                >
                  Request a Consultation
                  <ArrowRight className="ml-2 w-4 h-4" />
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
