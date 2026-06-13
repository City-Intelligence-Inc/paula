import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

// 6/8 Sara: each resource gets a preview image. Thumbnails are pulled from
// the existing puzzle / balloon / activity art so the page reads visually.
const interactives = [
  {
    title: "Pascal's Triangle Explorer",
    description:
      "An interactive tool for discovering the surprising patterns hidden inside Pascal's Triangle — from Fibonacci numbers to binomial coefficients and fractal geometry.",
    href: "/pascals-triangle",
    cta: "Explore now",
    image: "/brand/pascals-paxton.png",
  },
  {
    title: "Swamp Puzzles",
    description:
      "Swamp puzzles: beautiful but dangerous. Mathitude's signature strategic puzzles, designed to build logical thinking and perseverance. A favorite at math festivals and Mathitude tutoring sessions for all ages. Preview and download Levels 1, 2, and 3.",
    href: "/swamp-puzzles",
    cta: "Open Swamp Puzzles",
    image: "/swamp-puzzles/cover-level-1.jpg",
  },
  {
    title: "Sierpinski Balloons & Balloon Tetra Hats",
    description:
      "Twist balloons into a Sierpinski tetrahedron, then wear your mathematical creation home. A playful hands-on activity that turns fractals into party favorites.",
    href: "/balloons",
    cta: "See balloon activities",
    image: "/balloons/balloon-tetrahedron.jpg",
  },
  {
    title: "All Puzzles & Activities",
    description:
      "Browse Mathitude's full library of puzzles, hands-on activities, and printable challenges — organized by theme and grade level.",
    href: "/puzzles-and-activities",
    cta: "Browse library",
    image: "/photos/bucky_paxton3.jpg",
  },
  {
    title: "Academic Calendar 2026–2027",
    description:
      "Our full academic year at a glance — term dates, holiday closures, and the summer schedule. Browse by month or week, or download the printable PDF.",
    href: "/calendar",
    cta: "Open calendar",
    image: "/photos/bucky_evan1.jpg",
  },
];

// Large home-print PDF packets, hosted externally.
const printables = [
  {
    title: "Cardioid Swamp — Home-Print Packet",
    description:
      "The home-printable version of the Cardioid Swamp pamphlet Paula and Sara put together — a full puzzle & activity packet you can run off on any home printer.",
    href: "https://websitepuzzles.s3.us-west-1.amazonaws.com/PAMPHLET_CARDIOID_SWAMP_2026_v2.1_HOMEPRINT_PACKET.pdf",
    cta: "Download packet (PDF)",
  },
];

export default function FreeResourcesPage() {
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
              Free Resources
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              Interactive tools and downloadable puzzles from Mathitude —
              designed to spark curiosity and bring math to life at home and
              in the classroom.
            </p>
          </div>
        </section>

        {/* Interactives */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
              Interactive Tools
            </h2>

            <div className="mt-8 space-y-0 divide-y divide-neutral-200">
              {interactives.map((item) => (
                <div
                  key={item.title}
                  className="py-10 first:pt-0 grid sm:grid-cols-[200px_1fr] gap-6 items-start"
                >
                  <Link
                    href={item.href}
                    className="relative block aspect-[4/3] w-full rounded-xl overflow-hidden bg-neutral-100 ring-1 ring-neutral-200 hover-lift"
                  >
                    <Image
                      src={item.image}
                      alt={`${item.title} preview`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 200px"
                    />
                  </Link>
                  <div>
                    <h3 className="text-xl font-semibold">
                      <Link
                        href={item.href}
                        className="text-[#7030A0] hover:text-[#5d288a] transition-colors"
                      >
                        {item.title}
                      </Link>
                    </h3>
                    <p className="mt-3 text-black leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Printable packets */}
        <section className="bg-neutral-50 border-t border-neutral-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
            <h2 className="text-2xl md:text-3xl font-semibold text-black tracking-tight">
              Printable Packets
            </h2>
            <div className="mt-8 space-y-0 divide-y divide-neutral-200">
              {printables.map((item) => (
                <div key={item.title} className="py-10 first:pt-0">
                  <h3 className="text-xl font-semibold text-black">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-black leading-relaxed">
                    {item.description}
                  </p>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex text-sm font-medium text-[#7030A0] hover:text-[#5d288a] transition-colors"
                  >
                    {item.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-snug tracking-tight">
                Want more resources?
              </h2>
              <p className="mt-4 text-white/70 max-w-xl mx-auto leading-relaxed">
                Browse Mathitude&apos;s full collection of math engagement
                workbooks, or reach out to learn about tutoring.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-md bg-white text-neutral-900 hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Shop Books
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md border border-white/20 text-white hover:bg-white/10 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                >
                  Contact Mathitude
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
