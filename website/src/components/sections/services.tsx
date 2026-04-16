import Link from "next/link";
import { ArrowRight } from "lucide-react";

const offerings = [
  {
    number: "01",
    title: "Private Tutoring",
    description:
      "One-on-one and small-group sessions tailored to exactly where your student is — whether they're building confidence, chasing curiosity, or preparing for a test. Paula works with learners from Pre-K through college, in-person in Menlo Park and virtually.",
    href: "/tutoring",
    cta: "Learn about tutoring",
  },
  {
    number: "02",
    title: "Group Camps",
    description:
      "Gather a small group of students for a focused, fun week of mathematical exploration. Group camps run during summer and school breaks and are customized around the group's interests and grade level. A unique way to make math social.",
    href: "/contact",
    cta: "Book a group camp",
  },
  {
    number: "03",
    title: "Events & Festivals",
    description:
      "Paula and the Mathitude team bring hands-on math activities to schools, festivals, and community events throughout the Bay Area — including the Julia Robinson Mathematics Festival. Interested in having Mathitude at your event?",
    href: "/events",
    cta: "See upcoming events",
  },
];

export function Services() {
  return (
    <section className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight">
            How we can work together
          </h2>
          <p className="mt-4 text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Every student is different. Paula takes the time to understand your
            child&apos;s needs, then crafts an approach that meets them exactly
            where they are.
          </p>
        </div>

        <div className="space-y-0 divide-y divide-neutral-200 stagger-in">
          {offerings.map((offering) => (
            <div
              key={offering.title}
              className="group grid sm:grid-cols-[80px_1fr_auto] gap-6 py-10 first:pt-0 last:pb-0 items-start"
            >
              {/* Number */}
              <span className="text-4xl font-semibold text-neutral-200 leading-none select-none">
                {offering.number}
              </span>

              {/* Content */}
              <div>
                <h3 className="text-xl font-semibold text-neutral-900">
                  {offering.title}
                </h3>
                <p className="mt-3 text-neutral-600 leading-relaxed text-sm max-w-lg">
                  {offering.description}
                </p>
              </div>

              {/* CTA */}
              <div className="sm:pt-1">
                <Link
                  href={offering.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7030A0] hover:text-[#5d288a] whitespace-nowrap transition-colors group/link min-h-[44px] py-3"
                >
                  {offering.cta}
                  <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 text-white hover:bg-neutral-800 font-medium text-sm px-8 py-3.5 transition-colors"
          >
            Request a Free Consultation
          </Link>
          <p className="mt-3 text-xs text-neutral-400">
            No commitment — just a conversation about your student&apos;s goals.
          </p>
        </div>
      </div>
    </section>
  );
}
