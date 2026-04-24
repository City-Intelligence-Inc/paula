import Image from "next/image";

const credentials = [
  { label: "M.A.", detail: "Applied Economics" },
  { label: "B.A.", detail: "Math & Economics, double major" },
  { label: "10+ yrs", detail: "tutoring Pre-K through college" },
  { label: "Certified", detail: "Mindfulness Mentor" },
];

export function AboutPaula() {
  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        {/* Section opener */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <p className="text-xs font-medium tracking-[0.22em] text-[#7030A0] uppercase mb-5">
            Meet Paula
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-black tracking-tight leading-[1.05]">
            Twelve years of teaching math as attitude, not arithmetic.
          </h2>
        </div>

        {/* Photo + bio */}
        <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-10 lg:gap-16 items-start">
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 rounded-lg">
              <Image
                src="/paula.avif"
                alt="Paula Hamilton, founder of Mathitude"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                priority
              />
            </div>
            <p className="mt-4 text-sm text-[#8b8589] italic">
              Paula Hamilton, founder &amp; lead tutor
            </p>
          </div>

          <div className="space-y-8">
            <p className="text-2xl sm:text-3xl text-black leading-[1.25] font-light tracking-tight">
              &ldquo;Anyone can do math. More importantly, anyone can love math.&rdquo;
            </p>

            <div className="space-y-5 text-base sm:text-lg text-black leading-relaxed">
              <p>
                Paula founded Mathitude in 2013 with a single conviction: real
                math learning comes from curiosity, not drills. Her approach
                pairs rigorous mastery with genuine engagement, so students
                build confidence and actual problem-solving instinct at the
                same time.
              </p>
              <p>
                Before teaching, Paula worked as a risk manager at Wells Fargo
                and Bank of Hawaii, then as an economic researcher at RAND
                while completing Ph.D. coursework at UCLA. That background
                shows up in how she coaches. Patient, rigorous, rooted in how
                math actually gets used in the world.
              </p>
              <p>
                Today she works one-on-one and in small groups with students
                of every age, runs group camps during school breaks, and
                brings hands-on math activities to schools and festivals
                across the Bay Area. Her engagement workbooks for
                elementary and middle school students round out the practice.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 pt-8 border-t border-neutral-200">
              {credentials.map((c) => (
                <div key={c.label}>
                  <dt className="text-sm font-semibold text-black">
                    {c.label}
                  </dt>
                  <dd className="mt-0.5 text-sm text-[#8b8589]">
                    {c.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
