import Link from "next/link";

export function CtaBanner() {
  return (
    <section className="bg-mathitude-teal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white leading-snug">
            Ready to strengthen your student&apos;s math skills this fall?
          </h2>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-md bg-white text-mathitude-teal hover:bg-mathitude-cream font-semibold text-base px-8 h-11 min-w-[180px] transition-colors"
            >
              Browse Books
            </Link>
            <Link
              href="/tutoring"
              className="inline-flex items-center justify-center rounded-md border-2 border-white text-white hover:bg-white/10 font-semibold text-base px-8 h-11 min-w-[180px] transition-colors"
            >
              Tutoring
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
