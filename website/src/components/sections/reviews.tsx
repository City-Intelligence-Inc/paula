const reviews = [
  {
    name: "Sarah M.",
    role: "Parent of 3rd grader",
    text: "Paula transformed my daughter's relationship with math. She went from tears during homework to actually asking for extra problems.",
  },
  {
    name: "David L.",
    role: "Parent of 7th grader",
    text: "The group sessions are incredible. My son loves the collaborative approach and his confidence has skyrocketed.",
  },
  {
    name: "Jennifer K.",
    role: "Parent of twins, K & 2nd grade",
    text: "Mathitude's workbooks are a staple in our house. The puzzles make math feel like a game, not a chore.",
  },
];

export function Reviews() {
  const [featured, ...rest] = reviews;

  return (
    <section className="bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="max-w-3xl mb-16 sm:mb-20">
          <p className="text-xs font-medium tracking-[0.22em] text-[#7030A0] uppercase mb-5">
            In their words
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-black tracking-tight leading-[1.05]">
            The proof is in the students.
          </h2>
        </div>

        <figure className="relative max-w-4xl">
          <span
            aria-hidden="true"
            className="absolute -top-6 -left-2 sm:-left-8 text-[140px] sm:text-[200px] leading-none text-[#7030A0]/15 select-none pointer-events-none"
            style={{ fontFamily: "var(--font-original-surfer)" }}
          >
            &ldquo;
          </span>
          <blockquote className="relative">
            <p className="text-2xl sm:text-3xl md:text-4xl text-black leading-[1.25] font-light tracking-tight">
              {featured.text}
            </p>
            <figcaption className="mt-8 flex items-center gap-3 text-sm">
              <span className="font-semibold text-black">
                {featured.name}
              </span>
              <span aria-hidden="true" className="h-px w-6 bg-[#8b8589]/40" />
              <span className="text-[#8b8589]">{featured.role}</span>
            </figcaption>
          </blockquote>
        </figure>

        <div className="mt-20 grid sm:grid-cols-2 gap-10 sm:gap-14 border-t border-neutral-200 pt-14">
          {rest.map((review) => (
            <figure key={review.name}>
              <blockquote>
                <p className="text-lg text-black leading-relaxed">
                  &ldquo;{review.text}&rdquo;
                </p>
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 text-sm">
                <span className="font-semibold text-black">
                  {review.name}
                </span>
                <span aria-hidden="true" className="h-px w-6 bg-[#8b8589]/40" />
                <span className="text-[#8b8589]">{review.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
