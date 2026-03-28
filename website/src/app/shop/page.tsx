import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

const books = [
  {
    title: "Mathitude Engagement Workbook: Elementary Edition",
    description:
      "Designed for younger learners, this workbook integrates foundational math skills with fun, engaging activities. Students build number sense, explore patterns, and develop problem-solving strategies — all while having a great time. Perfect for students in grades K through 5.",
    url: "https://www.amazon.com/stores/Paula-Hamilton/author/B07SJ8TZ56",
  },
  {
    title: "Mathitude Engagement Workbook: Middle Grade Edition",
    description:
      "Built for middle-grade students ready to deepen their mathematical thinking. This workbook challenges learners with multi-step problems, algebraic reasoning, and mathematical connections that go beyond the classroom. Ideal for grades 5 through 8.",
    url: "https://www.amazon.com/stores/Paula-Hamilton/author/B07SJ8TZ56",
  },
  {
    title: "Swamp Puzzles Collection",
    description:
      "A collection of Paula's signature swamp puzzles — creative, strategic challenges that build logical thinking and perseverance. These puzzles are favorites at math festivals and in Mathitude tutoring sessions. Great for all ages.",
    url: "https://www.amazon.com/stores/Paula-Hamilton/author/B07SJ8TZ56",
  },
];

export default function ShopPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif italic font-medium text-neutral-900 tracking-tight text-center">
              Shop Books
            </h1>
            <p className="mt-6 text-lg md:text-xl text-neutral-500 leading-relaxed text-center max-w-2xl mx-auto">
              Paula&apos;s signature math engagement workbooks — designed to
              combine deep math mastery with fun, exciting presentation.
            </p>
          </div>
        </section>

        {/* Book list */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <div className="space-y-0 divide-y divide-neutral-200">
              {books.map((book) => (
                <div key={book.title} className="py-10 first:pt-0">
                  <h2 className="text-xl md:text-2xl font-serif italic font-medium text-neutral-900 tracking-tight">
                    {book.title}
                  </h2>
                  <p className="mt-3 text-neutral-600 leading-relaxed">
                    {book.description}
                  </p>
                  <a
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex text-sm font-medium text-neutral-900 hover:text-mathitude-purple transition-colors"
                  >
                    View on Amazon &rarr;
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Amazon store link */}
        <section className="bg-neutral-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="text-center">
              <p className="text-neutral-500 leading-relaxed">
                All books are available on Amazon. Visit Paula&apos;s author
                page to see the full collection.
              </p>
              <a
                href="https://www.amazon.com/stores/Paula-Hamilton/author/B07SJ8TZ56"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-neutral-900 text-white hover:bg-neutral-800 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
              >
                Visit Amazon Store
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif italic text-white leading-snug tracking-tight">
                Want personalized guidance?
              </h2>
              <p className="mt-4 text-white/60 max-w-xl mx-auto leading-relaxed">
                Paula can recommend the right workbook for your student and
                pair it with tutoring for maximum impact.
              </p>
              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-white text-neutral-900 hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Request a Consultation
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
