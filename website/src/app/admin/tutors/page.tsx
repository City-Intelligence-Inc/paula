"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Plus, Trash2, Mail, Phone, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  active?: boolean;
  createdAt?: string;
}

interface AssignedStudent {
  id: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
}

const inputClass =
  "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300";

export default function TutorsPage() {
  const fetchApi = useApi();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<
    Record<string, AssignedStudent[] | "loading">
  >({});

  const loadTutors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi("/api/admin/tutors");
      const data = await res.json();
      setTutors(data.tutors || []);
    } catch (err) {
      console.error("[tutors] load failed", err);
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    loadTutors();
  }, [loadTutors]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetchApi("/api/admin/tutors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not create tutor");
        return;
      }
      setFormState({ firstName: "", lastName: "", email: "", phone: "" });
      setAdding(false);
      await loadTutors();
    } catch (err) {
      console.error("[tutors] create failed", err);
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tutor: Tutor) {
    if (
      !confirm(
        `Remove ${tutor.firstName} ${tutor.lastName}? Students assigned to this tutor must be reassigned first.`,
      )
    )
      return;
    const res = await fetchApi(`/api/admin/tutors/${tutor.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Delete failed");
      return;
    }
    await loadTutors();
  }

  async function toggleExpand(tutor: Tutor) {
    const next = expanded === tutor.id ? null : tutor.id;
    setExpanded(next);
    if (next && !assignments[tutor.id]) {
      setAssignments((prev) => ({ ...prev, [tutor.id]: "loading" }));
      try {
        const res = await fetchApi(`/api/admin/tutors/${tutor.id}`);
        const data = await res.json();
        setAssignments((prev) => ({
          ...prev,
          [tutor.id]: (data.students || []) as AssignedStudent[],
        }));
      } catch {
        setAssignments((prev) => ({ ...prev, [tutor.id]: [] }));
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Tutors
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage the tutors who work with Mathitude students. Assign tutors
            to students from each student&apos;s detail page.
          </p>
        </div>
        {!adding && (
          <Button
            onClick={() => setAdding(true)}
            className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Tutor
          </Button>
        )}
      </div>

      {adding && (
        <Card className="border border-neutral-200 rounded-lg overflow-hidden">
          <form onSubmit={handleAdd} className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              New Tutor
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formState.firstName}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, firstName: e.target.value }))
                  }
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
                  value={formState.lastName}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, lastName: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, email: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formState.phone}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, phone: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
              >
                {saving ? "Saving..." : "Add Tutor"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className="border border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      ) : tutors.length === 0 ? (
        <Card className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="p-10 text-center text-sm text-neutral-500">
            No tutors yet. Add your first tutor to start assigning students.
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {tutors.map((t) => {
            const assigned = assignments[t.id];
            return (
              <Card
                key={t.id}
                className="border border-neutral-200 rounded-lg overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-[#7030A0]" />
                        <h3 className="text-base font-semibold text-neutral-900 truncate">
                          {t.firstName} {t.lastName}
                        </h3>
                        {t.active === false && (
                          <span className="text-xs text-neutral-500 px-2 py-0.5 rounded-full bg-neutral-100">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                        {t.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {t.email}
                          </span>
                        )}
                        {t.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {t.phone}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-neutral-300">
                          {t.id}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toggleExpand(t)}
                        className="border border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md text-xs"
                      >
                        {expanded === t.id ? "Hide students" : "View students"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleDelete(t)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                        aria-label="Remove tutor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {expanded === t.id && (
                    <>
                      <Separator className="my-4" />
                      {assigned === "loading" ? (
                        <p className="text-xs text-neutral-400">Loading…</p>
                      ) : !assigned || assigned.length === 0 ? (
                        <p className="text-xs text-neutral-500">
                          No students currently assigned to this tutor.
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {assigned.map((s) => (
                            <li
                              key={s.id}
                              className="text-sm text-neutral-700 flex items-center justify-between"
                            >
                              <a
                                href={`/admin/students/${s.id}`}
                                className="hover:text-[#7030A0]"
                              >
                                {s.firstName} {s.lastName}
                                {s.grade ? (
                                  <span className="text-neutral-400">
                                    {" "}
                                    · Grade {s.grade}
                                  </span>
                                ) : null}
                              </a>
                              <span className="font-mono text-[10px] text-neutral-300">
                                {s.id}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
