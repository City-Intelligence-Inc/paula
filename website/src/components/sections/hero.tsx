import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16 md:pb-24 relative">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">

          {/* Left — copy */}
          <div className="text-center lg:text-left">
            <h1
              className="text-6xl md:text-7xl lg:text-8xl text-[#7030A0] leading-[1.02]"
              style={{ fontFamily: "var(--font-original-surfer)", letterSpacing: "-0.02em", textWrap: "balance" }}
            >
              At Mathitude, it&apos;s all about the attitude.
            </h1>

            <p className="mt-8 text-xl md:text-2xl text-black max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
              K-12 math enrichment, tutoring, and engagement books that foster big mathematical thinking through fun, collaborative learning.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-[#8b8589]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b8589]/50" />
                Pre-K to College
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b8589]/50" />
                Menlo Park &amp; Virtual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b8589]/50" />
                Since 2013
              </span>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-[#7030A0] text-white hover:bg-[#5d288a] rounded-full px-8 py-3.5 text-sm font-medium transition-colors min-w-[200px] min-h-[48px] shadow-sm hover:shadow-md"
              >
                Request a consultation
              </Link>
              <Link
                href="/tutoring"
                className="inline-flex items-center justify-center text-neutral-700 hover:text-[#7030A0] rounded-md px-6 py-3.5 text-sm font-medium transition-colors min-h-[48px]"
              >
                See all offerings &rarr;
              </Link>
            </div>
          </div>

          {/* Right — photo collage */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-100">
                <Image
                  src="/photos/bucky_yuma1.jpg"
                  alt="Student building a colorful geometric structure"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  priority
                />
              </div>
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-100">
                <Image
                  src="/photos/bucky_emma2.jpg"
                  alt="Student exploring math with construction toys"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  priority
                />
              </div>
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-100">
                <Image
                  src="/photos/bucky_paxton2.jpg"
                  alt="Student creating geometric shapes"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-100">
                <Image
                  src="/photos/bucky_theo1.jpg"
                  alt="Student engaged in hands-on math learning"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
