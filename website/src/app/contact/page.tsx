"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";

const offerings = [
  { value: "private-tutoring", label: "Private tutoring" },
  { value: "small-group", label: "Small group engagement" },
  { value: "parent-advisories", label: "Parent advisories" },
  { value: "speaking", label: "Speaking engagement" },
  { value: "school-stem", label: "School STEM workshop" },
  { value: "math-festival", label: "Math festival advisory" },
  { value: "general", label: "Something else" },
] as const;

function ContactForm() {
  const searchParams = useSearchParams();
  const initialOffering = searchParams.get("offering") ?? "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    offering: initialOffering,
    studentInfo: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error ||
            "Something went wrong. Please email info@mathitude.com directly.",
        );
        setSubmitting(false);
        return;
      }

      setDone(true);
    } catch {
      setError(
        "Could not reach the server. Please email info@mathitude.com directly.",
      );
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-[#7030A0]/20 bg-[#7030A0]/5 p-6 md:p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-[#7030A0] mx-auto" />
        <h2 className="mt-4 text-2xl font-semibold text-black">
          Got it — Mathitude will be in touch.
        </h2>
        <p className="mt-3 text-base text-black leading-relaxed">
          We&apos;ll reply to <span className="font-medium">{form.email}</span>{" "}
          within a couple of business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            Your name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full h-11 px-4 text-sm border border-neutral-200 rounded-md bg-white text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
            placeholder="Your name"
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            Phone (optional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full h-11 px-4 text-sm border border-neutral-200 rounded-md bg-white text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
            placeholder="(555) 123-4567"
          />
        </div>
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
          className="w-full h-11 px-4 text-sm border border-neutral-200 rounded-md bg-white text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="offering"
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          What are you interested in?
        </label>
        <select
          id="offering"
          name="offering"
          value={form.offering}
          onChange={handleChange}
          required
          className="w-full h-11 px-4 text-sm border border-neutral-200 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
        >
          <option value="">Select an option</option>
          {offerings.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="studentInfo"
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          Student info (optional)
        </label>
        <input
          type="text"
          id="studentInfo"
          name="studentInfo"
          value={form.studentInfo}
          onChange={handleChange}
          className="w-full h-11 px-4 text-sm border border-neutral-200 rounded-md bg-white text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
          placeholder="Grade, school, or anything else useful"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          Tell us a little about what you&apos;re hoping for
        </label>
        <textarea
          id="message"
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          rows={5}
          className="w-full px-4 py-3 text-sm border border-neutral-200 rounded-md bg-white text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 resize-none"
          placeholder="What kind of math support are you looking for? Any specific goals?"
        />
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-md bg-[#7030A0] text-white hover:bg-[#5d288a] disabled:opacity-60 font-medium text-sm px-8 py-3.5 min-w-[180px] transition-colors"
      >
        {submitting ? "Sending…" : "Send to Mathitude"}
      </button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-white animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl text-[#7030A0] tracking-tight text-center"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Request a Consultation
            </h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed text-center max-w-2xl mx-auto">
              Tell us a little about your student and what you&apos;re hoping
              for. Mathitude reads every note and will reach out to schedule a
              free conversation about the right next step.
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
            <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
              <div className="lg:col-span-2 space-y-8">
                <div className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-black">Phone</h3>
                    <a
                      href="tel:5102052633"
                      className="text-sm text-neutral-500 hover:text-black transition-colors"
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
                    <h3 className="font-medium text-black">Email</h3>
                    <a
                      href="mailto:info@mathitude.com"
                      className="text-sm text-neutral-500 hover:text-black transition-colors"
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
                    <h3 className="font-medium text-black">Address</h3>
                    <p className="text-sm text-neutral-500">
                      770 Menlove Suite 200A
                    </p>
                    <p className="text-sm text-neutral-500">Menlo Park, CA</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Professional building, one block from Trader Joe&apos;s
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <Suspense fallback={null}>
                  <ContactForm />
                </Suspense>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
