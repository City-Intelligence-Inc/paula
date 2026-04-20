"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to subscribe");
      }

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-10 lg:gap-16 items-center border-t border-neutral-200 pt-16 sm:pt-20">
          <div className="max-w-xl">
            <p className="text-xs font-medium tracking-[0.22em] text-mathitude-purple uppercase mb-5">
              Stay close
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-mathitude-purple tracking-tight leading-[1.05]">
              A short letter, a few times a year.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-neutral-600 leading-relaxed">
              New math festivals, new workbooks, new ways to bring
              Mathitude home. No spam, ever. Unsubscribe in one click.
            </p>
          </div>

          <div>
            {status === "success" ? (
              <div className="rounded-lg border border-mathitude-purple/20 bg-mathitude-purple/5 p-6">
                <p className="text-base font-medium text-mathitude-purple">
                  You&apos;re in. Welcome to Mathitude.
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  Look for the first letter in the next month or two.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 min-h-[48px] border border-neutral-200 rounded-md px-4 text-base focus:outline-none focus:ring-2 focus:ring-mathitude-purple/20 focus:border-mathitude-purple transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="min-h-[48px] bg-mathitude-purple text-white hover:bg-[#5d288a] rounded-md px-6 text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {status === "loading" ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>
                {status === "error" && (
                  <p className="text-sm text-red-600">
                    Something went wrong. Please try again.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
