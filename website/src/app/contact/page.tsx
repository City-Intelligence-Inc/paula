import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-32 md:py-40">
        <div className="text-center max-w-lg mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-serif italic font-medium text-neutral-900 tracking-tight">
            Get in Touch
          </h1>
          <p className="mt-4 text-neutral-500 leading-relaxed">
            We&apos;d love to hear from you. Reach out to learn about tutoring,
            enrichment books, or how Mathitude can help your student.
          </p>
          <div className="mt-6 space-y-1 text-neutral-600 text-sm">
            <p>
              <a
                href="tel:5102052633"
                className="hover:text-neutral-900 transition-colors"
              >
                510.205.2633
              </a>
            </p>
            <p>
              <a
                href="mailto:info@mathitude.com"
                className="hover:text-neutral-900 transition-colors"
              >
                info@mathitude.com
              </a>
            </p>
          </div>
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
