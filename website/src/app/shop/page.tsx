import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

const AMAZON_STORE =
  "https://www.amazon.com/stores/Paula-Hamilton/author/B07SJ8TZ56";

const collections = [
  {
    heading: "Elementary Editions",
    tagline:
      "Designed for younger learners. Builds number sense, pattern recognition, and problem-solving through fun, engaging activities.",
    gradeRange: "Grades K–5",
    books: [
      {
        title: "Incoming 2nd Grade Math",
        cover: "/books/elementary-2nd.jpg",
      },
      {
        title: "Incoming 3rd Grade Math",
        cover: "/books/elementary-3rd.jpg",
      },
      {
        title: "Incoming 4th Grade Math",
        cover: "/books/elementary-4th.jpg",
      },
      {
        title: "Incoming 5th Grade Math",
        cover: "/books/elementary-5th.jpg",
      },
    ],
  },
  {
    heading: "Middle School Editions",
    tagline:
      "For middle-school students ready to deepen their mathematical thinking. Multi-step problems, algebraic reasoning, and mathematical connections that go beyond the classroom.",
    gradeRange: "Grades 5–8",
    books: [
      {
        title: "Incoming 6th Grade Math",
        cover: "/books/middle-6th.jpg",
      },
      {
        title: "Incoming Pre-Algebra Math",
        cover: "/books/middle-pre-algebra.jpg",
      },
      {
        title: "Incoming Algebra Math",
        cover: "/books/middle-algebra.jpg",
      },
      {
        title: "Middle School Math",
        cover: "/books/middle-school.jpg",
      },
    ],
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
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-[#7030A0] tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Shop Books
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              Mathitude&apos;s signature math engagement workbooks — deep math
              mastery paired with fun, exciting presentation. Available on
              Amazon.
            </p>
          </div>
        </section>

        {/* Book collections */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-32 space-y-24">
            {collections.map((collection) => (
              <div key={collection.heading}>
                <div className="mb-10 max-w-2xl">
                  <p className="text-xs font-medium tracking-[0.22em] text-[#7030A0] uppercase mb-3">
                    {collection.gradeRange}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-semibold text-black tracking-tight">
                    {collection.heading}
                  </h2>
                  <p className="mt-4 text-base md:text-lg text-black leading-relaxed">
                    {collection.tagline}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8">
                  {collection.books.map((book) => (
                    <a
                      key={book.title}
                      href={AMAZON_STORE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="relative aspect-[386/500] overflow-hidden rounded-md bg-neutral-100 shadow-sm group-hover:shadow-lg transition-shadow">
                        <Image
                          src={book.cover}
                          alt={`${book.title} cover`}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                      <p className="mt-3 text-sm font-medium text-black leading-snug">
                        {book.title}
                      </p>
                      <p className="mt-1 text-xs text-[#7030A0] group-hover:text-[#5d288a] transition-colors">
                        Order on Amazon &rarr;
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Amazon store link */}
        <section className="bg-neutral-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="text-center">
              <p className="text-black leading-relaxed">
                All books are available on Amazon. Visit Mathitude&apos;s author
                page to see the full collection.
              </p>
              <a
                href={AMAZON_STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-[#7030A0] text-white hover:bg-[#5d288a] font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
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
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-snug tracking-tight">
                Want personalized guidance?
              </h2>
              <p className="mt-4 text-white/70 max-w-xl mx-auto leading-relaxed">
                Mathitude can recommend the right workbook for your student and
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
