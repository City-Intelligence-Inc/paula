import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const offerings = [
  {
    number: "01",
    title: "Private Tutoring",
    description:
      "One-on-one and small-group sessions tailored to exactly where your student is — whether they're building confidence, chasing curiosity, or preparing for a test. Paula works with learners from Pre-K through college, in-person in Menlo Park and virtually.",
    href: "/tutoring/private",
    cta: "Learn about tutoring",
    mascot: "/brand/pascals-paxton.png",
    rotate: "-rotate-3",
  },
  {
    number: "02",
    title: "Group Camps",
    description:
      "Gather a small group of students for a focused, fun week of mathematical exploration. Group camps run during summer and school breaks and are customized around the group's interests and grade level. A unique way to make math social.",
    href: "/tutoring/camps",
    cta: "Learn about group camps",
    mascot: "/brand/rubiks-boy.png",
    rotate: "rotate-2",
  },
  {
    number: "03",
    title: "Events & Festivals",
    description:
      "Paula and the Mathitude team bring hands-on math activities to schools, festivals, and community events throughout the Bay Area — including the Julia Robinson Mathematics Festival. Interested in having Mathitude at your event?",
    href: "/events",
    cta: "See upcoming events",
    mascot: "/brand/space-chips-claren.png",
    rotate: "-rotate-6",
  },
];

export function Services() {
  return (
    <section className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-mathitude-purple tracking-tight leading-[1.05]">
            How we can work together
          </h2>
          <p className="mt-5 text-lg sm:text-xl text-neutral-600 max-w-xl mx-auto leading-relaxed">
            Every student is different. Paula takes the time to understand your
            child&apos;s needs, then crafts an approach that meets them exactly
            where they are.
          </p>
        </div>

        <div className="space-y-0 divide-y divide-neutral-200 stagger-in">
          {offerings.map((offering) => (
            <div
              key={offering.title}
              className="group grid sm:grid-cols-[80px_1fr_140px] gap-6 py-12 first:pt-0 last:pb-0 items-center"
            >
              {/* Number */}
              <span
                className="text-5xl sm:text-6xl text-mathitude-purple/25 leading-none select-none"
                style={{ fontFamily: "var(--font-original-surfer)" }}
              >
                {offering.number}
              </span>

              {/* Content */}
              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  {offering.title}
                </h3>
                <p className="mt-3 text-neutral-600 leading-relaxed max-w-lg">
                  {offering.description}
                </p>
                <Link
                  href={offering.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-mathitude-purple hover:text-[#5d288a] whitespace-nowrap transition-colors group/link min-h-[44px]"
                >
                  {offering.cta}
                  <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Mascot */}
              <div className={`hidden sm:block justify-self-end ${offering.rotate} transition-transform duration-300 group-hover:scale-105`}>
                <Image
                  src={offering.mascot}
                  alt=""
                  aria-hidden="true"
                  width={280}
                  height={360}
                  className="w-28 lg:w-32 h-auto drop-shadow-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-mathitude-purple text-white hover:bg-[#5d288a] font-medium text-base px-10 py-4 transition-colors shadow-md hover:shadow-lg"
          >
            Request a Free Consultation
          </Link>
          <p className="mt-4 text-sm text-neutral-500">
            No commitment — just a conversation about your student&apos;s goals.
          </p>
        </div>
      </div>
    </section>
  );
}
