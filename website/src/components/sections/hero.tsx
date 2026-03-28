import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-white animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        <div className="text-center max-w-4xl mx-auto">
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-serif italic text-neutral-900 leading-[1.05] tracking-tight"
            style={{ letterSpacing: "-0.03em", textWrap: "balance" }}
          >
            At{" "}
            <span
              className="not-italic"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              <span className="text-mathitude-purple">Math</span>
              <span className="text-neutral-900">itude</span>
            </span>
            , it&apos;s all about{" "}
            <span className="text-mathitude-purple">the attitude.</span>
          </h1>

          <p className="mt-8 text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            K-12 math enrichment, tutoring, and engagement books that foster
            big mathematical thinking through fun, collaborative learning.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-neutral-900 text-white hover:bg-neutral-800 rounded-md px-8 py-3.5 text-sm font-medium transition-colors min-w-[180px]"
            >
              Browse Books
            </Link>
            <Link
              href="/tutoring"
              className="inline-flex items-center justify-center border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 rounded-md px-8 py-3.5 text-sm font-medium transition-colors min-w-[180px]"
            >
              Explore Tutoring
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
