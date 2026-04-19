import Link from "next/link";
import { ArrowRight } from "lucide-react";

const offerings = [
  {
    number: "01",
    title: "Private Tutoring",
    description:
      "One-on-one and small-group sessions tailored to exactly where your student is, whether they're building confidence, chasing curiosity, or preparing for a test. Paula works with learners from Pre-K through college, in person in Menlo Park and virtually.",
    learnMoreHref: "/tutoring/private",
  },
  {
    number: "02",
    title: "Group Camps",
    description:
      "Gather a small group of students for a focused, fun week of mathematical exploration. Camps run during summer and school breaks, customized around the group's interests and grade level. A rare way to make math social.",
    learnMoreHref: "/tutoring/camps",
  },
  {
    number: "03",
    title: "Events & Festivals",
    description:
      "Paula and the Mathitude team bring hands-on math activities to schools, festivals, and community events throughout the Bay Area, including the Julia Robinson Mathematics Festival.",
    learnMoreHref: "/events",
  },
];

export function Services() {
  return (
    <section className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="mb-20 max-w-3xl">
          <p className="text-xs font-medium tracking-[0.22em] text-mathitude-purple uppercase mb-5">
            How we work
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-mathitude-purple tracking-tight leading-[1.05]">
            Three ways to bring Mathitude to your student.
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-neutral-600 leading-relaxed">
            Every student is different. Paula takes the time to understand your
            child&apos;s needs, then crafts an approach that meets them exactly
            where they are.
          </p>
        </div>

        <div className="divide-y divide-neutral-200 stagger-in">
          {offerings.map((offering) => (
            <div
              key={offering.title}
              className="grid sm:grid-cols-[96px_1fr_auto] gap-x-8 gap-y-4 py-10 sm:py-14 first:pt-0 last:pb-0 items-baseline"
            >
              <span
                className="text-5xl sm:text-6xl text-mathitude-purple/30 leading-none select-none font-semibold tabular-nums"
              >
                {offering.number}
              </span>

              <div className="max-w-2xl">
                <h3 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  {offering.title}
                </h3>
                <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed">
                  {offering.description}
                </p>
              </div>

              <div className="sm:self-center flex flex-col items-start gap-2 sm:items-end">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-mathitude-purple hover:text-[#5d288a] whitespace-nowrap transition-colors group/link min-h-[44px]"
                >
                  Request a consultation
                  <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href={offering.learnMoreHref}
                  className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 transition-colors min-h-[44px]"
                >
                  Learn more
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col sm:flex-row items-center gap-6 border-t border-neutral-200 pt-12">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-lg sm:text-xl text-neutral-800 leading-relaxed">
              Not sure which fits? Paula will help you figure it out.
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              No commitment. Just a conversation about your student&apos;s goals.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-mathitude-purple text-white hover:bg-[#5d288a] font-medium text-base px-9 py-4 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
          >
            Request a Free Consultation
          </Link>
        </div>
      </div>
    </section>
  );
}
