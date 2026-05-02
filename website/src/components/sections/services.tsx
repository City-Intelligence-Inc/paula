import Link from "next/link";
import { ArrowRight } from "lucide-react";

const offerings = [
  {
    number: "01",
    title: "Private tutoring",
    description:
      "One-on-one math tutoring in Menlo Park or virtually — Pre-K through college. Warmth and rigor in every session.",
    learnMoreHref: "/tutoring/private",
    contactHref: "/contact?offering=private-tutoring",
  },
  {
    number: "02",
    title: "Small group engagement",
    description:
      "Siblings, neighborhood friends, or a homeschool co-op gathered for a focused week of hands-on math.",
    learnMoreHref: "/tutoring/camps",
    contactHref: "/contact?offering=small-group",
  },
  {
    number: "03",
    title: "Parent advisories",
    description:
      "Individual or group conversations for parents thinking through a placement, a struggle, or an enthusiastic learner.",
    learnMoreHref: "/contact?offering=parent-advisories",
    contactHref: "/contact?offering=parent-advisories",
  },
  {
    number: "04",
    title: "Speaking engagements",
    description:
      "Talks for parent groups, schools, and conferences on math attitude, growth mindset, and what actually works.",
    learnMoreHref: "/contact?offering=speaking",
    contactHref: "/contact?offering=speaking",
  },
  {
    number: "05",
    title: "School STEM workshops",
    description:
      "Hands-on math workshops brought directly to your school, designed with classroom teachers around your curriculum.",
    learnMoreHref: "/contact?offering=school-stem",
    contactHref: "/contact?offering=school-stem",
  },
  {
    number: "06",
    title: "Math festival advisories",
    description:
      "Help planning, programming, and running a math festival — drawing on years with the Julia Robinson Mathematics Festival.",
    learnMoreHref: "/contact?offering=math-festival",
    contactHref: "/contact?offering=math-festival",
  },
];

export function Services() {
  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="mb-16 sm:mb-20 max-w-3xl">
          <p className="text-xs font-medium tracking-[0.22em] text-[#7030A0] uppercase mb-5">
            How we work
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-black tracking-tight leading-[1.05]">
            Six ways to bring Mathitude to your student, family, or school.
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-black leading-relaxed">
            Every situation is different. Mathitude meets students, parents, and
            schools where they are, then crafts an approach that fits.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-0 md:gap-y-2 divide-y md:divide-y-0 divide-neutral-200">
          {offerings.map((offering, idx) => (
            <div
              key={offering.title}
              className={`grid grid-cols-[56px_1fr] sm:grid-cols-[72px_1fr] gap-x-5 py-8 sm:py-10 ${
                idx >= 2 ? "md:border-t md:border-neutral-200 md:pt-12" : ""
              }`}
            >
              <span className="text-3xl sm:text-4xl text-[#7030A0]/35 leading-none select-none font-semibold tabular-nums pt-1">
                {offering.number}
              </span>
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
                  {offering.title}
                </h3>
                <p className="mt-3 text-base text-black leading-relaxed">
                  {offering.description}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                  <Link
                    href={offering.contactHref}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7030A0] hover:text-[#5d288a] transition-colors min-h-[44px]"
                  >
                    Request a consultation
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={offering.learnMoreHref}
                    className="inline-flex items-center text-sm text-[#8b8589] hover:text-black transition-colors min-h-[44px]"
                  >
                    Learn more
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 sm:mt-20 flex flex-col sm:flex-row items-center gap-6 border-t border-neutral-200 pt-12">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-lg sm:text-xl text-black leading-relaxed">
              Not sure which fits? Mathitude will help you figure it out.
            </p>
            <p className="mt-1 text-sm text-[#8b8589]">
              No commitment. Just a conversation about what you&apos;re hoping
              for.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-[#7030A0] text-white hover:bg-[#5d288a] font-medium text-base px-9 py-4 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
          >
            Request a free consultation
          </Link>
        </div>
      </div>
    </section>
  );
}
