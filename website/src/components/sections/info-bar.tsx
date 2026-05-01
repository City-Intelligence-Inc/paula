import Link from "next/link";

export function InfoBar() {
  return (
    <section className="bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid sm:grid-cols-2 gap-10 sm:gap-12">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-[#7030A0] uppercase mb-3">
              Visit
            </p>
            <p className="text-base text-black font-medium">
              770 Menlove Suite 200A
            </p>
            <p className="text-base text-black">Menlo Park, California</p>
            <p className="mt-1 text-sm text-[#8b8589]">
              In-person sessions, plus virtual anywhere in the US.
            </p>
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
