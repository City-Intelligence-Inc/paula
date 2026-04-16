import Link from "next/link";

export function CtaBanner() {
  return (
    <section className="bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-snug tracking-tight">
            Ready to strengthen your student&apos;s math skills this fall?
          </h2>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-md bg-white text-neutral-900 hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
            >
              Browse Books
            </Link>
            <Link
              href="/tutoring"
              className="inline-flex items-center justify-center rounded-md border border-white/10 text-white hover:bg-white/10 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
            >
              Tutoring
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
