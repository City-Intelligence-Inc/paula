import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

const tutors = [
  {
    name: "Paula Hamilton",
    role: "Founder & Lead Tutor",
    photo: "/paula.avif",
    quote:
      "Anyone can do math. More importantly, anyone can love math.",
    bio: "Ph.D. coursework at UCLA. Former risk manager at Wells Fargo and RAND researcher. 13+ years building mathematical confidence in K–12 students across the Bay Area.",
    href: "/#about",
  },
];

const supporting = [
  {
    name: "Alex Rivera",
    initials: "AR",
    role: "Math Tutor, Grades 6–12",
    quote:
      "I love the moment when a student suddenly sees why the pattern works — not just that it does.",
  },
  {
    name: "Jordan Lee",
    initials: "JL",
    role: "Elementary & Middle School Tutor",
    quote:
      "Young students are naturally curious. My job is to keep that curiosity alive.",
  },
  {
    name: "Morgan Patel",
    initials: "MP",
    role: "Test Prep & Academic Tutor",
    quote:
      "Confidence on an exam starts with understanding — not memorization.",
  },
];

const colors = [
  "bg-[#7030A0] text-white",
  "bg-[#2AB5B2] text-white",
  "bg-neutral-800 text-white",
];

export default function TeamPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        {/* Hero */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12 md:pb-16 text-center">
            <p
              className="text-5xl md:text-6xl lg:text-7xl text-[#7030A0] tracking-tight leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Meet Our Team
            </p>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed max-w-xl mx-auto">
              Every Mathitude tutor brings the same conviction: math is an
              attitude, and the right teacher changes everything.
            </p>
          </div>
        </section>

        {/* Featured — Paula */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
            {tutors.map((t) => (
              <div
                key={t.name}
                className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-10 lg:gap-16 items-start rounded-3xl bg-[#EFEBE5] ring-1 ring-black/[0.06] p-8 sm:p-12"
              >
                {/* Photo */}
                <div className="relative aspect-[4/5] max-w-[320px] mx-auto lg:mx-0 rounded-2xl overflow-hidden bg-neutral-200">
                  <Image
                    src={t.photo}
                    alt={t.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Copy */}
                <div className="flex flex-col justify-center">
                  <p
                    className="text-3xl sm:text-4xl text-[#7030A0] leading-tight mb-1"
                    style={{ fontFamily: "var(--font-original-surfer)" }}
                  >
                    {t.name}
                  </p>
                  <p className="text-sm font-medium uppercase tracking-widest text-[#6b6f76] mb-6">
                    {t.role}
                  </p>
                  <blockquote className="text-xl sm:text-2xl text-black font-light leading-[1.3] italic mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <p className="text-base text-[#6b6f76] leading-relaxed mb-8">
                    {t.bio}
                  </p>
                  <Link
                    href={t.href}
                    className="self-start inline-flex items-center justify-center bg-[#7030A0] text-white hover:bg-[#5d288a] rounded-full px-8 py-3.5 text-sm font-medium uppercase tracking-wide transition-colors min-h-[48px] shadow-sm hover:shadow-md"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Supporting tutors grid */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-32">
            <h2 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight mb-10">
              Our tutors
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {supporting.map((t, i) => (
                <div
                  key={t.name}
                  className="flex flex-col rounded-2xl bg-white ring-1 ring-black/[0.08] p-7 hover:shadow-md transition-shadow"
                >
                  {/* Avatar */}
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold mb-5 select-none ${colors[i % colors.length]}`}
                  >
                    {t.initials}
                  </div>

                  <p className="text-lg font-semibold text-black tracking-tight">
                    {t.name}
                  </p>
                  <p className="text-sm text-[#6b6f76] mt-0.5 mb-4">{t.role}</p>

                  <blockquote className="text-base text-black leading-relaxed italic mt-auto">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — join the team */}
        <section className="bg-neutral-950">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              Join the Mathitude team
            </h2>
            <p className="mt-4 text-white/70 leading-relaxed max-w-md mx-auto">
              Passionate about math and working with young learners? We'd love
              to hear from you.
            </p>
            <div className="mt-10">
              <Link
                href="/contact?subject=tutor-application"
                className="inline-flex items-center justify-center rounded-full bg-white text-neutral-900 hover:bg-neutral-100 font-medium uppercase tracking-wide text-sm px-8 py-3.5 min-w-[200px] min-h-[48px] transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
