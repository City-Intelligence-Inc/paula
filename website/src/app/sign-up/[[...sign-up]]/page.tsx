"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

const emailSets = [
  // K–2: very early
  [
    { initials: "ZP", color: "#F9AB00", sender: "Zoe's Progress", subject: "Counting & Number Patterns — K", preview: "Counted to 100 by 1s, 2s, and 5s. Introduced skip counting with manipulatives.", time: "9:00 AM", unread: true },
    { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Shapes & Spatial Reasoning — 1st Grade", preview: "Sorting 2D and 3D shapes, symmetry lines, and intro to area by counting squares.", time: "Yesterday", unread: false },
    { initials: "SN", color: "#34A853", sender: "Session Notes — Sep 5", subject: "Addition to 20 with Number Bonds", preview: "Built fact fluency using ten-frames. Student decomposed 8+7 independently.", time: "Mon", unread: false },
  ],
  // 3–5: elementary
  [
    { initials: "OL", color: "#4285F4", sender: "Oliver's Report", subject: "Multiplication Tables — 3rd Grade", preview: "All facts through 9×9 solid. Beginning to apply them in multi-step word problems.", time: "10:15 AM", unread: true },
    { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Fractions & Mixed Numbers — 4th Grade", preview: "Equivalent fractions, comparing on number lines, adding with unlike denominators.", time: "Yesterday", unread: false },
    { initials: "SN", color: "#34A853", sender: "Session Notes — Sep 12", subject: "Long Division with Remainders", preview: "Introduced the standard algorithm. Remainders interpreted as fractions in context.", time: "Fri", unread: false },
  ],
  // 5–7: pre-algebra
  [
    { initials: "NR", color: "#EA4335", sender: "Nora's Assessment", subject: "Ratios, Rates & Percentages", preview: "Unit rate problems strong. Introduced percent change with discount/tax contexts.", time: "8:30 AM", unread: true },
    { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Variables & Expressions — Pre-Algebra", preview: "Writing algebraic expressions from word problems. Evaluating with substitution.", time: "2 days ago", unread: false },
    { initials: "SN", color: "#34A853", sender: "Session Notes — Sep 19", subject: "Coordinate Plane & Graphing", preview: "Plotted points in all four quadrants. Introduced slope informally via rise/run.", time: "Wed", unread: false },
  ],
  // 7–9: algebra
  [
    { initials: "BM", color: "#4285F4", sender: "Ben's Progress", subject: "Linear Equations — 8th Grade", preview: "Solving two-step and multi-step equations. Student self-checked answers independently.", time: "9:45 AM", unread: true },
    { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Quadratic Functions — 9 Weeks", preview: "Vertex form, factoring, quadratic formula, and discriminant. Graphing parabolas.", time: "Yesterday", unread: false },
    { initials: "SN", color: "#34A853", sender: "Session Notes — Sep 26", subject: "Systems of Equations — Substitution", preview: "Solved 3×3 systems by substitution and elimination. Interpreted solutions geometrically.", time: "Thu", unread: false },
  ],
  // 9–10: geometry & proofs
  [
    { initials: "EM", color: "#4285F4", sender: "Emma's Progress Report", subject: "Polynomial Factoring — Week 6", preview: "Factored quadratics by grouping. Ready to advance to the quadratic formula.", time: "9:14 AM", unread: true },
    { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Euclidean Geometry — Proofs & Circles", preview: "Two-column proofs, angle relationships, arc length, and inscribed angle theorem.", time: "Yesterday", unread: false },
    { initials: "SN", color: "#34A853", sender: "Session Notes — Oct 3", subject: "Triangle Congruence — SAS & ASA Proofs", preview: "Student wrote first independent two-column proof. Introduced CPCTC for follow-ups.", time: "Mon", unread: false },
  ],
  // 10–11: pre-calc & trig
  [
    { initials: "MY", color: "#4285F4", sender: "Maya's Progress", subject: "Trigonometry — Unit Circle Mastered", preview: "All six trig functions on the unit circle solid. Moving to graphs and transformations.", time: "8:45 AM", unread: true },
    { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Logarithms & Exponential Functions", preview: "Change of base, natural log, exponential growth/decay, and inverse relationships.", time: "2 days ago", unread: false },
    { initials: "SN", color: "#34A853", sender: "Session Notes — Oct 9", subject: "Modular Arithmetic & Fermat's Little Theorem", preview: "Clock arithmetic, linear congruences, and a proof of Fermat's little theorem.", time: "Wed", unread: false },
  ],
  // competition math
  [
    { initials: "AI", color: "#EA4335", sender: "Aiden's Competition Prep", subject: "AMC 10 — Number Theory Sprint", preview: "Covered divisibility rules, prime factorization, GCD/LCM, and modular arithmetic problems.", time: "10:02 AM", unread: true },
    { initials: "EP", color: "#F9AB00", sender: "Enrichment Plan", subject: "Combinatorics & Pascal's Triangle", preview: "Binomial theorem, stars-and-bars, lattice paths, and inclusion-exclusion principle.", time: "Yesterday", unread: false },
    { initials: "SN", color: "#34A853", sender: "Session Notes — Oct 11", subject: "Proof by Mathematical Induction", preview: "Proved sum of first n integers and Fibonacci divisibility. Introduced strong induction.", time: "Fri", unread: false },
  ],
  // advanced: calculus & beyond
  [
    { initials: "LK", color: "#EA4335", sender: "Lucas's Assessment", subject: "Calculus — Limits & Differentiation", preview: "Epsilon-delta limits understood conceptually. Differentiation rules applied fluently.", time: "11:30 AM", unread: true },
    { initials: "AT", color: "#F9AB00", sender: "Advanced Topic", subject: "Complex Numbers & the Complex Plane", preview: "Multiplied complex numbers geometrically. Introduced Euler's formula and polar form.", time: "Yesterday", unread: false },
    { initials: "SN", color: "#34A853", sender: "Session Notes — Oct 14", subject: "Geometric Series & Infinite Convergence", preview: "Derived sum formula from first principles. Compared convergence rates. Ratio test intro.", time: "Tue", unread: false },
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

export default function SignUpPage() {
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
              Join the Mathitude community.
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Create your account to get started with Mathitude&apos;s
              K-12 math enrichment programs.
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
              Create your account
            </h1>
            <p className="mt-2 text-sm text-neutral-500">Join Mathitude in a few seconds</p>
          </div>

          <SignUp
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

          <p className="mt-6 text-center text-xs text-neutral-400">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-[#7030A0] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
