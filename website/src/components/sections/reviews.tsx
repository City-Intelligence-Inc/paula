const reviews = [
  {
    name: "Sarah M.",
    role: "Parent of 3rd Grader",
    text: "Paula transformed my daughter's relationship with math. She went from tears during homework to actually asking for extra problems.",
  },
  {
    name: "David L.",
    role: "Parent of 7th Grader",
    text: "The group sessions are incredible. My son loves the collaborative approach and his confidence has skyrocketed.",
  },
  {
    name: "Jennifer K.",
    role: "Parent of Twins, K & 2nd Grade",
    text: "Mathitude's workbooks are a staple in our house. The puzzles make math feel like a game, not a chore.",
  },
];

export function Reviews() {
  const [featured, ...rest] = reviews;
  return (
    <section className="bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <p className="text-xs font-medium tracking-widest text-neutral-400 uppercase text-center mb-12">
          What Parents Are Saying
        </p>

        {/* Featured quote */}
        <blockquote className="text-center mb-16">
          <p className="text-2xl sm:text-3xl font-light text-neutral-900 leading-relaxed max-w-2xl mx-auto">
            &ldquo;{featured.text}&rdquo;
          </p>
          <footer className="mt-6">
            <p className="text-sm font-semibold text-neutral-900">{featured.name}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{featured.role}</p>
          </footer>
        </blockquote>

        {/* Supporting quotes */}
        <div className="grid sm:grid-cols-2 gap-10 border-t border-neutral-200 pt-12">
          {rest.map((review) => (
            <blockquote key={review.name}>
              <p className="text-neutral-600 leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </p>
              <footer className="mt-4">
                <p className="text-sm font-semibold text-neutral-900">{review.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{review.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
