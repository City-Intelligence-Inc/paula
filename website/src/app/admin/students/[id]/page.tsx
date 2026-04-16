"use client";

import { useEffect, useState, use } from "react";
  const fetchApi = useApi();
import { useApi } from "@/hooks/use-api";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  Pencil,
  X,
  Plus,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Student } from "@/lib/types";

interface SessionNote {
  studentId: string;
  dateTime: string;
  date: string;
  time: string;
  type: "note";
  content: string;
}

const gradeOptions = [
  "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
];

const inputClass =
  "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300";

function formatNoteDate(dateTime: string): string {
  const d = new Date(dateTime);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "waitlist" | "inactive">("active");
  const [editParentName, setEditParentName] = useState("");
  const [editParentEmail, setEditParentEmail] = useState("");
  const [editParentPhone, setEditParentPhone] = useState("");
  const [editSessionType, setEditSessionType] = useState<"individual" | "group">("individual");
  const [editRate, setEditRate] = useState("");

  // Notes state
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  function fetchStudent() {
    fetchApi(`/api/students/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.student) {
          setStudent(json.student);
          populateEditForm(json.student);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function fetchNotes() {
    fetchApi(`/api/students/${id}/notes`)
      .then((res) => res.json())
      .then((json) => {
        setNotes(json.notes || []);
      })
      .catch(() => {});
  }

  function populateEditForm(s: Student) {
    setEditFirstName(s.firstName);
    setEditLastName(s.lastName);
    setEditGrade(s.grade);
    setEditStatus(s.status);
    setEditParentName(s.parentName);
    setEditParentEmail(s.parentEmail);
    setEditParentPhone(s.parentPhone);
    setEditSessionType(s.sessionType);
    setEditRate(String(s.rate || ""));
  }

  useEffect(() => {
    fetchStudent();
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    setSaving(true);

    try {
      const res = await fetchApi(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...student,
          firstName: editFirstName,
          lastName: editLastName,
          grade: editGrade,
          status: editStatus,
          parentName: editParentName,
          parentEmail: editParentEmail,
          parentPhone: editParentPhone,
          sessionType: editSessionType,
          rate: parseFloat(editRate) || 0,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setStudent(json.student);
        setEditing(false);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setSavingNote(true);

    try {
      const res = await fetchApi(`/api/students/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      });

      if (res.ok) {
        setNoteContent("");
        fetchNotes();
      }
    } catch {
      // silently fail
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Student Details
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Loading...</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/students")}
          className="text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Students
        </Button>
        <div className="text-center py-12 text-neutral-500">
          <p className="text-sm">Student not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/admin/students")}
        className="text-neutral-600 hover:text-neutral-900 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Students
      </Button>

      {/* Student Profile Card */}
      <Card className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="p-6">
          {!editing ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
                      {student.firstName} {student.lastName}
                    </h1>
                    <Badge
                      className={
                        student.status === "active"
                          ? "bg-neutral-900/5 text-neutral-900 border-neutral-200"
                          : "bg-neutral-100 text-neutral-600 border-neutral-200"
                      }
                    >
                      {student.status === "active"
                        ? "Active"
                        : student.status === "waitlist"
                        ? "Waitlist"
                        : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">
                    Grade {student.grade} &middot;{" "}
                    {student.sessionType === "individual"
                      ? "Individual"
                      : "Group"}{" "}
                    sessions &middot; ${student.rate}/session
                  </p>
                </div>
                <Button
                  onClick={() => setEditing(true)}
                  className="border border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md bg-white hover:bg-neutral-50"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>

              <Separator className="my-4" />

              {/* Parent Contact */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 tracking-tight mb-2">
                  Parent Contact
                </h3>
                <p className="text-sm font-medium text-neutral-900">
                  {student.parentName}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                  <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                    <Phone className="h-3.5 w-3.5" />
                    {student.parentPhone}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                    <Mail className="h-3.5 w-3.5" />
                    {student.parentEmail}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Edit Form */
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
                  Edit Student
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    populateEditForm(student);
                  }}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Grade
                  </label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
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
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(
                        e.target.value as "active" | "waitlist" | "inactive"
                      )
                    }
                    className={inputClass}
                  >
                    <option value="active">Active</option>
                    <option value="waitlist">Waitlist</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Session Type
                  </label>
                  <select
                    value={editSessionType}
                    onChange={(e) =>
                      setEditSessionType(
                        e.target.value as "individual" | "group"
                      )
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
                    value={editParentName}
                    onChange={(e) => setEditParentName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Parent Email
                  </label>
                  <input
                    type="email"
                    required
                    value={editParentEmail}
                    onChange={(e) => setEditParentEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Parent Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={editParentPhone}
                    onChange={(e) => setEditParentPhone(e.target.value)}
                    className={inputClass}
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
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    populateEditForm(student);
                  }}
                  className="border border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {/* Session Notes */}
      <Card className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              Session Notes
            </h2>
          </div>

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="mb-6">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add a session note..."
              rows={3}
              className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 resize-none"
            />
            <div className="flex justify-end mt-2">
              <Button
                type="submit"
                disabled={savingNote || !noteContent.trim()}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
              >
                <Plus className="h-4 w-4 mr-1" />
                {savingNote ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </form>

          <Separator className="mb-4" />

          {/* Notes List */}
          {notes.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p className="text-sm">No session notes yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.dateTime}
                  className="border-l-2 border-neutral-200 pl-4 py-1"
                >
                  <p className="text-xs text-neutral-400 mb-1">
                    {formatNoteDate(note.dateTime)}
                  </p>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
