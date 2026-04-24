import Link from "next/link";

export function InfoBar() {
  return (
    <section className="bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid sm:grid-cols-3 gap-10 sm:gap-12">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-[#7030A0] uppercase mb-3">
              Visit
            </p>
            <p className="text-base text-black font-medium">
              Menlo Park, California
            </p>
            <p className="mt-1 text-sm text-[#8b8589]">
              In-person sessions, plus virtual anywhere in the US.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-[#7030A0] uppercase mb-3">
              Hours
            </p>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[#8b8589]">Mon&ndash;Fri</dt>
                <dd className="text-black tabular-nums">9:00&nbsp;am &ndash; 7:00&nbsp;pm</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#8b8589]">Saturday</dt>
                <dd className="text-black tabular-nums">10:00&nbsp;am &ndash; 4:00&nbsp;pm</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#8b8589]">Sunday</dt>
                <dd className="text-[#8b8589]">Closed</dd>
              </div>
            </dl>
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-[#7030A0] uppercase mb-3">
              Start
            </p>
            <p className="text-base text-black leading-relaxed">
              Every student is different, and we&apos;d love to meet yours.
            </p>
            <Link
              href="/contact"
              className="mt-3 inline-flex items-center text-sm font-medium text-[#7030A0] hover:text-[#5d288a] transition-colors min-h-[44px]"
            >
              Request a free consultation &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
