"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SaveCardForm } from "@/components/stripe/save-card-form";
import { GRADE_OPTIONS, gradeLabel } from "@/lib/grades";

const inputClass =
  "w-full border border-[#E8E3D9] rounded-lg px-4 py-3 text-sm text-[#1A1A2E] bg-white placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#7030A0]/20 focus:border-[#7030A0] transition-colors";

const selectClass =
  "w-full border border-[#E8E3D9] rounded-lg px-4 py-3 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#7030A0]/20 focus:border-[#7030A0] transition-colors appearance-none cursor-pointer";

type StudentDraft = { firstName: string; lastName: string; grade: string; school: string };
const emptyStudent = (): StudentDraft => ({ firstName: "", lastName: "", grade: "K", school: "" });

// Additional parents / guardians the family adds up front. Each is invited to
// the portal with their own tokenized link (they can't share a login), so we
// only need a name and an email here — mirrors "Other caregivers" at /register.
type CoParentDraft = { firstName: string; lastName: string; email: string };
const emptyCoParent = (): CoParentDraft => ({ firstName: "", lastName: "", email: "" });

const STEPS = [
  { label: "Your info",  sub: "Parent & student details" },
  { label: "Payment",   sub: "Secure card on file" },
  { label: "All set",   sub: "Portal access granted" },
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-[#6B6F76] uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-[#E8E3D9]" />
      <span className="text-xs font-semibold text-[#A8A29E] uppercase tracking-widest">{title}</span>
      <div className="flex-1 h-px bg-[#E8E3D9]" />
    </div>
  );
}

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="mb-10">
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? "1" : "0" }}>
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center" style={{ width: 32, height: 32 }}>
                <div
                  className="absolute inset-0 rounded-full transition-all duration-300"
                  style={{
                    background: i < current ? "#7030A0" : i === current ? "white" : "#F5F2EE",
                    border: i <= current ? "2px solid #7030A0" : "2px solid #D4CECC",
                  }}
                />
                <span className="relative text-xs font-semibold" style={{ color: i < current ? "white" : i === current ? "#7030A0" : "#A8A29E" }}>
                  {i < current ? (
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M1 5l3.5 3.5L12 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : i + 1}
                </span>
              </div>
              <span className="mt-2 text-xs font-medium whitespace-nowrap" style={{ color: i === current ? "#7030A0" : i < current ? "#6B6F76" : "#A8A29E" }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mb-5 mx-2 transition-all duration-500" style={{ height: 2, background: i < current ? "#7030A0" : "#E8E3D9", borderRadius: 1 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();

  const [step, setStep] = useState(0);
  const [parentId, setParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parent fields — pre-fill from Clerk when available
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  // Student fields — a family can enroll one or more children up front.
  const [students, setStudents] = useState<StudentDraft[]>([emptyStudent()]);
  // Extra parents / guardians — the family can grow horizontally too.
  const [coParents, setCoParents] = useState<CoParentDraft[]>([]);

  function updateStudent(i: number, patch: Partial<StudentDraft>) {
    setStudents((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addStudent() {
    setStudents((prev) => [...prev, emptyStudent()]);
  }
  function removeStudent(i: number) {
    setStudents((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateCoParent(i: number, patch: Partial<CoParentDraft>) {
    setCoParents((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function addCoParent() {
    setCoParents((prev) => [...prev, emptyCoParent()]);
  }
  function removeCoParent(i: number) {
    setCoParents((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Pre-fill parent name from Clerk once loaded
  useEffect(() => {
    if (user?.firstName && !parentFirstName) setParentFirstName(user.firstName);
    if (user?.lastName && !parentLastName) setParentLastName(user.lastName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.firstName, user?.lastName]);

  // C-1/B-5 card gate routing: invited parents already have their family on
  // file from /register, so they skip straight to the payment step; anyone
  // who already has a card on file skips onboarding entirely.
  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((j: { parentId?: string | null; hasCard?: boolean; needsInfo?: boolean; redirect?: string }) => {
        if (j.redirect) {
          // Staff/tutor accounts — their portal, never the family card gate.
          router.replace(j.redirect);
          return;
        }
        if (j.parentId && j.hasCard) {
          router.replace("/dashboard");
          return;
        }
        if (j.parentId && !j.needsInfo) {
          setParentId(j.parentId);
          setStep(1);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentFirstName: parentFirstName.trim(),
          parentLastName: parentLastName.trim(),
          parentPhone: parentPhone.trim(),
          students: students.map((s) => ({
            firstName: s.firstName.trim(),
            lastName: s.lastName.trim(),
            grade: s.grade,
            school: s.school.trim(),
          })),
          caregivers: coParents
            .filter((p) => p.email.trim())
            .map((p) => ({
              firstName: p.firstName.trim(),
              lastName: p.lastName.trim(),
              email: p.email.trim(),
            })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Registration failed");
      setParentId(json.parentId);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F3F4F6", fontFamily: "'Avenir Next', 'Nunito Sans', system-ui, sans-serif" }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#E8E3D9] bg-white/60 backdrop-blur-sm">
        <span className="text-lg font-semibold tracking-tight" style={{ color: "#7030A0", fontFamily: "var(--font-original-surfer, serif)" }}>
          Mathitude
        </span>
        <span className="text-xs text-[#A8A29E]">Family setup</span>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 pt-12 pb-20">
        <div className="w-full" style={{ maxWidth: 520 }}>

          {/* Welcome */}
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#7030A0] mb-2">Getting started</p>
            <h1 className="text-2xl font-semibold leading-snug" style={{ color: "#1A1A2E", letterSpacing: "-0.02em" }}>
              {user?.firstName ? `Welcome, ${user.firstName}.` : "Welcome."}
            </h1>
            <p className="mt-1 text-sm text-[#6B6F76] leading-relaxed">
              A few quick details and you&apos;ll have full access to your family portal.
            </p>
          </div>

          <ProgressBar current={step} />

          {/* ── Step 0: parent + student info ── */}
          {step === 0 && (
            <form onSubmit={submitStep1}>
              <div className="rounded-xl bg-white border border-[#E8E3D9] overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(26,26,46,0.06)" }}>

                {/* Parent section */}
                <div className="px-6 pt-6 pb-5 space-y-4">
                  <SectionDivider title="Parent / Guardian" />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>First name</Label>
                      <input type="text" required value={parentFirstName} onChange={(e) => setParentFirstName(e.target.value)} className={inputClass} placeholder="First" />
                    </div>
                    <div>
                      <Label>Last name</Label>
                      <input type="text" required value={parentLastName} onChange={(e) => setParentLastName(e.target.value)} className={inputClass} placeholder="Last" />
                    </div>
                  </div>

                  <div>
                    <Label>Phone number</Label>
                    <input type="tel" required value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className={inputClass} placeholder="e.g. 510-555-1234" />
                  </div>

                  {/* Additional parents / guardians — each gets their own invite */}
                  {coParents.map((p, i) => (
                    <div key={i} className="space-y-3 pt-1">
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-[#E8E3D9]" />
                        <span className="text-xs font-semibold text-[#A8A29E] uppercase tracking-widest">
                          Parent {i + 2}
                        </span>
                        <button type="button" onClick={() => removeCoParent(i)} className="text-xs font-medium text-[#A8A29E] hover:text-[#B0263C] transition-colors">
                          Remove
                        </button>
                        <div className="flex-1 h-px bg-[#E8E3D9]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>First name</Label>
                          <input type="text" value={p.firstName} onChange={(e) => updateCoParent(i, { firstName: e.target.value })} className={inputClass} placeholder="First" />
                        </div>
                        <div>
                          <Label>Last name</Label>
                          <input type="text" value={p.lastName} onChange={(e) => updateCoParent(i, { lastName: e.target.value })} className={inputClass} placeholder="Last" />
                        </div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <input type="email" required value={p.email} onChange={(e) => updateCoParent(i, { email: e.target.value })} className={inputClass} placeholder="name@example.com" />
                      </div>
                    </div>
                  ))}

                  <div>
                    <button type="button" onClick={addCoParent} className="flex items-center gap-1.5 text-sm font-semibold text-[#7030A0] hover:text-[#5B2680] transition-colors">
                      <span className="text-base leading-none">+</span> Add a parent / guardian
                    </button>
                    {coParents.length > 0 && (
                      <p className="mt-1.5 text-xs text-[#A8A29E]">
                        Each parent you add gets their own invitation to the family portal.
                      </p>
                    )}
                  </div>
                </div>

                {/* Divider between sections */}
                <div className="border-t border-[#E8E3D9]" />

                {/* Student section — one or more children */}
                <div className="px-6 pt-5 pb-6 space-y-5">
                  {students.map((s, i) => (
                    <div key={i} className="space-y-4">
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-[#E8E3D9]" />
                        <span className="text-xs font-semibold text-[#A8A29E] uppercase tracking-widest">
                          {students.length === 1 ? "Your child" : `Child ${i + 1}`}
                        </span>
                        {i > 0 && (
                          <button type="button" onClick={() => removeStudent(i)} className="text-xs font-medium text-[#A8A29E] hover:text-[#B0263C] transition-colors">
                            Remove
                          </button>
                        )}
                        <div className="flex-1 h-px bg-[#E8E3D9]" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>First name</Label>
                          <input type="text" required value={s.firstName} onChange={(e) => updateStudent(i, { firstName: e.target.value })} className={inputClass} placeholder="First" />
                        </div>
                        <div>
                          <Label>Last name</Label>
                          <input type="text" required value={s.lastName} onChange={(e) => updateStudent(i, { lastName: e.target.value })} className={inputClass} placeholder="Last" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Grade</Label>
                          <div className="relative">
                            <select value={s.grade} onChange={(e) => updateStudent(i, { grade: e.target.value })} className={selectClass}>
                              {GRADE_OPTIONS.map((g) => (
                                <option key={g} value={g}>{gradeLabel(g)}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                                <path d="M1 1l5 5 5-5" stroke="#6B6F76" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label>School</Label>
                          <input type="text" required value={s.school} onChange={(e) => updateStudent(i, { school: e.target.value })} className={inputClass} placeholder="e.g. Lincoln Elementary" />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={addStudent} className="flex items-center gap-1.5 text-sm font-semibold text-[#7030A0] hover:text-[#5B2680] transition-colors">
                    <span className="text-base leading-none">+</span> Add another child
                  </button>
                </div>

                {error && (
                  <div className="mx-6 mb-4 px-3 py-2 rounded-lg bg-[#FDF2F4] border border-[#F4C2CA] text-sm text-[#B0263C]">
                    {error}
                  </div>
                )}

                <div className="px-6 pb-6">
                  <button type="submit" disabled={saving} className="w-full rounded-full py-3 text-sm font-semibold text-white transition-all disabled:opacity-50" style={{ background: saving ? "#A070C0" : "#7030A0" }}>
                    {saving ? "Saving…" : "Continue to payment →"}
                  </button>
                </div>
              </div>

              <p className="mt-4 text-xs text-center text-[#A8A29E]">
                You can add more children or parents from the family portal after setup.
              </p>
            </form>
          )}

          {/* ── Step 1: payment ── */}
          {step === 1 && (
            <div className="rounded-xl bg-white border border-[#E8E3D9] overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(26,26,46,0.06)" }}>
              <div className="px-6 pt-6 pb-2 border-b border-[#E8E3D9]">
                <h2 className="text-base font-semibold text-[#1A1A2E]">Save a card</h2>
                <p className="text-sm text-[#6B6F76] mt-0.5">Sessions are charged per booking — save once, no friction later.</p>
              </div>
              <div className="px-6 py-6">
                <SaveCardForm parentId={parentId ?? undefined} hideHeader fullWidth onSuccess={() => setStep(2)} />
              </div>
              {/* B-5: card capture is a gate at registration — no skip.
                  Saving the card advances via SaveCardForm's onSuccess. */}
              <div className="px-6 pb-6 pt-0">
                <p className="w-full py-2 text-xs text-[#A8A29E] text-center">
                  A card on file is required to complete registration —
                  you&apos;re only charged after a session happens.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: done ── */}
          {step === 2 && (
            <div className="rounded-xl bg-white border border-[#E8E3D9] overflow-hidden text-center" style={{ boxShadow: "0 1px 4px rgba(26,26,46,0.06)" }}>
              <div className="px-6 pt-10 pb-6" style={{ background: "linear-gradient(to bottom, #F9F5FF, white)" }}>
                <div className="mx-auto mb-5 flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "#7030A0" }}>
                  <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                    <path d="M2 9l6.5 6.5L22 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#1A1A2E] mb-2" style={{ letterSpacing: "-0.02em" }}>You&apos;re in.</h2>
                <p className="text-sm text-[#6B6F76] leading-relaxed max-w-xs mx-auto">
                  Paula has been notified and will reach out to schedule your first session.
                </p>
              </div>
              <div className="px-6 pb-8">
                <button onClick={() => router.push("/dashboard")} className="w-full rounded-full py-3 text-sm font-semibold text-white transition-all" style={{ background: "#7030A0" }}>
                  Open my portal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
