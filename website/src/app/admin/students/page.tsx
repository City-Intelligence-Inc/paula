"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Search, Plus, Phone, Mail, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Student } from "@/lib/types";

const gradeOptions = [
  "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
];

const inputClass =
  "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300";

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
    api("/api/students")
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
      const res = await api("/api/students", {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif italic font-medium text-neutral-900 tracking-tight">
            Students
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Loading students...</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      </div>
    );
  }

  const filtered = students.filter(
    (s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.parentName.toLowerCase().includes(search.toLowerCase()) ||
      s.grade.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = students.filter((s) => s.status === "active").length;
  const waitlistCount = students.filter((s) => s.status === "waitlist").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif italic font-medium text-neutral-900 tracking-tight">
            Students
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {activeCount} active &middot; {waitlistCount} on waitlist
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

      {/* Add Student Form */}
      {showForm && (
        <Card className="border border-neutral-200 rounded-lg p-6">
          <h2 className="text-lg font-serif italic font-medium text-neutral-900 tracking-tight mb-4">
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search students, parents, or grades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
        />
      </div>

      {/* Student cards */}
      <div className="space-y-3">
        {students.length === 0 && !search && (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">No students yet. Add your first student to get started.</p>
          </div>
        )}

        {filtered.map((student) => (
          <Card
            key={student.id}
            className="py-0 overflow-hidden border border-neutral-200 rounded-lg cursor-pointer hover:border-neutral-300 transition-colors"
            onClick={() => router.push(`/admin/students/${student.id}`)}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
              {/* Name & Grade */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-neutral-900 truncate">
                    {student.firstName} {student.lastName}
                  </h3>
                  <Badge
                    className={
                      student.status === "active"
                        ? "bg-neutral-900/5 text-neutral-900 border-neutral-200"
                        : "bg-neutral-100 text-neutral-600 border-neutral-200"
                    }
                  >
                    {student.status === "active" ? "Active" : student.status === "waitlist" ? "Waitlist" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Grade {student.grade}
                </p>
              </div>

              {/* Session type */}
              <div className="sm:text-center sm:min-w-[120px]">
                <p className="text-xs text-neutral-400 uppercase tracking-wider">
                  Session Type
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  {student.sessionType === "individual" ? "Individual" : "Group"}
                </p>
              </div>

              <Separator
                orientation="vertical"
                className="hidden sm:block h-10"
              />

              {/* Parent contact */}
              <div className="sm:min-w-[200px]">
                <p className="text-xs text-neutral-400 uppercase tracking-wider">
                  Parent Contact
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  {student.parentName}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <Phone className="h-3 w-3" />
                    {student.parentPhone}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <Mail className="h-3 w-3" />
                    {student.parentEmail}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && students.length > 0 && (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">No students found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
