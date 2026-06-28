"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SaveCardForm } from "@/components/stripe/save-card-form";
import { GRADE_OPTIONS, gradeLabel } from "@/lib/grades";
import { CheckCircle2 } from "lucide-react";

const inputClass =
  "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7030A0]/30 focus:border-[#7030A0]";

const STEPS = ["Your student", "Payment", "All set"] as const;

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                i < current
                  ? "bg-[#7030A0] border-[#7030A0] text-white"
                  : i === current
                  ? "border-[#7030A0] text-[#7030A0] bg-white"
                  : "border-neutral-300 text-neutral-400 bg-white"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={`mt-1 text-xs font-medium whitespace-nowrap ${
                i === current ? "text-[#7030A0]" : i < current ? "text-neutral-600" : "text-neutral-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${
                i < current ? "bg-[#7030A0]" : "bg-neutral-200"
              }`}
            />
          )}
        </div>
      ))}
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

  // Step 1 form
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [grade, setGrade] = useState("K");
  const [school, setSchool] = useState("");

  async function submitStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentFirstName, studentLastName, grade, school }),
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
    <div className="min-h-screen bg-neutral-50 flex items-start justify-center pt-16 px-4 pb-16">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Welcome to Mathitude{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Complete setup to access your family portal.
          </p>
        </div>

        <StepBar current={step} />

        {/* Step 0 — Student info */}
        {step === 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900 mb-1">
              Tell us about your student
            </h2>
            <p className="text-sm text-neutral-500 mb-5">
              You can add siblings later from the family portal.
            </p>

            <form onSubmit={submitStep1} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    First name
                  </label>
                  <input
                    type="text"
                    required
                    value={studentFirstName}
                    onChange={(e) => setStudentFirstName(e.target.value)}
                    className={inputClass}
                    placeholder="First"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Last name
                  </label>
                  <input
                    type="text"
                    required
                    value={studentLastName}
                    onChange={(e) => setStudentLastName(e.target.value)}
                    className={inputClass}
                    placeholder="Last"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Grade
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className={inputClass}
                  >
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {gradeLabel(g)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    School{" "}
                    <span className="font-normal text-neutral-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className={inputClass}
                    placeholder="School name"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#7030A0] hover:bg-[#5d288a] text-white text-sm font-medium rounded-md px-4 py-2.5 transition-colors disabled:opacity-60"
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </form>
          </div>
        )}

        {/* Step 1 — Payment */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900 mb-1">
              Save a payment method
            </h2>
            <p className="text-sm text-neutral-500 mb-5">
              Mathitude charges per session — saving your card now means no
              extra steps when sessions begin.
            </p>
            <SaveCardForm
              parentId={parentId ?? undefined}
              hideHeader
              fullWidth
              onSuccess={() => setStep(2)}
            />
            <button
              onClick={() => setStep(2)}
              className="mt-4 w-full text-sm text-neutral-400 hover:text-neutral-600 text-center"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 2 — Done */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 shadow-sm text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              You&apos;re all set!
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              Paula has been notified and will be in touch to schedule your
              first session. Your portal is ready.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-[#7030A0] hover:bg-[#5d288a] text-white text-sm font-medium rounded-md px-6 py-2.5 transition-colors"
            >
              Go to my portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
