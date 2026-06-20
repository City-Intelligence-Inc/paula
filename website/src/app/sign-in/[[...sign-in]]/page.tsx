"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

const emailSets = [
  [
    {
      initials: "EM",
      color: "#4285F4",
      sender: "Emma's Progress Report",
      subject: "Polynomial Factoring — Week 6",
      preview: "Factored quadratics by grouping. Ready to advance to the quadratic formula.",
      time: "9:14 AM",
      unread: true,
    },
    {
      initials: "UP",
      color: "#7030A0",
      sender: "Unit Plan",
      subject: "Number Theory — 8 Weeks",
      preview: "Primes, GCD, modular arithmetic, and Diophantine equations. Plan attached.",
      time: "Yesterday",
      unread: false,
    },
    {
      initials: "SN",
      color: "#34A853",
      sender: "Session Notes — Oct 14",
      subject: "Proof by Mathematical Induction",
      preview: "Proved sum of first n integers. Introduced strong induction via Fibonacci sequence.",
      time: "Mon",
      unread: false,
    },
  ],
  [
    {
      initials: "AI",
      color: "#EA4335",
      sender: "Aiden's Assessment",
      subject: "Calculus Readiness — Limits",
      preview: "Limits and continuity strong. Beginning differentiation rules next session.",
      time: "10:02 AM",
      unread: true,
    },
    {
      initials: "CP",
      color: "#F9AB00",
      sender: "Competition Prep",
      subject: "AMC 8 — Counting & Probability",
      preview: "Covered permutations, combinations, and expected value. Practice set attached.",
      time: "Yesterday",
      unread: false,
    },
    {
      initials: "SN",
      color: "#34A853",
      sender: "Session Notes — Oct 11",
      subject: "Triangle Congruence Proofs",
      preview: "SAS and ASA proofs completed. Student constructed first formal two-column proof.",
      time: "Fri",
      unread: false,
    },
  ],
  [
    {
      initials: "MY",
      color: "#4285F4",
      sender: "Maya's Progress",
      subject: "Trigonometry — Unit Circle",
      preview: "Unit circle mastered. Introducing sine/cosine graphs, period, and amplitude.",
      time: "8:45 AM",
      unread: true,
    },
    {
      initials: "EP",
      color: "#7030A0",
      sender: "Enrichment Plan",
      subject: "Combinatorics & Pascal's Triangle",
      preview: "Binomial theorem, combinations, and lattice paths. Real competition problems included.",
      time: "2 days ago",
      unread: false,
    },
    {
      initials: "SN",
      color: "#34A853",
      sender: "Session Notes — Oct 9",
      subject: "Modular Arithmetic & Fermat",
      preview: "Clock arithmetic, linear congruences, and an introduction to Fermat's little theorem.",
      time: "Wed",
      unread: false,
    },
  ],
  [
    {
      initials: "LK",
      color: "#EA4335",
      sender: "Lucas's Report",
      subject: "Statistics — Standard Deviation",
      preview: "Mean, median, mode reviewed. Introduced standard deviation with real-world datasets.",
      time: "11:30 AM",
      unread: true,
    },
    {
      initials: "AT",
      color: "#F9AB00",
      sender: "Advanced Topic",
      subject: "Complex Numbers & the Complex Plane",
      preview: "Extended the number line. Graphed, added, and multiplied complex numbers geometrically.",
      time: "Yesterday",
      unread: false,
    },
    {
      initials: "SN",
      color: "#34A853",
      sender: "Session Notes — Oct 7",
      subject: "Geometric Series & Convergence",
      preview: "Derived the sum formula from first principles. Discussed infinite series convergence.",
      time: "Tue",
      unread: false,
    },
  ],
];

