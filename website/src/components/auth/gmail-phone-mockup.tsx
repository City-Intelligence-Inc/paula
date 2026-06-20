"use client";

import { useEffect, useState } from "react";

type EmailItem = {
  initials: string;
  color: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
};

type EmailSet = {
  emails: EmailItem[];
  openBody: string;
};

const emailSets: EmailSet[] = [
  {
    emails: [
      { initials: "ZP", color: "#F9AB00", sender: "Zoe's Progress", subject: "Counting & Skip Patterns", preview: "Counted to 100 by 2s, 5s, and 10s on an open number line.", time: "9:00 AM", unread: true },
      { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Shapes & Spatial Reasoning", preview: "Sorting 2D/3D shapes, symmetry lines, area by counting squares.", time: "Yesterday", unread: false },
      { initials: "SN", color: "#34A853", sender: "Session Notes", subject: "Number Bonds & Fact Fluency", preview: "Built addition fluency using ten-frames. Decomposed 8+7 independently.", time: "Mon", unread: false },
      { initials: "AS", color: "#EA4335", sender: "Assessment", subject: "Place Value & Regrouping", preview: "Strong understanding of hundreds/tens/ones. Ready for 3-digit addition.", time: "Fri", unread: false },
    ],
    openBody: "Zoe counted confidently by 2s, 5s, and 10s using an open number line. Strong spatial memory for number sequences — she self-corrected twice without prompting.\n\nRecommend extending to skip counting from non-zero starting points next session.",
  },
  {
    emails: [
      { initials: "OL", color: "#4285F4", sender: "Oliver's Progress", subject: "Multiplication Fluency", preview: "All facts through 9×9 solid. Applying them in multi-step word problems.", time: "10:15 AM", unread: true },
      { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Fractions & Mixed Numbers", preview: "Equivalent fractions, unlike denominators, mixed numbers — 8 weeks.", time: "Yesterday", unread: false },
      { initials: "SN", color: "#34A853", sender: "Session Notes", subject: "Long Division Algorithm", preview: "Standard algorithm introduced. Remainders expressed as fractions in context.", time: "Fri", unread: false },
      { initials: "AS", color: "#1A73E8", sender: "Assessment", subject: "Area & Perimeter", preview: "Computed area of composite shapes. Introduced the concept of square units.", time: "Wed", unread: false },
    ],
    openBody: "8-week fractions plan: weeks 1–2 cover equivalent fractions and simplification, weeks 3–4 compare fractions on number lines, weeks 5–6 add/subtract with unlike denominators, weeks 7–8 introduce mixed numbers and improper fractions.\n\nProblem sets will be sent before each session.",
  },
  {
    emails: [
      { initials: "NR", color: "#EA4335", sender: "Nora's Assessment", subject: "Ratios & Proportional Reasoning", preview: "Unit rate problems strong. Introduced percent change with real contexts.", time: "8:30 AM", unread: true },
      { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Variables & Algebraic Expressions", preview: "Writing expressions from word problems and evaluating with substitution.", time: "2 days ago", unread: false },
      { initials: "SN", color: "#34A853", sender: "Session Notes", subject: "Coordinate Plane & Graphing", preview: "Plotted points in all four quadrants. Introduced slope via rise/run.", time: "Wed", unread: false },
      { initials: "EP", color: "#F9AB00", sender: "Enrichment", subject: "Proportional Relationships", preview: "Constant of proportionality, tables, graphs, and equations in context.", time: "Tue", unread: false },
    ],
    openBody: "Today we plotted ordered pairs in all four quadrants and connected them to real-world contexts. Introduced slope informally — 'rise over run' from two points on a graph.\n\nStudent correctly calculated slope for 4 of 5 examples. Next: equations of lines in slope-intercept form.",
  },
  {
    emails: [
      { initials: "BM", color: "#4285F4", sender: "Ben's Progress", subject: "Linear Equations & Inequalities", preview: "Solved multi-step equations fluently. Self-checked answers throughout.", time: "9:45 AM", unread: true },
      { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Quadratic Functions — 9 Weeks", preview: "Vertex form, factoring, quadratic formula, discriminant, and graphing.", time: "Yesterday", unread: false },
      { initials: "SN", color: "#34A853", sender: "Session Notes", subject: "Systems of Equations", preview: "Solved 3-variable systems by substitution and elimination. Geometric interpretation.", time: "Thu", unread: false },
      { initials: "AS", color: "#EA4335", sender: "Assessment", subject: "Polynomial Operations", preview: "Addition, subtraction, and multiplication of polynomials. Binomial expansion.", time: "Mon", unread: false },
    ],
    openBody: "9-week plan: vertex form (weeks 1–3), factoring by grouping (weeks 4–5), the quadratic formula and discriminant (weeks 6–7), graphing parabolas with transformations (weeks 8–9).\n\nWeekly problem sets recommended. Introduce Desmos for visual exploration starting week 2.",
  },
  {
    emails: [
      { initials: "EM", color: "#4285F4", sender: "Emma's Progress", subject: "Polynomial Factoring", preview: "Factored quadratics by grouping. Ready for the quadratic formula.", time: "9:14 AM", unread: true },
      { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Euclidean Proofs & Circle Theorems", preview: "Two-column proofs, arc length, inscribed angles, and chord relationships.", time: "Yesterday", unread: false },
      { initials: "SN", color: "#34A853", sender: "Session Notes", subject: "Triangle Congruence — SAS & ASA", preview: "First independent two-column proof completed. Introduced CPCTC.", time: "Mon", unread: false },
      { initials: "AS", color: "#1A73E8", sender: "Assessment", subject: "Coordinate Geometry", preview: "Midpoint, distance formula, and equations of circles. Proof using coordinates.", time: "Fri", unread: false },
    ],
    openBody: "Student completed their first independent two-column proof using SAS congruence — logical structure was sound, with only minor notation issues.\n\nIntroduced CPCTC for extending proofs. Recommend 2 additional proof problems before the next session to reinforce the structure.",
  },
  {
    emails: [
      { initials: "MY", color: "#4285F4", sender: "Maya's Progress", subject: "Trigonometry — Unit Circle", preview: "All six trig functions in all four quadrants memorized and applied.", time: "8:45 AM", unread: true },
      { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Logarithms & Exponential Functions", preview: "Change of base, natural log, growth/decay, and inverse relationships.", time: "2 days ago", unread: false },
      { initials: "SN", color: "#34A853", sender: "Session Notes", subject: "Sequences, Series & Sigma Notation", preview: "Arithmetic and geometric sequences. Introduced sigma notation with examples.", time: "Wed", unread: false },
      { initials: "EP", color: "#F9AB00", sender: "Enrichment", subject: "Function Transformations", preview: "Shifts, reflections, stretches — applied to sine, cosine, log, and square root.", time: "Mon", unread: false },
    ],
    openBody: "All six trig functions memorized on the unit circle across all quadrants. Began graphing y = sin(x) and y = cos(x), identifying period and amplitude from the equation.\n\nNext session: phase shifts, vertical shifts, and the tangent function. Excellent retention throughout.",
  },
  {
    emails: [
      { initials: "AI", color: "#EA4335", sender: "Aiden's Prep", subject: "AMC — Number Theory Sprint", preview: "Divisibility, prime factorization, GCD/LCM, and modular arithmetic.", time: "10:02 AM", unread: true },
      { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Combinatorics & Pascal's Triangle", preview: "Binomial theorem, stars-and-bars, lattice paths, inclusion-exclusion.", time: "Yesterday", unread: false },
      { initials: "SN", color: "#34A853", sender: "Session Notes", subject: "Proof by Mathematical Induction", preview: "Proved sum of first n integers. Introduced strong induction via Fibonacci.", time: "Fri", unread: false },
      { initials: "AS", color: "#F9AB00", sender: "Assessment", subject: "Modular Arithmetic & Fermat", preview: "Linear congruences and a walkthrough of Fermat's little theorem proof.", time: "Tue", unread: false },
    ],
    openBody: "Proved the closed form for the sum of the first n integers using weak induction, then introduced strong induction via a Fibonacci divisibility problem.\n\nStudent independently constructed the inductive step with minimal guidance. Ready for olympiad-level induction problems.",
  },
  {
    emails: [
      { initials: "LK", color: "#EA4335", sender: "Lucas's Assessment", subject: "Calculus — Limits & Derivatives", preview: "Epsilon-delta limits conceptually solid. Differentiation rules applied fluently.", time: "11:30 AM", unread: true },
      { initials: "UP", color: "#7030A0", sender: "Unit Plan", subject: "Complex Numbers & Euler's Formula", preview: "Complex plane, polar form, De Moivre's theorem, and roots of unity.", time: "Yesterday", unread: false },
      { initials: "SN", color: "#34A853", sender: "Session Notes", subject: "Infinite Series & Convergence Tests", preview: "Ratio test, comparison test, and the divergence of the harmonic series.", time: "Tue", unread: false },
      { initials: "EP", color: "#F9AB00", sender: "Enrichment", subject: "Linear Algebra Foundations", preview: "Vectors, matrix multiplication, determinants, and geometric interpretation.", time: "Mon", unread: false },
    ],
    openBody: "Epsilon-delta definition of limits understood conceptually and applied in 3 formal proofs. Differentiation rules (power, product, chain) applied fluently across 12 varied problems.\n\nIntroduced the connection between differentiability and continuity. Ready to begin applications: related rates and optimization next session.",
  },
];

type Phase = "inbox-in" | "inbox-out" | "email-in" | "email-out";

export function GmailPhoneMockup() {
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("inbox-in");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("inbox-out"), 3000));
    timers.push(setTimeout(() => setPhase("email-in"), 3420));
    timers.push(setTimeout(() => setPhase("email-out"), 5900));
    timers.push(setTimeout(() => {
      setSetIndex((i) => (i + 1) % emailSets.length);
      setPhase("inbox-in");
      setTick((t) => t + 1);
    }, 6320));
    return () => timers.forEach(clearTimeout);
  }, [tick]);

  const set = emailSets[setIndex];
  const showInbox = phase === "inbox-in" || phase === "inbox-out";
  const showEmail = phase === "email-in" || phase === "email-out";

  const inboxAnim = phase === "inbox-out" ? "slideOutUp" : "slideInUp";
  const emailAnim = phase === "email-out" ? "slideOutUp" : "slideInUp";

  return (
    <div className="relative mx-auto w-[260px]">
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideOutUp {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-16px); }
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
            <div className="flex items-center gap-2 bg-[#f1f3f4] rounded-full px-3 py-1.5">
              <svg className="w-3.5 h-3.5 text-[#5f6368] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="flex-1 text-[10px] text-[#5f6368] font-medium">Search in mail</span>
              <div className="w-5 h-5 rounded-full bg-[#7030A0] flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">P</div>
            </div>
          </div>

          {/* Content area */}
          <div className="relative overflow-hidden" style={{ height: "398px" }}>

            {/* ── INBOX VIEW ── */}
            {showInbox && (
              <div className="absolute inset-0">
                {/* Primary tab */}
                <div className="px-4 pb-1 border-b border-[#e0e0e0]">
                  <span className="text-[10px] font-semibold text-[#1a73e8] border-b-2 border-[#1a73e8] pb-1 inline-block">Primary</span>
                </div>

                <div className="divide-y divide-[#f1f3f4]">
                  {set.emails.map((email, i) => (
                    <div
                      key={`${setIndex}-${i}`}
                      className="flex items-start gap-2.5 px-3 py-2 bg-white"
                      style={{
                        animation: `${inboxAnim} 0.35s ease both`,
                        animationDelay: inboxAnim === "slideInUp"
                          ? `${i * 0.06}s`
                          : `${i * 0.04}s`,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold mt-0.5"
                        style={{ background: email.color }}
                      >
                        {email.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10.5px] truncate ${email.unread ? "font-bold text-[#202124]" : "font-medium text-[#444746]"}`}>
                            {email.sender}
                          </span>
                          <span className={`text-[9px] flex-shrink-0 ${email.unread ? "font-semibold text-[#1a73e8]" : "text-[#5f6368]"}`}>
                            {email.time}
                          </span>
                        </div>
                        <p className={`text-[10px] truncate ${email.unread ? "font-semibold text-[#202124]" : "text-[#444746]"}`}>
                          {email.subject}
                        </p>
                        <p className="text-[9.5px] text-[#5f6368] truncate">{email.preview}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── OPEN EMAIL VIEW ── */}
            {showEmail && (
              <div
                className="absolute inset-0 bg-white flex flex-col"
                style={{
                  animation: `${emailAnim} 0.38s ease both`,
                }}
              >
                {/* Email header bar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#e0e0e0]">
                  <svg className="w-3.5 h-3.5 text-[#5f6368]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="flex-1 text-[10px] font-semibold text-[#202124] truncate">
                    {set.emails[0].subject}
                  </span>
                </div>

                {/* Sender info */}
                <div className="flex items-start gap-2 px-3 py-2.5 border-b border-[#f1f3f4]">
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold mt-0.5"
                    style={{ background: set.emails[0].color }}
                  >
                    {set.emails[0].initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-semibold text-[#202124]">{set.emails[0].sender}</span>
                      <span className="text-[9px] text-[#5f6368]">{set.emails[0].time}</span>
                    </div>
                    <p className="text-[9px] text-[#5f6368]">to Paula</p>
                  </div>
                </div>

                {/* Email body */}
                <div className="flex-1 px-4 py-3 overflow-hidden">
                  <p className="text-[9.5px] text-[#444746] leading-[1.55] whitespace-pre-line">
                    {set.openBody}
                  </p>
                </div>

                {/* Reply button */}
                <div className="px-3 pb-4">
                  <div className="border border-[#dadce0] rounded-full px-4 py-1.5 flex items-center justify-center gap-1.5">
                    <svg className="w-2.5 h-2.5 text-[#5f6368]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l9-9 9 9M5 8v11a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V8" />
                    </svg>
                    <span className="text-[9.5px] text-[#444746] font-medium">Reply</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Compose FAB — only in inbox view */}
          {showInbox && (
            <div className="absolute bottom-6 right-4">
              <div className="bg-[#c2e7ff] rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow">
                <svg className="w-2.5 h-2.5 text-[#001d35]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                <span className="text-[9px] font-medium text-[#001d35]">Compose</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
