import Link from "next/link";
import Image from "next/image";

const SYMBOLS = [
  { text: "π",  left: "6%",   top: "22%", size: "2.2rem", delay: "0s",  dur: "22s", opacity: "0.09" },
  { text: "+",  left: "13%",  top: "62%", size: "2.8rem", delay: "4s",  dur: "18s", opacity: "0.07" },
  { text: "√",  left: "80%",  top: "15%", size: "2.6rem", delay: "8s",  dur: "20s", opacity: "0.08" },
  { text: "∞",  left: "89%",  top: "58%", size: "2.0rem", delay: "2s",  dur: "25s", opacity: "0.08" },
  { text: "Σ",  left: "94%",  top: "32%", size: "2.3rem", delay: "11s", dur: "17s", opacity: "0.07" },
  { text: "×",  left: "3%",   top: "72%", size: "1.9rem", delay: "14s", dur: "21s", opacity: "0.07" },
  { text: "=",  left: "55%",  top: "6%",  size: "2.4rem", delay: "6s",  dur: "19s", opacity: "0.07" },
  { text: "42", left: "73%",  top: "78%", size: "1.7rem", delay: "3s",  dur: "24s", opacity: "0.07" },
  { text: "∫",  left: "31%",  top: "85%", size: "2.1rem", delay: "9s",  dur: "22s", opacity: "0.07" },
  { text: "÷",  left: "47%",  top: "4%",  size: "2.0rem", delay: "16s", dur: "20s", opacity: "0.08" },
];

const PHOTOS = [
  {
    src: "/photos/bucky_avni1.jpg",
    alt: "Student building a bucky ball in a hands-on math activity",
    offset: "-translate-y-4",
    rotate: "-rotate-[1.5deg]",
  },
  {
    src: "/photos/bucky_raife_cara3.jpg",
    alt: "Two students mid-jump in a hands-on math activity",
    offset: "translate-y-3",
    rotate: "rotate-[1deg]",
  },
  {
    src: "/photos/bucky_paxton2.jpg",
    alt: "Student creating geometric shapes",
    offset: "-translate-y-2",
    rotate: "-rotate-[0.5deg]",
  },
  {
    src: "/photos/bucky_theo1.jpg",
    alt: "Student engaged in hands-on math learning",
    offset: "translate-y-5",
    rotate: "rotate-[2deg]",
  },
];

export function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Floating math symbols */}
      {SYMBOLS.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="math-symbol"
          style={{
            left: s.left,
            top: s.top,
            fontSize: s.size,
            "--symbol-delay": s.delay,
            "--symbol-duration": s.dur,
            "--symbol-opacity": s.opacity,
            fontFamily: "var(--font-original-surfer), Georgia, serif",
          } as React.CSSProperties}
        >
          {s.text}
        </span>
      ))}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-12 relative">

        {/* Top — headline + copy */}
        <div className="text-center max-w-4xl mx-auto stagger-in">
          <h1
            className="text-6xl md:text-7xl lg:text-8xl text-black leading-[1.02]"
            style={{ fontFamily: "var(--font-original-surfer)", letterSpacing: "-0.02em", textWrap: "balance" }}
          >
            At <span className="text-[#7030A0]">Mathitude</span> it&apos;s all about the{" "}
            <span className="text-[#7030A0]">attitude</span>
          </h1>

          <p className="mt-8 text-xl md:text-2xl text-black max-w-2xl mx-auto leading-relaxed font-light">
            K-12 math enrichment, tutoring, and engagement books that foster big mathematical thinking through fun, collaborative learning.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#6b6f76]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6b6f76]/50" />
              Pre-K to College
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6b6f76]/50" />
              Menlo Park &amp; Virtual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6b6f76]/50" />
              Since 2013
            </span>
          </div>

          <div className="mt-8">
            <Link
              href="/tutoring"
              data-guide="consult"
              className="inline-flex items-center justify-center bg-[#7030A0] text-white hover:bg-[#5d288a] rounded-full px-10 py-4 text-base font-medium uppercase tracking-wide transition-colors min-w-[220px] min-h-[54px] shadow-sm hover:shadow-md"
            >
              Learn More &rarr;
            </Link>
          </div>
        </div>

        {/* Bottom — photo row */}
        <div className="mt-14 md:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-end">
          {PHOTOS.map((photo) => (
            <div
              key={photo.src}
              className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-100 ${photo.offset} ${photo.rotate} shadow-md hover:shadow-xl hover:scale-[1.02] hover:-rotate-0 transition-all duration-300`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 25vw"
                priority
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
