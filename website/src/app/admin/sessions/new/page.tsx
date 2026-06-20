"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, Mail, AlertCircle } from "lucide-react";

interface StudentRow {
  id: string;
  firstName?: string;
  lastName?: string;
  grade?: string | number;
  familyId?: string;
  rate?: number;
  studentEmail?: string;
  parentEmail?: string;
}

function titleCase(s: string): string {
  return s.replace(/(\w)(\S*)/g, (_, f, r) => f.toUpperCase() + r.toLowerCase());
}

function displayName(s: StudentRow): string {
  const full = `${s.firstName || ""} ${s.lastName || ""}`.trim();
  return full ? titleCase(full) : "Student";
}

interface FamilyRow {
  id: string;
  primary?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  parents?: { id: string; firstName?: string; lastName?: string }[];
}

interface TutorRow {
  id: string;
  firstName?: string;
  lastName?: string;
}

type Offering =
  | "tutoring"
  | "group-parent-ed"
  | "stem-fair"
  | "family-advising"
  | "speaking";

const OFFERINGS: { value: Offering; label: string; helper: string }[] = [
  {
    value: "tutoring",
    label: "Tutoring session",
    helper: "Default — a regular math tutoring session.",
  },
  {
    value: "group-parent-ed",
    label: "Group parent education",
    helper: "Parent workshop or class. May charge a host family.",
  },
  {
    value: "stem-fair",
    label: "School STEM fair",
    helper: "STEM fair appearance — counterparty is usually a school.",
  },
  {
    value: "family-advising",
    label: "Family / parental advising",
    helper: "Coaching session for a family.",
  },
  {
    value: "speaking",
    label: "Speaking engagement",
    helper: "Public speaking, conference, or one-off engagement.",
  },
];

