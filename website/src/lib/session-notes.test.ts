import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  columnsFor,
  normalizeRole,
  studentsVisibleTo,
  VISIBLE_FIELDS,
  CAN_EDIT_NOTES,
  CAN_SEE_BILLING,
  demoNotesForStudent,
  DEMO_STUDENTS,
} from "./session-notes.ts";

// ─────────────────────────────────────────────
// columnsFor
// ─────────────────────────────────────────────

describe("columnsFor", () => {
  // --- staff, toggle off → all four (N-8)
  test("super_admin, toggle off → all four fields", () => {
    assert.deepEqual(columnsFor("super_admin", false), [
      "sessionPlan",
      "privateNotes",
      "sessionActivities",
      "publicNotes",
    ]);
  });
  test("office_staff, toggle off → all four fields", () => {
    assert.deepEqual(columnsFor("office_staff", false), [
      "sessionPlan",
      "privateNotes",
      "sessionActivities",
      "publicNotes",
    ]);
  });
  test("tutor, toggle off → all four fields", () => {
    assert.deepEqual(columnsFor("tutor", false), [
      "sessionPlan",
      "privateNotes",
      "sessionActivities",
      "publicNotes",
    ]);
  });

  // --- in-session toggle hides Private Notes (N-3)
  test("super_admin, toggle on → Private Notes hidden", () => {
    assert.deepEqual(columnsFor("super_admin", true), [
      "sessionPlan",
      "sessionActivities",
      "publicNotes",
    ]);
  });
  test("tutor, toggle on → privateNotes not present", () => {
    assert.ok(!columnsFor("tutor", true).includes("privateNotes"));
  });
  test("toggle on keeps sessionActivities", () => {
    assert.ok(columnsFor("tutor", true).includes("sessionActivities"));
  });
  test("toggle on keeps publicNotes", () => {
    assert.ok(columnsFor("tutor", true).includes("publicNotes"));
  });

  // --- family roles fixed to the two shared fields (N-9)
  test("parent, toggle off → activities + public only", () => {
    assert.deepEqual(columnsFor("parent", false), [
      "sessionActivities",
      "publicNotes",
    ]);
  });
  test("student, toggle off → activities + public only", () => {
    assert.deepEqual(columnsFor("student", false), [
      "sessionActivities",
      "publicNotes",
    ]);
  });
  test("parent, toggle on → unchanged (toggle can't reveal more)", () => {
    assert.deepEqual(columnsFor("parent", true), [
      "sessionActivities",
      "publicNotes",
    ]);
  });
  test("student, toggle on → unchanged", () => {
    assert.deepEqual(columnsFor("student", true), [
      "sessionActivities",
      "publicNotes",
    ]);
  });
  test("parent never sees sessionPlan, toggle off", () => {
    assert.ok(!columnsFor("parent", false).includes("sessionPlan"));
  });
  test("parent never sees sessionPlan, toggle on", () => {
    assert.ok(!columnsFor("parent", true).includes("sessionPlan"));
  });
  test("student never sees privateNotes, toggle off", () => {
    assert.ok(!columnsFor("student", false).includes("privateNotes"));
  });
  test("student never sees privateNotes, toggle on", () => {
    assert.ok(!columnsFor("student", true).includes("privateNotes"));
  });
});

// ─────────────────────────────────────────────
// CAN_EDIT_NOTES (#4: only tutors + super admin author/edit)
// ─────────────────────────────────────────────

describe("CAN_EDIT_NOTES", () => {
  test("super_admin → true", () => assert.equal(CAN_EDIT_NOTES.super_admin, true));
  test("tutor → true", () => assert.equal(CAN_EDIT_NOTES.tutor, true));
  // --- view-only roles
  test("office_staff → false (view-only on notes)", () =>
    assert.equal(CAN_EDIT_NOTES.office_staff, false));
  test("parent → false", () => assert.equal(CAN_EDIT_NOTES.parent, false));
  test("student → false", () => assert.equal(CAN_EDIT_NOTES.student, false));
});

// ─────────────────────────────────────────────
// CAN_SEE_BILLING (R-4/R-5 billing-blind; only super admin + parent)
// ─────────────────────────────────────────────

describe("CAN_SEE_BILLING", () => {
  test("super_admin → true", () => assert.equal(CAN_SEE_BILLING.super_admin, true));
  test("parent → true", () => assert.equal(CAN_SEE_BILLING.parent, true));
  // --- billing-blind
  test("office_staff → false", () => assert.equal(CAN_SEE_BILLING.office_staff, false));
  test("tutor → false", () => assert.equal(CAN_SEE_BILLING.tutor, false));
  test("student → false", () => assert.equal(CAN_SEE_BILLING.student, false));
});

// ─────────────────────────────────────────────
// VISIBLE_FIELDS (must equal columnsFor with the toggle off)
// ─────────────────────────────────────────────

describe("VISIBLE_FIELDS", () => {
  for (const role of [
    "super_admin",
    "office_staff",
    "tutor",
    "parent",
    "student",
  ] as const) {
    test(`${role} matches columnsFor(${role}, false)`, () => {
      assert.deepEqual(VISIBLE_FIELDS[role], columnsFor(role, false));
    });
  }
});

