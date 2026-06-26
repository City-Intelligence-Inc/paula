"use client";

import * as React from "react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ParentNotesView } from "@/components/notes/parent-notes-view";
import { DEMO_STUDENTS, demoNotesForStudent } from "@/lib/session-notes";

// /notes — the family-facing notes page (FEATURE_LIST N-9), matching
// PARENT_VIEWING_NOTES.png. SYNTHETIC data. Demo controls let you view as a
// Parent (who can switch between their children) or a Student (locked to their
// own record — R-7, "students only see their own information"). In production
// the role + the child set come from the signed-in user, not these controls.
//
// NOTE: the two demo students are treated as siblings in one family here so the
// parent multi-child switch is demonstrable. The real family model lands in the
// role-scoping pass (#2).
export default function NotesPage() {
  const [asRole, setAsRole] = React.useState<"parent" | "student">("parent");
  const [childId, setChildId] = React.useState(DEMO_STUDENTS[0].id);

  // A student only ever sees themselves.
  const studentId = asRole === "student" ? DEMO_STUDENTS[0].id : childId;
  const student = DEMO_STUDENTS.find((s) => s.id === studentId)!;
  const notes = demoNotesForStudent(studentId);

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
            <label className="ml-2 flex items-center gap-2 text-xs text-text-muted">
              Child
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="rounded-md border border-border-warm bg-white px-2 py-1 text-xs"
              >
                {DEMO_STUDENTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="ml-2 text-[11px] text-text-muted">
              Students only see their own notes — no sibling switch.
            </span>
          )}
        </div>

        <ParentNotesView
          studentName={`${student.firstName} ${student.lastName}`}
          notes={notes}
        />
      </main>
      <Footer />
    </>
  );
}
