import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

export default function EventsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-32 md:py-40">
        <div className="text-center max-w-lg mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-serif italic font-medium text-neutral-900 tracking-tight">
            Events &amp; News
          </h1>
          <p className="mt-4 text-neutral-500 leading-relaxed">
            Stay tuned for upcoming math festivals, workshops, and Mathitude
            announcements. Check back soon for our latest events.
          </p>
          <a
            href="mailto:info@mathitude.com"
            className="mt-8 inline-flex items-center justify-center rounded-md bg-neutral-900 text-white hover:bg-neutral-800 font-medium text-sm px-8 py-3.5 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
