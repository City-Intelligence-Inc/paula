export function AboutPaula() {
  return (
    <section className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-start">

          {/* Left — photo slot + credentials */}
          <div className="space-y-6">
            {/*
              TODO: Replace this placeholder with Paula's headshot.
              Recommended: 600×700px, format WebP, place in /public/paula-hamilton.webp
              Then swap the div below with:
              <Image src="/paula-hamilton.webp" alt="Paula Hamilton" width={300} height={350} className="rounded-xl w-full object-cover" />
            */}
            <div className="w-full aspect-[3/4] max-w-xs bg-gradient-to-br from-[#7030A0]/10 to-[#7030A0]/5 rounded-xl flex items-end p-6">
              <div>
                <p
                  className="text-2xl text-[#7030A0]"
                  style={{ fontFamily: "var(--font-original-surfer)" }}
                >
                  Paula Hamilton
                </p>
                <p className="text-sm text-neutral-500 mt-1">Founder, Mathitude</p>
              </div>
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