// ─────────────────────────────────────────────
// normalizeRole (bridges the legacy master_admin/admin names)
// ─────────────────────────────────────────────

describe("normalizeRole", () => {
  // --- legacy codebase roles → spec roles
  test("master_admin → super_admin", () =>
    assert.equal(normalizeRole("master_admin"), "super_admin"));
  test("admin → office_staff", () =>
    assert.equal(normalizeRole("admin"), "office_staff"));
  test("tutor → tutor", () => assert.equal(normalizeRole("tutor"), "tutor"));
  // --- fallbacks (least-privileged family view)
  test("undefined → parent", () => assert.equal(normalizeRole(undefined), "parent"));
  test("null → parent", () => assert.equal(normalizeRole(null), "parent"));
  test("empty string → parent", () => assert.equal(normalizeRole(""), "parent"));
  test("unknown string → parent", () =>
    assert.equal(normalizeRole("nonsense"), "parent"));
});

// ─────────────────────────────────────────────
// studentsVisibleTo (R-2 / R-5 / R-6 / R-7)
// ─────────────────────────────────────────────

describe("studentsVisibleTo", () => {
  // --- staff see everyone
  test("super_admin → all students", () =>
    assert.equal(studentsVisibleTo("super_admin", {}).length, DEMO_STUDENTS.length));
  test("office_staff → all students", () =>
    assert.equal(studentsVisibleTo("office_staff", {}).length, DEMO_STUDENTS.length));

  // --- tutor → own portfolio only (R-5)
  test("tutor Sam → his two students", () =>
    assert.deepEqual(
      studentsVisibleTo("tutor", { tutorId: "tutor_sam" }).map((s) => s.id).sort(),
      ["stu_milo", "stu_robin"],
    ));
  test("tutor Sam → does NOT include another tutor's student", () =>
    assert.ok(
      !studentsVisibleTo("tutor", { tutorId: "tutor_sam" })
        .map((s) => s.id)
        .includes("stu_ada"),
    ));
  test("tutor Jess → only her student", () =>
    assert.deepEqual(
      studentsVisibleTo("tutor", { tutorId: "tutor_jess" }).map((s) => s.id),
      ["stu_ada"],
    ));

  // --- parent → own family only (R-2/R-6)
  test("parent in Avery family → both Avery children", () =>
    assert.deepEqual(
      studentsVisibleTo("parent", { familyId: "fam_avery" }).map((s) => s.id).sort(),
      ["stu_milo", "stu_robin"],
    ));
  test("parent in Avery family → does NOT see the Chen child", () =>
    assert.ok(
      !studentsVisibleTo("parent", { familyId: "fam_avery" })
        .map((s) => s.id)
        .includes("stu_ada"),
    ));

  // --- student → self only (R-7)
  test("student → only themselves", () =>
    assert.deepEqual(
      studentsVisibleTo("student", { studentId: "stu_robin" }).map((s) => s.id),
      ["stu_robin"],
    ));

  // --- fail-closed on missing identity
  test("tutor with no tutorId → empty", () =>
    assert.equal(studentsVisibleTo("tutor", {}).length, 0));
  test("parent with no familyId → empty", () =>
    assert.equal(studentsVisibleTo("parent", {}).length, 0));
  test("student with no studentId → empty", () =>
    assert.equal(studentsVisibleTo("student", {}).length, 0));
});

// ─────────────────────────────────────────────
// demoNotesForStudent (group sessions — #1: siblings never cross over)
// ─────────────────────────────────────────────

describe("demoNotesForStudent", () => {
  // --- ordering
  test("returns most-recent-first", () => {
    const n = demoNotesForStudent("stu_robin");
    for (let i = 1; i < n.length; i++) {
      assert.ok(n[i - 1].dateTime >= n[i].dateTime);
    }
  });

  // --- group session linkage + isolation
  test("robin has a group note", () =>
    assert.ok(demoNotesForStudent("stu_robin").some((n) => n.noteGroupId)));
  test("milo has a group note", () =>
    assert.ok(demoNotesForStudent("stu_milo").some((n) => n.noteGroupId)));
  test("the two group notes share a noteGroupId", () => {
    const r = demoNotesForStudent("stu_robin").find((n) => n.noteGroupId);
    const m = demoNotesForStudent("stu_milo").find((n) => n.noteGroupId);
    assert.equal(r!.noteGroupId, m!.noteGroupId);
  });
  test("group note shares public content across siblings", () => {
    const r = demoNotesForStudent("stu_robin").find((n) => n.noteGroupId);
    const m = demoNotesForStudent("stu_milo").find((n) => n.noteGroupId);
    assert.equal(r!.publicNotes, m!.publicNotes);
  });
  test("group note keeps per-student private notes distinct", () => {
    const r = demoNotesForStudent("stu_robin").find((n) => n.noteGroupId);
    const m = demoNotesForStudent("stu_milo").find((n) => n.noteGroupId);
    assert.notEqual(r!.privateNotes, m!.privateNotes);
  });
  test("each group note belongs to its own student partition", () => {
    const r = demoNotesForStudent("stu_robin").find((n) => n.noteGroupId);
    const m = demoNotesForStudent("stu_milo").find((n) => n.noteGroupId);
    assert.equal(r!.studentId, "stu_robin");
    assert.equal(m!.studentId, "stu_milo");
  });
});
