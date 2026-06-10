import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { AcademicCalendar } from "@/components/calendar/academic-calendar";
import { ACADEMIC_YEAR } from "@/lib/academic-calendar";

const CALENDAR_PDF =
  "https://websitepuzzles.s3.us-west-1.amazonaws.com/MATHITUDE_ACADEMIC_CALENDAR_2026_2027.pdf";

export const metadata: Metadata = {
  title: `Academic Calendar ${ACADEMIC_YEAR.label} — Mathitude`,
  description:
    "Mathitude's academic calendar: term dates, holiday closures, and summer schedule for the 2026–2027 year.",
};

export default function CalendarPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-white animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 md:pt-28 md:pb-12">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-[#7030A0] tracking-tight text-center leading-[1.05]"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Academic Calendar
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              Mathitude&apos;s {ACADEMIC_YEAR.label} year — term dates, holiday
              closures, and our summer schedule. Tap a month to browse, or
              switch to the week view.
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <AcademicCalendar />

            <div className="mt-10 flex flex-col items-center gap-3 border-t border-neutral-200 pt-8 sm:flex-row sm:justify-between">
              <p className="text-sm text-neutral-500">
                Prefer a printable copy? Download the official one-page PDF.
              </p>
              <a
                href={CALENDAR_PDF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:text-black"
              >
                Download PDF
              </a>
            </div>
          </div>
        </section>

        <section className="bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Questions about scheduling?
            </h2>
            <p className="mt-4 text-white/70 max-w-xl mx-auto leading-relaxed">
              Reach out and we&apos;ll help you plan tutoring around the
              calendar.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-white text-neutral-900 hover:bg-neutral-100 font-medium text-sm px-8 py-3.5 transition-colors"
              >
                Contact Mathitude
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