function GmailPhoneMockup() {
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase("out");
      setTimeout(() => {
        setSetIndex((i) => (i + 1) % emailSets.length);
        setPhase("in");
      }, 450);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const emails = emailSets[setIndex];

  return (
    <div className="relative mx-auto w-[260px]">
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideOutUp {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-14px); }
        }
      `}</style>

      <div className="relative bg-[#1c1c1e] rounded-[44px] p-3 shadow-2xl ring-1 ring-white/10">
        <div className="bg-white rounded-[36px] overflow-hidden" style={{ height: "520px" }}>
          {/* Dynamic island */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-24 h-6 bg-[#1c1c1e] rounded-full" />
          </div>

          {/* Gmail search bar */}
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 bg-[#f1f3f4] rounded-full px-3 py-2">
              <svg className="w-3.5 h-3.5 text-[#5f6368]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="flex-1 text-[11px] text-[#5f6368] font-medium">Search in mail</span>
              <div className="w-6 h-6 rounded-full bg-[#7030A0] flex items-center justify-center text-white text-[8px] font-bold">P</div>
            </div>
          </div>

          {/* Primary tab */}
          <div className="px-4 pb-1 border-b border-[#e0e0e0]">
            <span className="text-[10px] font-semibold text-[#1a73e8] border-b-2 border-[#1a73e8] pb-1.5 inline-block">Primary</span>
          </div>

          {/* Animated email list */}
          <div className="divide-y divide-[#f1f3f4]">
            {emails.map((email, i) => (
              <div
                key={`${setIndex}-${i}`}
                className="flex items-start gap-2.5 px-3 py-2.5 bg-white"
                style={{
                  animation: phase === "in"
                    ? `slideInUp 0.38s ease both`
                    : `slideOutUp 0.32s ease both`,
                  animationDelay: phase === "in"
                    ? `${i * 0.07}s`
                    : `${i * 0.04}s`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                  style={{ background: email.color }}
                >
                  {email.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] truncate ${email.unread ? "font-bold text-[#202124]" : "font-medium text-[#444746]"}`}>
                      {email.sender}
                    </span>
                    <span className={`text-[9px] flex-shrink-0 ml-1 ${email.unread ? "font-semibold text-[#1a73e8]" : "text-[#5f6368]"}`}>
                      {email.time}
                    </span>
                  </div>
                  <p className={`text-[10px] truncate ${email.unread ? "font-semibold text-[#202124]" : "text-[#444746]"}`}>
                    {email.subject}
                  </p>
                  <p className="text-[10px] text-[#5f6368] leading-snug line-clamp-2">{email.preview}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Compose FAB */}
          <div className="absolute bottom-8 right-5">
            <div className="bg-[#c2e7ff] rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow">
              <svg className="w-3 h-3 text-[#001d35]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              <span className="text-[10px] font-medium text-[#001d35]">Compose</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="h-screen flex overflow-hidden">
      <div className="hidden lg:flex lg:w-[52%] bg-[#7030A0] flex-col justify-between p-14 xl:p-20 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 70% 30%, #9b59b6 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #4a1070 0%, transparent 50%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-start gap-10 mt-auto mb-auto">
          <div className="space-y-4 max-w-xs">
            <h1
              className="text-3xl xl:text-4xl text-white leading-snug"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Personalized math coaching, start to finish.
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Schedule sessions, track progress, and stay in sync with
              Mathitude — all in one place.
            </p>
          </div>
          <GmailPhoneMockup />
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © {new Date().getFullYear()} Mathitude · Menlo Park, CA
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 bg-white overflow-y-auto">
        <Link href="/" className="lg:hidden mb-8">
          <span className="text-2xl text-[#7030A0]" style={{ fontFamily: "var(--font-original-surfer)" }}>
            Mathitude
          </span>
        </Link>

        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl text-neutral-900" style={{ fontFamily: "var(--font-original-surfer)" }}>
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-neutral-500">Sign in to your Mathitude account</p>
          </div>

          <SignIn
            forceRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: "#7030A0",
                colorText: "#171717",
                colorTextSecondary: "#737373",
                colorBackground: "#ffffff",
                colorInputBackground: "#fafafa",
                colorInputText: "#171717",
                borderRadius: "8px",
                fontFamily: "'Avenir Next', 'Avenir', system-ui, sans-serif",
                fontSize: "14px",
              },
              elements: {
                rootBox: "w-full",
                card: "shadow-none border border-neutral-200 rounded-xl p-8 w-full",
                header: "hidden",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium rounded-lg",
                formButtonPrimary: "bg-[#7030A0] hover:bg-[#5d288a] rounded-lg font-medium uppercase tracking-wide shadow-none",
                formFieldInput: "border-neutral-200 focus:border-[#7030A0] focus:ring-1 focus:ring-[#7030A0] rounded-lg bg-white",
                formFieldLabel: "text-neutral-600 text-sm font-medium",
                identityPreviewEditButton: "text-[#7030A0] hover:text-[#5d288a]",
                footerActionLink: "text-[#7030A0] hover:text-[#5d288a] font-medium",
                footer: "hidden",
                badge: "hidden",
                logoBox: "hidden",
                dividerLine: "bg-neutral-200",
                dividerText: "text-neutral-400 text-xs",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
