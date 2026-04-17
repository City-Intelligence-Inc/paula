import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

const subpages = [
  {
    title: "Private Tutoring",
    href: "/tutoring/private",
    description:
      "One-on-one and small-group math tutoring in Menlo Park and virtually — Pre-K through college. Paula brings warmth and rigor to every session, whether the goal is enrichment or academic support.",
    cta: "Learn about private tutoring",
    mascot: "/brand/pascals-paxton.png",
    rotate: "-rotate-3",
  },
  {
    title: "Group Camps",
    href: "/tutoring/camps",
    description:
      "Private group camp experiences during summer and school breaks. Gather a small group of students for a focused, fun week of mathematical exploration, customized around the group's interests and grade level.",
    cta: "Learn about group camps",
    mascot: "/brand/rubiks-boy.png",
    rotate: "rotate-3",
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
              className="text-5xl md:text-6xl lg:text-7xl tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              <span className="text-neutral-900">Tutoring </span>
              <span className="text-mathitude-purple">&amp; Groups</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-neutral-600 leading-relaxed text-center max-w-2xl mx-auto">
              Two ways to work with Paula — choose the path that fits your
              student best.
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-32">
            <div className="space-y-0 divide-y divide-neutral-200">
              {subpages.map((sub) => (
                <div
                  key={sub.href}
                  className="grid sm:grid-cols-[1fr_auto] gap-8 items-center py-12 first:pt-0"
                >
                  <div>
                    <h2
                      className="text-3xl md:text-4xl text-neutral-900 tracking-tight"
                      style={{ fontFamily: "var(--font-original-surfer)" }}
                    >
                      {sub.title}
                    </h2>
                    <p className="mt-4 text-neutral-600 leading-relaxed text-base md:text-lg">
                      {sub.description}
                    </p>
                    <Link
                      href={sub.href}
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-mathitude-purple hover:text-[#5d288a] transition-colors"
                    >
                      {sub.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div
                    aria-hidden="true"
                    className={`hidden sm:block justify-self-end ${sub.rotate}`}
                  >
                    <Image
                      src={sub.mascot}
                      alt=""
                      width={320}
                      height={420}
                      className="w-32 md:w-40 h-auto drop-shadow-md"
                    />
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
                Reach out and Paula will help you figure out the right path for
                your student.
              </p>
              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-white text-neutral-900 hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Contact Paula
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
