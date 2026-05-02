"use client";

import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { useRouter } from "next/navigation";
import { Search, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { titleCase } from "@/lib/title-case";
import type { Student } from "@/lib/types";

const gradeOptions = [
  "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
];

const inputClass =
  "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300";

function fullName(s: Student): string {
  const fn = titleCase(s.firstName);
  const ln = titleCase(s.lastName);
  if (!ln || ln === fn) return fn || s.id;
  return `${fn} ${ln}`;
}

function gradeLabel(g: string | undefined): string {
  if (!g) return "—";
  const u = g.toUpperCase();
  if (u === "K" || u === "KG") return "K";
  if (u === "PK" || u === "PK3" || u === "PK4") return "Pre-K";
  return g;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const fetchApi = useApi();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [grade, setGrade] = useState("K");
  const [status, setStatus] = useState<"active" | "waitlist">("active");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [sessionType, setSessionType] = useState<"individual" | "group">("individual");
  const [rate, setRate] = useState("");

  function fetchStudents() {
    setLoading(true);
    fetchApi("/api/students")
      .then((res) => res.json())
      .then((json) => {
        setStudents(json.students || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setGrade("K");
    setStatus("active");
    setParentName("");
    setParentEmail("");
    setParentPhone("");
    setSessionType("individual");
    setRate("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetchApi("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          grade,
          status,
          parentName,
          parentEmail,
          parentPhone,
          sessionType,
          rate: parseFloat(rate) || 0,
        }),
      });
      if (res.ok) {
        resetForm();
        setShowForm(false);
        fetchStudents();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return students
      .filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (gradeFilter !== "all" && s.grade !== gradeFilter) return false;
        if (!q) return true;
        const hay =
          `${s.firstName} ${s.lastName} ${s.parentName} ${s.parentEmail} ${s.grade}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }, [students, search, gradeFilter, statusFilter]);

  const activeCount = students.filter((s) => s.status === "active").length;
  const waitlistCount = students.filter((s) => s.status === "waitlist").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Students
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {activeCount} active &middot; {waitlistCount} on waitlist &middot;{" "}
            {students.length} total
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Student"}
        </Button>
      </div>

      {showForm && (
        <Card className="border border-neutral-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-neutral-900 tracking-tight mb-4">
            New Student
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Grade
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={inputClass}
                >
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g === "K" ? "Kindergarten" : `Grade ${g}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "waitlist")}
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="waitlist">Waitlist</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Session Type
                </label>
                <select
                  value={sessionType}
                  onChange={(e) =>
                    setSessionType(e.target.value as "individual" | "group")
                  }
                  className={inputClass}
                >
                  <option value="individual">Individual</option>
                  <option value="group">Group</option>
                </select>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Parent Name
                </label>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className={inputClass}
                  placeholder="Parent full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Parent Email
                </label>
                <input
                  type="email"
                  required
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className={inputClass}
                  placeholder="parent@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Parent Phone
                </label>
                <input
                  type="tel"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className={inputClass}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="max-w-[200px]">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Rate ($/session)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className={inputClass}
                placeholder="75.00"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
              >
                {submitting ? "Saving..." : "Save Student"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="border border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search students, parents, emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
          />
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white py-2.5 px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
        >
          <option value="all">All grades</option>
          {gradeOptions.map((g) => (
            <option key={g} value={g}>
              {g === "K" ? "Kindergarten" : `Grade ${g}`}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white py-2.5 px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="waitlist">Waitlist</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-sm">
            {students.length === 0
              ? "No students yet. Add your first student to get started."
              : "No students match the current filters."}
          </p>
        </div>
      ) : (
        <Card className="py-0 overflow-hidden border border-neutral-200 rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/admin/students/${s.id}`)}
                    className="cursor-pointer hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {fullName(s)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {gradeLabel(s.grade)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          s.status === "active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : s.status === "waitlist"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-neutral-100 text-neutral-600 border-neutral-200"
                        }
                      >
                        {s.status === "active"
                          ? "Active"
                          : s.status === "waitlist"
                          ? "Waitlist"
                          : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 capitalize">
                      {s.sessionType}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      <div className="font-medium text-neutral-900 text-sm">
                        {titleCase(s.parentName)}
                      </div>
                      <div className="text-xs text-neutral-500 truncate max-w-[220px]">
                        {s.parentEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-neutral-400">
                      →
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
