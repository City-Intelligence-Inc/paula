"use client";

import * as React from "react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ParentNotesView } from "@/components/notes/parent-notes-view";
import {
  DEMO_STUDENTS,
  DEMO_FAMILIES,
  demoNotesForStudent,
  studentsVisibleTo,
} from "@/lib/session-notes";

// /notes — the family-facing notes page (FEATURE_LIST N-9), matching
// PARENT_VIEWING_NOTES.png. SYNTHETIC data. Demo controls let you view as a
// Parent (scoped to one family, switching between that family's children) or a
// Student (locked to their own record — R-7). In production the role + scope
// come from the signed-in user, not these controls.
export default function NotesPage() {
  const [asRole, setAsRole] = React.useState<"parent" | "student">("parent");
  const [familyId, setFamilyId] = React.useState(DEMO_FAMILIES[0].id);
  const [selfId, setSelfId] = React.useState(DEMO_STUDENTS[0].id);

  const visible = studentsVisibleTo(asRole, { familyId, studentId: selfId });
  const [childId, setChildId] = React.useState(visible[0]?.id ?? "");

  // Keep the selected child inside the current family scope.
  React.useEffect(() => {
    if (visible.length && !visible.some((s) => s.id === childId)) {
      setChildId(visible[0].id);
    }
  }, [visible, childId]);

  const studentId = asRole === "student" ? selfId : childId;
  const student = DEMO_STUDENTS.find((s) => s.id === studentId);
  const notes = student ? demoNotesForStudent(student.id) : [];

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* DEMO controls — not production UI */}
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 pt-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Demo · view as
          </span>
          {(["parent", "student"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setAsRole(r)}
              className="rounded-full px-3 py-1 text-xs font-medium ring-1 ring-border-warm transition-colors"
              style={
                asRole === r
                  ? { backgroundColor: "#7030A0", color: "#fff" }
                  : { color: "#7030A0" }
              }
            >
              {r === "parent" ? "Parent" : "Student"}
            </button>
          ))}
          {asRole === "parent" ? (
            <>
              <label className="ml-2 flex items-center gap-1.5 text-xs text-text-muted">
                Family
                <select
                  value={familyId}
                  onChange={(e) => setFamilyId(e.target.value)}
                  className="rounded-md border border-border-warm bg-white px-2 py-1 text-xs"
                >
                  {DEMO_FAMILIES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              {visible.length > 1 && (
                <label className="flex items-center gap-1.5 text-xs text-text-muted">
                  Child
                  <select
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="rounded-md border border-border-warm bg-white px-2 py-1 text-xs"
                  >
                    {visible.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          ) : (
            <label className="ml-2 flex items-center gap-1.5 text-xs text-text-muted">
              as student
              <select
                value={selfId}
                onChange={(e) => setSelfId(e.target.value)}
                className="rounded-md border border-border-warm bg-white px-2 py-1 text-xs"
              >
                {DEMO_STUDENTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {student ? (
          <ParentNotesView
            studentName={`${student.firstName} ${student.lastName}`}
            notes={notes}
          />
        ) : (
          <p className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-text-muted">
            No student in scope.
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
