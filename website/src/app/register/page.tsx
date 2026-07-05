"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GRADE_OPTIONS, gradeLabel } from "@/lib/grades";

// Hidden registration page (C-9). Reachable only via a tokenized invite link
// (C-1): single-use, 7-day expiry. The email field is read-only, populated
// from the token server-side — the client never sends an email address.
// Families can add children (school, grade, birthday) and extra caregivers,
// who each receive their own invitation when the form is submitted.

interface ValidateResponse {
  valid: boolean;
  reason?: string;
  email?: string;
  role?: "parent" | "tutor" | "student" | "office";
  firstName?: string;
  lastName?: string;
  familyId?: string | null;
  alreadyRegistered?: boolean;
  prefill?: Record<string, string>;
}

interface Child {
  firstName: string;
  lastName: string;
  school: string;
  grade: string;
  birthday: string;
}

interface Caregiver {
  firstName: string;
  lastName: string;
  email: string;
}

const emptyChild = (): Child => ({
  firstName: "",
  lastName: "",
  school: "",
  grade: "K",
  birthday: "",
});

const inputCls =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7030A0]/30 focus:border-[#7030A0]";
const labelCls = "block text-xs font-medium text-neutral-600 mb-1";

function InvalidToken({ reason }: { reason?: string }) {
  const message =
    reason === "used"
      ? "This invitation link has already been used."
      : reason === "expired"
        ? "This invitation link has expired — links are valid for 7 days."
        : "This invitation link isn't valid.";
  return (
    <div className="max-w-md mx-auto py-24 px-6 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Invitation not available
      </h1>
      <p className="text-sm text-neutral-500 mt-3">{message}</p>
      <p className="text-sm text-neutral-500 mt-1">
        If you were expecting access, ask the Mathitude team to send a fresh
        invitation.
      </p>
      <Link
        href="/sign-in"
        className="mt-6 inline-block rounded-full bg-[#7030A0] px-6 py-2.5 text-sm font-semibold text-white"
      >
        Go to sign in
      </Link>
    </div>
  );
}

function RegisterForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";

  const [state, setState] = useState<
    "loading" | "invalid" | "existing" | "form" | "done"
  >("loading");
  const [reason, setReason] = useState<string | undefined>();
  const [info, setInfo] = useState<ValidateResponse | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("parent");
  const [children, setChildren] = useState<Child[]>([emptyChild()]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    fetch(`/api/register/validate?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = (await r.json()) as ValidateResponse;
        if (!j.valid) {
          setReason(j.reason);
          setState("invalid");
          return;
        }
        setInfo(j);
        // #7: this email already has a login — don't walk them into account
        // creation (Clerk would reject it). Send them to sign-in instead.
        if (j.alreadyRegistered) {
          setState("existing");
          return;
        }
        // Prefill what we know from the invite / original inquiry.
        if (j.firstName) setFirstName(j.firstName);
        if (j.lastName) setLastName(j.lastName);
        if (j.prefill?.phone) setPhone(j.prefill.phone);
        if (!j.firstName && j.prefill?.parentName) {
          const [f, ...rest] = j.prefill.parentName.split(" ");
          setFirstName(f || "");
          setLastName(rest.join(" "));
        }
        setState("form");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
      </div>
    );
  }
  if (state === "invalid") return <InvalidToken reason={reason} />;
  if (state === "existing") {
    return (
      <div className="max-w-md mx-auto py-24 px-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">
          You already have an account
        </h1>
        <p className="text-sm text-neutral-500 mt-3">
          There&apos;s already a login for{" "}
          <span className="font-medium">{info?.email}</span>. No need to
          register again — just sign in.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-block rounded-full bg-[#7030A0] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Go to sign in
        </Link>
        <p className="text-xs text-neutral-400 mt-4">
          Forgot your password? You can reset it from the sign-in page.
        </p>
      </div>
    );
  }
  if (state === "done") {
    return (
      <div className="max-w-md mx-auto py-24 px-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">
          You&apos;re all set
        </h1>
        <p className="text-sm text-neutral-500 mt-3">
          Your details are saved. Last step: create your login with the same
          email (<span className="font-medium">{info?.email}</span>).
        </p>
        <button
          onClick={() => router.push("/sign-up")}
          className="mt-6 inline-block rounded-full bg-[#7030A0] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Create your login
        </button>
      </div>
    );
  }

  const isNewFamily = info?.role === "parent" && !info?.familyId;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          firstName,
          lastName,
          phone,
          relationship,
          children: isNewFamily ? children : [],
          caregivers: info?.role === "parent" ? caregivers : [],
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Something went wrong — please try again.");
        return;
      }
      setState("done");
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-16 px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Set up your Mathitude account
      </h1>
      <p className="text-sm text-neutral-500 mt-2">
        {info?.role === "parent"
          ? "Tell us about your family so everything is ready on day one."
          : "Confirm your details to activate your access."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <div>
          <label className={labelCls}>Email</label>
          <input
            value={info?.email || ""}
            readOnly
            disabled
            className={`${inputCls} bg-neutral-100 text-neutral-500 cursor-not-allowed`}
          />
          <p className="text-xs text-neutral-400 mt-1">
            Your invitation is tied to this address — it can&apos;t be changed
            here.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>First name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Last name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className={inputCls}
            />
          </div>
        </div>

        {info?.role === "parent" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                  inputMode="tel"
                />
              </div>
              <div>
                <label className={labelCls}>Relationship to student(s)</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className={inputCls}
                >
                  {[
                    "parent",
                    "stepparent",
                    "grandparent",
                    "aunt",
                    "uncle",
                    "nanny",
                    "guardian",
                    "other",
                  ].map((r) => (
                    <option key={r} value={r}>
                      {r[0].toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isNewFamily && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-900">
                    Your children
                  </h2>
                  <button
                    type="button"
                    onClick={() => setChildren([...children, emptyChild()])}
                    className="text-xs font-medium text-[#7030A0]"
                  >
                    + Add another child
                  </button>
                </div>
                {children.map((child, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-neutral-200 p-4 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>First name</label>
                        <input
                          value={child.firstName}
                          onChange={(e) => {
                            const next = [...children];
                            next[i] = { ...child, firstName: e.target.value };
                            setChildren(next);
                          }}
                          required
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Last name</label>
                        <input
                          value={child.lastName}
                          onChange={(e) => {
                            const next = [...children];
                            next[i] = { ...child, lastName: e.target.value };
                            setChildren(next);
                          }}
                          required
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>School</label>
                        <input
                          value={child.school}
                          onChange={(e) => {
                            const next = [...children];
                            next[i] = { ...child, school: e.target.value };
                            setChildren(next);
                          }}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Grade</label>
                        <select
                          value={child.grade}
                          onChange={(e) => {
                            const next = [...children];
                            next[i] = { ...child, grade: e.target.value };
                            setChildren(next);
                          }}
                          className={inputCls}
                        >
                          {GRADE_OPTIONS.map((g) => (
                            <option key={g} value={g}>
                              {gradeLabel(g)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Birthday</label>
                        <input
                          type="date"
                          value={child.birthday}
                          onChange={(e) => {
                            const next = [...children];
                            next[i] = { ...child, birthday: e.target.value };
                            setChildren(next);
                          }}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    {children.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setChildren(children.filter((_, j) => j !== i))
                        }
                        className="text-xs text-neutral-400 hover:text-neutral-600"
                      >
                        Remove child
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">
                    Other caregivers
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Each caregiver you add is emailed their own invitation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCaregivers([
                      ...caregivers,
                      { firstName: "", lastName: "", email: "" },
                    ])
                  }
                  className="text-xs font-medium text-[#7030A0]"
                >
                  + Add caregiver
                </button>
              </div>
              {caregivers.map((g, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-neutral-200 p-4 grid grid-cols-3 gap-3 items-end"
                >
                  <div>
                    <label className={labelCls}>First name</label>
                    <input
                      value={g.firstName}
                      onChange={(e) => {
                        const next = [...caregivers];
                        next[i] = { ...g, firstName: e.target.value };
                        setCaregivers(next);
                      }}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Last name</label>
                    <input
                      value={g.lastName}
                      onChange={(e) => {
                        const next = [...caregivers];
                        next[i] = { ...g, lastName: e.target.value };
                        setCaregivers(next);
                      }}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={g.email}
                        onChange={(e) => {
                          const next = [...caregivers];
                          next[i] = { ...g, email: e.target.value };
                          setCaregivers(next);
                        }}
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCaregivers(caregivers.filter((_, j) => j !== i))
                        }
                        className="text-xs text-neutral-400 hover:text-neutral-600 shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#7030A0] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Complete registration"}
        </button>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
