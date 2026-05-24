"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { GRADE_OPTIONS, gradeLabel } from "@/lib/grades";
import type { GuardianRelationship } from "@/lib/types";

const RELATIONSHIP_OPTIONS: { value: GuardianRelationship; label: string }[] = [
  { value: "parent", label: "Parent" },
  { value: "stepparent", label: "Stepparent" },
  { value: "grandparent", label: "Grandparent" },
  { value: "aunt", label: "Aunt" },
  { value: "uncle", label: "Uncle" },
  { value: "nanny", label: "Nanny" },
  { value: "guardian", label: "Legal guardian" },
  { value: "other", label: "Other" },
];

export default function NewFamilyPage() {
  const router = useRouter();
  const fetchApi = useApi();

  // Family creation is bootstrapped by creating the first student — the
  // existing POST /api/students handler auto-creates the family + the first
  // parent in one transaction when familyId is omitted. This matches Paula's
  // 5/17 spec: "families enter card once" via the sibling/multi-parent flow,
  // with the initial parent acting as the primary payer.
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentRelationship, setParentRelationship] =
    useState<GuardianRelationship>("parent");

  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [studentGrade, setStudentGrade] = useState("K");
  const [studentRate, setStudentRate] = useState("");
  const [sessionType, setSessionType] = useState<"individual" | "group">(
    "individual",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const missing: string[] = [];
    if (!parentFirstName.trim()) missing.push("Parent first name");
    if (!parentLastName.trim()) missing.push("Parent last name");
    if (!parentEmail.trim()) missing.push("Parent email");
    if (!studentFirstName.trim()) missing.push("Student first name");
    if (!studentLastName.trim()) missing.push("Student last name");
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetchApi("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: studentFirstName.trim(),
          lastName: studentLastName.trim(),
          grade: studentGrade,
          status: "active",
          parentName: `${parentFirstName.trim()} ${parentLastName.trim()}`.trim(),
          parentEmail: parentEmail.trim(),
          parentPhone: parentPhone.trim(),
          sessionType,
          rate: parseFloat(studentRate) || 0,
          // Future enhancement: pass parentRelationship through to the
          // auto-created parent record. For now the POST endpoint defaults
          // to "parent" — the family page lets you change relationship or
          // add additional caregivers after creation.
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Could not create family");
      }
      const student = json.student;
      // Auto-created family is keyed by familyId on the new student row.
      if (student?.familyId) {
        router.push(`/admin/families/${student.familyId}`);
      } else {
        router.push("/admin/families");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/families"
          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-3 w-3" /> Families
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mt-2">
          Add a new family
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Create a family by entering the primary parent + the first student.
          Additional caregivers (stepparent, nanny, grandparent…) and siblings
          can be added on the family page after the household is created.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Card className="border border-[color:var(--color-border-warm)] rounded-lg">
          <CardContent className="py-4 space-y-3">
            <h2 className="font-medium text-neutral-900">Primary caregiver</h2>
            <p className="text-xs text-neutral-500">
              This person becomes the family&apos;s primary payer. They&apos;ll
              save the first card on file once they sign in.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="First name"
                required
                value={parentFirstName}
                onChange={setParentFirstName}
              />
              <Field
                label="Last name"
                required
                value={parentLastName}
                onChange={setParentLastName}
              />
              <Field
                label="Email"
                type="email"
                required
                value={parentEmail}
                onChange={setParentEmail}
              />
              <Field
                label="Phone"
                type="tel"
                value={parentPhone}
                onChange={setParentPhone}
              />
              <label className="text-sm text-neutral-700 sm:col-span-2">
                Relationship to student
                <select
                  value={parentRelationship}
                  onChange={(e) =>
                    setParentRelationship(
                      e.target.value as GuardianRelationship,
                    )
                  }
                  className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm bg-white"
                >
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[color:var(--color-border-warm)] rounded-lg">
          <CardContent className="py-4 space-y-3">
            <h2 className="font-medium text-neutral-900">First student</h2>
            <p className="text-xs text-neutral-500">
              You can add siblings on the family page after creation —
              they&apos;ll inherit the family&apos;s card on file.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="First name"
                required
                value={studentFirstName}
                onChange={setStudentFirstName}
              />
              <Field
                label="Last name"
                required
                value={studentLastName}
                onChange={setStudentLastName}
              />
              <label className="text-sm text-neutral-700 block">
                Grade
                <select
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm bg-white"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {gradeLabel(g)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-neutral-700 block">
                Default session type
                <select
                  value={sessionType}
                  onChange={(e) =>
                    setSessionType(e.target.value as "individual" | "group")
                  }
                  className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="individual">Individual</option>
                  <option value="group">Group</option>
                </select>
              </label>
              <label className="text-sm text-neutral-700 sm:col-span-2 block">
                Default rate per session ($)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={studentRate}
                  onChange={(e) => setStudentRate(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm"
                />
                <span className="block text-xs text-neutral-400 mt-1">
                  Per the 5/17 spec, pricing differs per family / per student /
                  per tutor. This is the default rate; individual session
                  charges can override it on /admin/sessions/new.
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md border-0 badge-error px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Link href="/admin/families">
            <Button type="button" variant="outline" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#7030A0] hover:bg-[#5d288a] text-white uppercase tracking-wide"
          >
            {saving ? "Creating…" : "Create family"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  type = "text",
  required = false,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="text-sm text-neutral-700 block">
      {label}
      {required && <span className="text-[color:var(--color-state-error)] ml-0.5">*</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm"
      />
    </label>
  );
}