interface PayerRow {
  kind: "family" | "parent" | "other";
  familyId?: string;
  parentId?: string;
  counterpartyName?: string;
  pct: string;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export default function NewSessionPage() {
  const router = useRouter();
  const fetchApi = useApi();

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [tutors, setTutors] = useState<TutorRow[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [offering, setOffering] = useState<Offering>("tutoring");
  const [type, setType] = useState<"individual" | "group">("individual");
  const [studentId, setStudentId] = useState("");
  const [groupStudents, setGroupStudents] = useState<string[]>([]);
  const [tutorId, setTutorId] = useState("");
  // Session lead — the tutor actually delivering this session. Optional per
  // 5/17 spec. Defaults to the assigned tutor; can be overridden when
  // someone else covers (substitute, paired tutor, Paula stepping in).
  const [sessionLeadId, setSessionLeadId] = useState("");
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState(nowHHMM());
  const [duration, setDuration] = useState("60");
  const [amount, setAmount] = useState(""); // dollars
  const [notes, setNotes] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");

  const [singleVsSplit, setSingleVsSplit] = useState<"single" | "split">(
    "single",
  );
  const [payers, setPayers] = useState<PayerRow[]>([
    { kind: "family", familyId: "", pct: "100" },
  ]);

  // Inline student email — lets Paula add/update a student's email mid-session
  // without leaving this page. Saved to the student record on submit.
  const [inlineStudentEmail, setInlineStudentEmail] = useState("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  // Searchable student combobox
  const [studentSearch, setStudentSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchApi("/api/students").then((r) => r.json()),
      fetchApi("/api/families").then((r) => r.json()),
      fetchApi("/api/admin/tutors")
        .then((r) => r.json())
        .catch(() => ({ tutors: [] })),
    ])
      .then(([s, f, t]) => {
        setStudents(s.students || []);
        setFamilies(f.families || []);
        setTutors(t.tutors || []);
      })
      .finally(() => setLoadingRefs(false));
  }, [fetchApi]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => displayName(s).toLowerCase().includes(q));
  }, [students, studentSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const amountCents = useMemo(() => {
    const n = parseFloat(amount);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  }, [amount]);

  const totalPct = useMemo(() => {
    if (singleVsSplit !== "split") return 100;
    return payers.reduce((acc, p) => acc + (parseFloat(p.pct) || 0), 0);
  }, [singleVsSplit, payers]);

  const splitValid = Math.abs(totalPct - 100) < 0.01;

  function updatePayer(idx: number, patch: Partial<PayerRow>) {
    setPayers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    );
  }

  function addPayer() {
    setPayers((prev) => [
      ...prev,
      { kind: "family", familyId: "", pct: "0" },
    ]);
  }

  function removePayer(idx: number) {
    setPayers((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!studentId && groupStudents.length === 0) {
      setError("Pick a student (or add students for a group session).");
      return;
    }
    if (singleVsSplit === "split" && !splitValid) {
      setError(
        `Payer split must total 100% (currently ${totalPct.toFixed(2)}%).`,
      );
      return;
    }

    const payerPayload =
      singleVsSplit === "split"
        ? payers.map((p) => ({
            familyId: p.kind === "family" ? p.familyId || undefined : undefined,
            parentId: p.kind === "parent" ? p.parentId || undefined : undefined,
            counterpartyName:
              p.kind === "other" ? p.counterpartyName?.trim() : undefined,
            pct: parseFloat(p.pct) || 0,
          }))
        : undefined;

    setSaving(true);
    try {
      const res = await fetchApi("/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          studentId:
            type === "individual" ? studentId : groupStudents[0] || undefined,
          students: type === "group" ? groupStudents : undefined,
          date,
          time,
          duration: parseInt(duration, 10) || 60,
          type,
          offering,
          tutorId: tutorId || undefined,
          sessionLeadId: sessionLeadId || undefined,
          amountCents,
          notes,
          privateNotes,
          status: "completed",
          payers: payerPayload,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Could not save session");
      }
      setSuccess("Session logged.");
      setTimeout(() => router.push("/admin"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-3 w-3" /> Admin home
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mt-2">
          Log a session
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Capture what happened, who attended, what to charge, and how to split
          the bill across payers.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5 admin-stagger">
        <Card className="border border-neutral-200 rounded-lg">
          <CardContent className="py-4 space-y-4">
            <h2 className="font-medium text-neutral-900">Session type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OFFERINGS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col gap-1 border rounded-md p-3 text-sm cursor-pointer ${
                    offering === opt.value
                      ? "border-mathitude-purple bg-mathitude-purple/5"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="offering"
                      checked={offering === opt.value}
                      onChange={() => setOffering(opt.value)}
                    />
                    <span className="font-medium text-neutral-900">
                      {opt.label}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 ml-5">
                    {opt.helper}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-2 border-t border-neutral-200">
              <span className="text-sm font-medium text-neutral-900">
                Format
              </span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="type"
                  checked={type === "individual"}
                  onChange={() => setType("individual")}
                />
                Individual
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="type"
                  checked={type === "group"}
                  onChange={() => setType("group")}
                />
                Group
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-200 rounded-lg">
          <CardContent className="py-4 space-y-4">
            <h2 className="font-medium text-neutral-900">Who & when</h2>
            {loadingRefs ? (
              <p className="text-sm text-neutral-500">Loading…</p>
            ) : type === "individual" ? (
              <label className="text-sm text-neutral-700 block">
                Student
                <div ref={comboboxRef} className="relative mt-1">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setDropdownOpen(true);
                      setStudentId("");
                      setShowEmailPrompt(false);
                      setInlineStudentEmail("");
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    onKeyDown={(e) => { if (e.key === "Escape") setDropdownOpen(false); }}
                    placeholder="Search student by name…"
                    autoComplete="off"
                    className={`w-full border rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-mathitude-purple/30 ${
                      studentId ? "border-mathitude-purple bg-mathitude-purple/5 font-medium text-neutral-900" : "border-neutral-200"
                    }`}
                  />
                  {studentSearch && (
                    <button
                      type="button"
                      onClick={() => { setStudentId(""); setStudentSearch(""); setDropdownOpen(false); setShowEmailPrompt(false); setInlineStudentEmail(""); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-base leading-none"
                      aria-label="Clear"
                    >
                      ×
                    </button>
                  )}
                  {dropdownOpen && filteredStudents.length > 0 && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-white border border-neutral-200 rounded-md shadow-lg max-h-56 overflow-auto">
                      {filteredStudents.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setStudentId(s.id);
                            setStudentSearch(displayName(s));
                            setDropdownOpen(false);
                            setShowEmailPrompt(false);
                            setInlineStudentEmail("");
                            if (!amount.trim() && s.rate && s.rate > 0) {
                              setAmount(String(s.rate));
                            }
                          }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-baseline gap-2 hover:bg-purple-50 ${
                            s.id === studentId ? "bg-purple-50 text-mathitude-purple" : "text-neutral-900"
                          }`}
                        >
                          <span className="flex-1">{displayName(s)}</span>
                          {s.grade && (
                            <span className="text-xs text-neutral-400 shrink-0">Gr {s.grade}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {dropdownOpen && filteredStudents.length === 0 && studentSearch && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-white border border-neutral-200 rounded-md shadow-md px-3 py-2 text-sm text-neutral-500">
                      No students match &ldquo;{studentSearch}&rdquo;
                    </div>
                  )}
                </div>
                {studentId &&
                  (() => {
                    const picked = students.find((s) => s.id === studentId);
                    return (
                      <>
                        {picked?.rate ? (
                          <span className="block text-xs text-neutral-500 mt-1">
                            Default rate: ${picked.rate.toLocaleString()} — auto-filled below, override if needed.
                          </span>
                        ) : null}
                        {picked && !picked.studentEmail && (
                          <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-amber-800 font-medium">No student email — notes go to parent only</p>
                                {!showEmailPrompt ? (
                                  <button
                                    type="button"
                                    onClick={() => setShowEmailPrompt(true)}
                                    className="mt-0.5 text-xs text-amber-700 underline hover:no-underline"
                                  >
                                    Add student email now
                                  </button>
                                ) : (
                                  <div className="mt-2 flex items-center gap-2">
                                    <input
                                      type="email"
                                      value={inlineStudentEmail}
                                      onChange={(e) => setInlineStudentEmail(e.target.value)}
                                      placeholder="student@example.com"
                                      className="flex-1 min-w-0 border border-amber-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                                    />
                                    <button
                                      type="button"
                                      disabled={savingEmail || !inlineStudentEmail.trim()}
                                      onClick={async () => {
                                        setSavingEmail(true);
                                        try {
                                          const r = await fetchApi(`/api/students/${studentId}`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ studentEmail: inlineStudentEmail.trim() }),
                                          });
                                          if (r.ok) {
                                            setStudents((prev) =>
                                              prev.map((s) =>
                                                s.id === studentId
                                                  ? { ...s, studentEmail: inlineStudentEmail.trim() }
                                                  : s,
                                              ),
                                            );
                                            setShowEmailPrompt(false);
                                          }
                                        } finally {
                                          setSavingEmail(false);
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 rounded bg-amber-600 text-white text-xs px-2 py-1 hover:bg-amber-700 disabled:opacity-50"
                                    >
                                      <Mail className="h-3 w-3" />
                                      {savingEmail ? "Saving…" : "Save"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowEmailPrompt(false)}
                                      className="text-xs text-neutral-400 hover:text-neutral-600"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {picked?.studentEmail && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#7030A0]">
                            <Mail className="h-3 w-3" />
                            Notes will also go to {picked.studentEmail}
                          </div>
                        )}
                      </>
                    );
                  })()}
              </label>
            ) : (
              <div>
                <p className="text-sm text-neutral-700 mb-1">Students in group</p>
                <p className="text-xs text-neutral-500 mb-2">
                  Pick everyone who attended — group sessions store all
                  participants.
                </p>
                <div className="space-y-1 max-h-48 overflow-auto border border-neutral-200 rounded-md p-2">
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={groupStudents.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGroupStudents((p) => [...p, s.id]);
                          } else {
                            setGroupStudents((p) =>
                              p.filter((x) => x !== s.id),
                            );
                          }
                        }}
                      />
                      <span>{displayName(s)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-sm text-neutral-700 block">
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-neutral-700 block">
                Time
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-neutral-700 block">
                Duration (min)
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm"
                />
              </label>
            </div>

            {tutors.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-neutral-700 block">
                  Assigned tutor
                  <select
                    value={tutorId}
                    onChange={(e) => {
                      setTutorId(e.target.value);
                      // Default session lead to assigned tutor when nothing
                      // has been explicitly set.
                      if (!sessionLeadId) setSessionLeadId(e.target.value);
                    }}
                    className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="">— optional —</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-neutral-700 block">
                  Session lead (optional)
                  <select
                    value={sessionLeadId}
                    onChange={(e) => setSessionLeadId(e.target.value)}
                    className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="">— same as assigned tutor —</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}
                      </option>
                    ))}
                  </select>
                  <span className="block text-xs text-neutral-400 mt-1">
                    Use when a different tutor actually delivers the session
                    (substitute, paired tutor, Paula stepping in). Rate
                    overrides + tutor-specific pricing track on the session
                    row.
                  </span>
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-neutral-200 rounded-lg">
          <CardContent className="py-4 space-y-4">
            <h2 className="font-medium text-neutral-900">Charges</h2>
            <label className="text-sm text-neutral-700 block">
              Total charge ($)
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm"
              />
              <span className="block text-xs text-neutral-400 mt-1">
                Leave blank to bill automatically from the student&apos;s rate
                prorated by duration (e.g. a 45-min session bills ¾ of the
                hourly rate). For a shared/group session this total is split
                evenly across the attending students; with a payer split below
                it&apos;s divided by the percentages.
              </span>
            </label>

            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-900">
                Payer selection
              </p>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={singleVsSplit === "single"}
                    onChange={() => setSingleVsSplit("single")}
                  />
                  Single payer (use the student&apos;s primary family)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={singleVsSplit === "split"}
                    onChange={() => setSingleVsSplit("split")}
                  />
                  Split across multiple payers
                </label>
              </div>

              {singleVsSplit === "split" && (
                <div className="space-y-2">
                  {payers.map((p, i) => {
                    const pct = parseFloat(p.pct) || 0;
                    const expected = (amountCents * pct) / 100;
                    return (
                      <Card
                        key={i}
                        className="py-0 border border-neutral-200 rounded-lg"
                      >
                        <CardContent className="py-3 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              value={p.kind}
                              onChange={(e) =>
                                updatePayer(i, {
                                  kind: e.target.value as PayerRow["kind"],
                                  familyId: undefined,
                                  parentId: undefined,
                                  counterpartyName: undefined,
                                })
                              }
                              className="border border-neutral-200 rounded-md px-2 py-1 text-sm bg-white"
                            >
                              <option value="family">Family</option>
                              <option value="parent">Specific parent</option>
                              <option value="other">Other counterparty</option>
                            </select>

                            {p.kind === "family" && (
                              <select
                                value={p.familyId || ""}
                                onChange={(e) =>
                                  updatePayer(i, { familyId: e.target.value })
                                }
                                className="border border-neutral-200 rounded-md px-2 py-1 text-sm bg-white flex-1 min-w-[12rem]"
                              >
                                <option value="">— pick a family —</option>
                                {families.map((f) => {
                                  const lastName = f.primary?.lastName?.trim();
                                  const firstName = f.primary?.firstName?.trim();
                                  const label = lastName
                                    ? `${lastName} family`
                                    : firstName
                                      ? `${firstName}'s family`
                                      : "Family";
                                  return (
                                    <option key={f.id} value={f.id} title={f.id}>
                                      {label}
                                    </option>
                                  );
                                })}
                              </select>
                            )}

                            {p.kind === "parent" && (
                              <select
                                value={p.parentId || ""}
                                onChange={(e) =>
                                  updatePayer(i, { parentId: e.target.value })
                                }
                                className="border border-neutral-200 rounded-md px-2 py-1 text-sm bg-white flex-1 min-w-[12rem]"
                              >
                                <option value="">— pick a parent —</option>
                                {families.flatMap((f) => {
                                  const famLast = f.primary?.lastName?.trim();
                                  const famLabel = famLast
                                    ? `${famLast} family`
                                    : "Family";
                                  return (f.parents || []).map((par) => (
                                    <option key={par.id} value={par.id} title={par.id}>
                                      {par.firstName} {par.lastName} — {famLabel}
                                    </option>
                                  ));
                                })}
                              </select>
                            )}

                            {p.kind === "other" && (
                              <input
                                type="text"
                                placeholder="e.g. Castro Elementary School"
                                value={p.counterpartyName || ""}
                                onChange={(e) =>
                                  updatePayer(i, {
                                    counterpartyName: e.target.value,
                                  })
                                }
                                className="border border-neutral-200 rounded-md px-2 py-1 text-sm flex-1 min-w-[12rem]"
                              />
                            )}

                            <div className="flex items-center gap-1 ml-auto">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={p.pct}
                                onChange={(e) =>
                                  updatePayer(i, { pct: e.target.value })
                                }
                                className="w-20 border border-neutral-200 rounded-md px-2 py-1 text-sm text-right"
                              />
                              <span className="text-sm text-neutral-500">
                                %
                              </span>
                              <span className="text-xs text-neutral-400 ml-2 tabular-nums">
                                (${(expected / 100).toFixed(2)})
                              </span>
                              {payers.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="ml-2 text-red-600 hover:bg-red-50"
                                  onClick={() => removePayer(i)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPayer}
                    >
                      <Plus className="h-3 w-3" />
                      Add payer
                    </Button>
                    <span
                      className={`text-sm tabular-nums ${
                        splitValid ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      Total: {totalPct.toFixed(2)}%
                      {!splitValid && " — must equal 100%"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-200 rounded-lg">
          <CardContent className="py-4 space-y-3">
            <h2 className="font-medium text-neutral-900">Notes</h2>
            <label className="text-sm text-neutral-700 block">
              Shared notes (visible to family)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What we worked on, what to practice this week…"
                className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-700 block">
              Private notes (staff only)
              <textarea
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                rows={2}
                placeholder="Internal observations — never shown to the family."
                className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm"
              />
            </label>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md border-0 badge-error px-3 py-2 text-sm slide-down-in">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border-0 badge-success px-3 py-2 text-sm slide-down-in">
            {success}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Link href="/admin">
            <Button type="button" variant="outline" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#7030A0] hover:bg-[#5d288a] text-white uppercase tracking-wide"
          >
            {saving ? "Saving…" : "Log session"}
          </Button>
        </div>
      </form>
    </div>
  );
}
