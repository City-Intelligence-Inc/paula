import Image from "next/image";

export function AboutPaula() {
  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        {/* Section opener */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <p
            className="text-4xl sm:text-5xl md:text-6xl text-[#7030A0] mb-4 leading-[1.05]"
            style={{ fontFamily: "var(--font-original-surfer)" }}
          >
            Meet Paula
          </p>
          <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight leading-[1.3] text-balance">
            Over 13 years of teaching math as attitude, not arithmetic.
          </h2>
        </div>

        {/* Photo + bio */}
        <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-10 lg:gap-16 items-start">
          <div className="relative max-w-[340px]">
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
            <p className="mt-4 text-sm text-[#6b6f76] italic">
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
          </div>
        </div>
      </div>
    </section>
  );
}
