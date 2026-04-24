import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

export default function GroupCampsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-white animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <p className="text-sm uppercase tracking-[0.18em] text-neutral-400 text-center mb-6">
              <Link
                href="/tutoring"
                className="hover:text-neutral-600 transition-colors"
              >
                Tutoring &amp; Groups
              </Link>{" "}
              / Group Camps
            </p>
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-[#7030A0] tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Private Group Math Camps
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              Gather a small group of students for a focused, fun week of
              mathematical exploration — customized around the group&apos;s
              interests and grade level.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-[#7030A0] text-white hover:bg-[#5d288a] font-medium text-base px-8 py-3.5 transition-colors shadow-sm hover:shadow-md"
              >
                Request a consultation
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <div className="space-y-0 divide-y divide-neutral-200">
              <div className="py-10 first:pt-0">
                <h2 className="text-lg font-medium text-black">
                  Summer &amp; school breaks
                </h2>
                <p className="mt-2 text-black leading-relaxed">
                  Group camps run during summer and school breaks — the
                  perfect setting for a deep, week-long dive into mathematical
                  thinking without the pressure of the school year calendar.
                </p>
              </div>

              <div className="py-10">
                <h2 className="text-lg font-medium text-black">
                  Small, hand-picked groups
                </h2>
                <p className="mt-2 text-black leading-relaxed">
                  Camps are private, meaning you bring the group — classmates,
                  siblings, neighborhood friends, or homeschool co-op. Paula
                  works with families to keep group sizes small so every
                  student gets individual attention alongside the social
                  benefits of a cohort.
                </p>
              </div>

              <div className="py-10">
                <h2 className="text-lg font-medium text-black">
                  Tailored to the group
                </h2>
                <p className="mt-2 text-black leading-relaxed">
                  Each camp is customized around the grade level and interests
                  of the students. Whether the group wants to explore number
                  theory, geometry, logic puzzles, or a problem-solving
                  curriculum, Paula designs the week around what will spark
                  engagement.
                </p>
              </div>

              <div className="py-10">
                <h2 className="text-lg font-medium text-black">
                  Making math social
                </h2>
                <p className="mt-2 text-black leading-relaxed">
                  Group camps are a unique way to make math social. Students
                  learn to collaborate on problems, explain their thinking,
                  and discover that the best math often happens in
                  conversation.
                </p>
              </div>

              <div className="py-10">
                <h2 className="text-lg font-medium text-black">
                  How to book
                </h2>
                <p className="mt-2 text-black leading-relaxed">
                  Reach out with your group size, grade levels, availability,
                  and any themes or goals you have in mind. Paula will follow
                  up to design a camp that fits your group.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-neutral-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
                Looking for 1-on-1 instead?
              </h2>
              <p className="mt-4 text-black leading-relaxed max-w-xl mx-auto">
                Mathitude also offers private tutoring in Menlo Park and
                online, Pre-K through college.
              </p>
              <Link
                href="/tutoring/private"
                className="mt-6 inline-flex text-sm font-medium text-black hover:text-[#7030A0] transition-colors"
              >
                See private tutoring &rarr;
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-snug tracking-tight">
                Ready to book a group camp?
              </h2>
              <p className="mt-4 text-white/60 max-w-xl mx-auto leading-relaxed">
                Tell Paula about your group and the dates you have in mind.
              </p>
              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-white text-black hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Contact Paula
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
