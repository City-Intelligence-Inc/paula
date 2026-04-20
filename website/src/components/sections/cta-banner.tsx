import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
        <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-10 lg:gap-16 items-end">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-white/50 uppercase mb-5">
              Ready when you are
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white tracking-tight leading-[1.05]">
              Bring Mathitude home.
            </h2>
            <p className="mt-6 text-base sm:text-lg text-white/70 leading-relaxed max-w-xl">
              Paula reads every inquiry herself. Tell her what you&apos;re
              hoping for, and she&apos;ll reply with the right next step for
              your student.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-white text-neutral-950 hover:bg-neutral-100 font-medium text-base px-9 py-4 transition-colors whitespace-nowrap"
            >
              Request a free consultation
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/tutoring"
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors min-h-[44px]"
            >
              Or start by exploring tutoring &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
