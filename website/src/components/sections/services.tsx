import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

// 6/10 + 6/8 Sara: private tutoring is the core offer, so it leads with an
// enlarged image. The remaining offerings sit in a flatter list below — and
// only the offerings with a real "learn more" page get a More… link, so a
// new client isn't given six competing things to click. A single CTA closes
// the section.
const featured = {
  title: "Private tutoring",
  description:
    "One-on-one math tutoring in downtown Menlo Park or virtually — Pre-K through college. Warmth and rigor in every session, built around your student.",
  learnMoreHref: "/tutoring/private",
  image: "/photos/bucky_oliver1.jpg",
};

const more = [
  {
    title: "Small group engagement",
    description:
      "Siblings, neighborhood friends, or a homeschool co-op gathered for a focused 8–12 week run of hands-on math.",
    learnMoreHref: "/tutoring/camps",
  },
  {
    title: "Parent advisories",
    description:
      "Individual or group conversations for parents thinking through a placement, a struggle, or an enthusiastic learner.",
  },
  {
    title: "Speaking engagements",
    description:
      "Talks for parent groups, schools, and conferences on math attitude, growth mindset, and what actually works.",
  },
  {
    title: "School STEM workshops",
    description:
      "Hands-on math workshops brought directly to your school, designed with classroom teachers around your curriculum.",
  },
  {
    title: "Math festival advisories",
    description:
      "Help planning, programming, and running a math festival — drawing on years with the Julia Robinson Mathematics Festival.",
  },
];

export function Services() {
  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="mb-12 sm:mb-16 max-w-3xl">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-black tracking-tight leading-[1.05]">
            How we work
          </h2>
          <p className="mt-5 text-xl sm:text-2xl text-[#3f3346] leading-snug font-light tracking-tight">
            Bring expert math engagement to your student, family, or school.
          </p>
        </div>

        {/* Featured — private tutoring, enlarged with image */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="relative aspect-[5/4] rounded-2xl overflow-hidden bg-neutral-100 order-last lg:order-first">
            <Image
              src={featured.image}
              alt="A Mathitude private tutoring session"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-[#7030A0] uppercase mb-4">
              Our core offer
            </p>
            <h3 className="text-3xl sm:text-4xl font-semibold text-black tracking-tight">
              {featured.title}
            </h3>
            <p className="mt-5 text-lg text-black leading-relaxed">
              {featured.description}
            </p>
            <Link
              href={featured.learnMoreHref}
              className="mt-7 inline-flex items-center justify-center bg-[#7030A0] text-white hover:bg-[#5d288a] rounded-full px-9 py-4 text-base font-medium uppercase tracking-wide transition-colors min-h-[52px] shadow-sm hover:shadow-md"
            >
              Learn More
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* More ways to work with Mathitude */}
        <div className="mt-20 sm:mt-24">
          <h3 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight mb-8">
            More ways to work with Mathitude
          </h3>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-0 divide-y divide-neutral-200 md:divide-y-0">
            {more.map((offering, idx) => (
              <div
                key={offering.title}
                className={`py-7 sm:py-8 ${
                  idx >= 2 ? "md:border-t md:border-neutral-200 md:pt-10" : ""
                }`}
              >
                <h4 className="text-xl font-semibold text-black tracking-tight">
                  {offering.title}
                </h4>
                <p className="mt-2.5 text-base text-black leading-relaxed">
                  {offering.description}
                  {offering.learnMoreHref ? (
                    <>
                      {" "}
                      <Link
                        href={offering.learnMoreHref}
                        className="text-[#7030A0] hover:text-[#5d288a] font-medium whitespace-nowrap"
                      >
                        More&hellip;
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 sm:mt-20 flex flex-col sm:flex-row items-center gap-6 border-t border-neutral-200 pt-12">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-lg sm:text-xl text-black leading-relaxed">
              Not sure which fits? Mathitude will help you figure it out.
            </p>
            <p className="mt-1 text-sm text-[#6b6f76]">
              No commitment. Just a conversation about what you&apos;re hoping
              for.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-[#7030A0] text-white hover:bg-[#5d288a] font-medium uppercase tracking-wide text-base px-9 py-4 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
          >
            Request a Free Consultation
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
