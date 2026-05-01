import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

const offerings = [
  {
    title: "Private tutoring",
    href: "/tutoring/private",
    offering: "private-tutoring",
    description:
      "One-on-one math tutoring in Menlo Park and virtually — Pre-K through college. Mathitude brings warmth and rigor to every session, whether the goal is enrichment or academic support.",
  },
  {
    title: "Small group engagement",
    href: "/tutoring/camps",
    offering: "small-group",
    description:
      "Gather a small group — siblings, neighborhood friends, a homeschool co-op — for a focused week (or recurring sessions) of hands-on mathematical exploration tailored to the group.",
  },
  {
    title: "Parent advisories",
    href: "/contact?offering=parent-advisories",
    offering: "parent-advisories",
    description:
      "Individual or group conversations for parents who want to think through their student's math journey — placement decisions, what to do about a specific struggle, or how to keep an enthusiastic learner engaged.",
  },
  {
    title: "Speaking engagements",
    href: "/contact?offering=speaking",
    offering: "speaking",
    description:
      "Talks for parent groups, school communities, and conferences on math attitude, growth mindset, and what actually moves the needle for a curious learner.",
  },
  {
    title: "School STEM workshops",
    href: "/contact?offering=school-stem",
    offering: "school-stem",
    description:
      "Hands-on math workshops brought directly to your school. Mathitude works with classroom teachers to design sessions that fit your students and curriculum.",
  },
  {
    title: "Math festival advisories",
    href: "/contact?offering=math-festival",
    offering: "math-festival",
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
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-[#7030A0] tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Math Engagement with Mathitude
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              Six ways to work with Mathitude — choose the path that fits your
              student, your family, or your school.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-[#7030A0] text-white hover:bg-[#5d288a] font-medium text-base px-8 py-3.5 transition-colors shadow-sm hover:shadow-md"
              >
                Request a consultation
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-32">
            <div className="space-y-0 divide-y divide-neutral-200">
              {offerings.map((o) => (
                <div
                  key={o.title}
                  className="grid sm:grid-cols-[1fr_auto] gap-6 items-start py-10 first:pt-0"
                >
                  <div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
                      {o.title}
                    </h2>
                    <p className="mt-3 text-black leading-relaxed text-base">
                      {o.description}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                      <Link
                        href={o.href}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-black hover:text-[#7030A0] transition-colors"
                      >
                        Learn more
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/contact?offering=${o.offering}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7030A0] hover:text-[#5d288a] transition-colors"
                      >
                        Request a consultation
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
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
              <p className="mt-4 text-white/60 max-w-xl mx-auto leading-relaxed">
                Reach out and Mathitude will help you figure out the right path
                for your student, family, or school.
              </p>
              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-white text-neutral-900 hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
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
