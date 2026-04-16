import Image from "next/image";

export function AboutPaula() {
  return (
    <section className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-start">

          {/* Left — photo + credentials */}
          <div className="space-y-6">
            <div className="w-full aspect-[3/4] max-w-xs rounded-xl overflow-hidden bg-neutral-100">
              <Image
                src="/paula.avif"
                alt="Paula Hamilton, founder of Mathitude"
                width={400}
                height={533}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            <div className="space-y-2 text-sm text-neutral-500">
              <p>M.A. in Applied Economics</p>
              <p>Double major in Math &amp; Economics</p>
              <p>Former analyst, Wells Fargo &amp; RAND</p>
              <p>Certified Mindfulness Mentor</p>
            </div>
          </div>

          {/* Right — bio */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium tracking-widest text-neutral-400 uppercase mb-4">
                About Paula
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight">
                Math enrichment for everyone — from Pre-K to college.
              </h2>
            </div>

            <p className="text-lg text-neutral-700 leading-relaxed">
              Paula founded Mathitude in 2013 with one belief: not only can anyone do
              math, anyone can love it. Her approach integrates deep mastery with
              genuine engagement — no rote drilling, no anxiety, just curiosity and
              collaboration.
            </p>

            <div className="space-y-4 text-neutral-600 leading-relaxed">
              <p>
                Before Mathitude, Paula worked as a risk manager at Wells Fargo and
                Bank of Hawaii, then as an economic researcher at RAND while completing
                Ph.D. coursework at UCLA. That background shapes how she coaches —
                rigorous, patient, and rooted in real-world application.
              </p>
              <p>
                Today she works one-on-one and in small groups with students of all
                ages, runs group camps during school breaks, and brings hands-on math
                activities to schools and festivals across the Bay Area. She has also
                published a suite of math engagement workbooks for elementary and
                middle-grade students.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
