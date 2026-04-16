import { User } from "lucide-react";

export function AboutPaula() {
  return (
    <section className="bg-white animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">
          {/* Photo placeholder */}
          <div className="lg:col-span-2 flex justify-center">
            <div className="w-64 h-72 sm:w-72 sm:h-80 bg-neutral-100 rounded-xl flex items-center justify-center">
              <User className="w-20 h-20 text-neutral-300" />
            </div>
          </div>

          {/* Bio */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight">
              Meet Paula Hamilton!
            </h2>

            <p className="text-xl font-semibold text-neutral-900 leading-relaxed">
              Paula&apos;s vision of lifetime math engagement for all is at the
              heart of everything we do.
            </p>

            <div className="space-y-4 text-neutral-600 leading-relaxed">
              <p>
                When she founded Mathitude in 2013, Paula set out to pioneer
                math enrichment that fostered big mathematical thinking through
                fun presentations that appeal to learners. Rather than drilling
                students on isolated skills or calculations, Mathitude&apos;s
                signature approach instead integrates skills to combine deep
                math mastery with exciting engagement partnered with a spirit of
                collaboration. This combination reflects Paula&apos;s guiding
                belief that not only can anyone do math, but anyone can have fun
                doing math!
              </p>

              <p>
                Before Mathitude, Paula worked as a risk manager at both Wells
                Fargo and Bank of Hawaii and also at RAND as an economic
                researcher. While at RAND, Paula completed coursework and
                comprehensive exams in UCLA&apos;s Ph.D. Economics program. She
                also has an M.A. in Applied Economics and received an
                undergraduate double major in Math and Economics.
              </p>

              <p>
                Now, Paula is known for her expertise in private math coaching,
                both individually and in groups, where she can help your student
                find their inner mathematician, strengthen their math wizardry,
                or explore their curiosity about the many wonderful roles math
                plays in our world. She has also published a suite of signature
                math engagement workbooks for elementary and middle-grade
                students.
              </p>

              <p>
                Paula enjoys working with all ages of students (from pre-K to
                college) and cherishes working closely with parents as they do
                the important work of raising tomorrow&apos;s global citizens.
                Paula is a certified Mindfulness Mentor (course led by Tara
                Brach, Jack Kornfield, Sharon Shelton, et al.) and brings the
                practices of compassion and mindfulness into all aspects of her
                professional practice.
              </p>

              <p className="font-semibold text-mathitude-purple">
                Join Paula and the Mathitude team in striving towards lifetime
                math engagement for all!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
