"use client";

import { useState } from "react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { MapPin, Clock, Phone, Mail } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // No backend yet — open mailto as fallback
    const mailtoBody = `Name: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\n\n${form.message}`;
    window.location.href = `mailto:info@mathitude.com?subject=${encodeURIComponent(form.subject || "Website Inquiry")}&body=${encodeURIComponent(mailtoBody)}`;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-neutral-900 tracking-tight text-center" style={{ fontFamily: "var(--font-original-surfer)" }}>
              Get in Touch
            </h1>
            <p className="mt-6 text-lg md:text-xl text-neutral-500 leading-relaxed text-center max-w-2xl mx-auto">
              We&apos;d love to hear from you. Reach out to learn about
              tutoring, enrichment books, or how Mathitude can help your
              student.
            </p>
          </div>
        </section>

        {/* Contact info + form */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
              {/* Contact details */}
              <div className="lg:col-span-2 space-y-8">
                <div className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900">Phone</h3>
                    <a
                      href="tel:5102052633"
                      className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                      510.205.2633
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900">Email</h3>
                    <a
                      href="mailto:info@mathitude.com"
                      className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                      info@mathitude.com
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900">Location</h3>
                    <p className="text-sm text-neutral-500">Menlo Park, CA</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Professional building, one block from Trader Joe&apos;s
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900">Hours</h3>
                    <p className="text-sm text-neutral-500">
                      Mon&ndash;Fri: 9:00 AM &ndash; 7:00 PM
                    </p>
                    <p className="text-sm text-neutral-500">
                      Sat: 10:00 AM &ndash; 4:00 PM
                    </p>
                    <p className="text-sm text-neutral-500">Sun: Closed</p>
                  </div>
                </div>
              </div>

              {/* Contact form */}
              <div className="lg:col-span-3">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 text-sm border border-neutral-200 rounded-md bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 text-sm border border-neutral-200 rounded-md bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-4 text-sm border border-neutral-200 rounded-md bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-colors"
                    >
                      <option value="">Select a topic</option>
                      <option value="Tutoring Inquiry">Tutoring Inquiry</option>
                      <option value="Enrichment Books">Enrichment Books</option>
                      <option value="Group Camp">Group Camp</option>
                      <option value="Event Inquiry">Event Inquiry</option>
                      <option value="General Question">General Question</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 text-sm border border-neutral-200 rounded-md bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-colors resize-none"
                      placeholder="Tell us about your student and how we can help..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md bg-neutral-900 text-white hover:bg-neutral-800 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
