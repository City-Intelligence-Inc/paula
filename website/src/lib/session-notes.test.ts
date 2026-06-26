import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  columnsFor,
  normalizeRole,
  VISIBLE_FIELDS,
  CAN_EDIT_NOTES,
  CAN_SEE_BILLING,
  demoNotesForStudent,
  studentsVisibleTo,
  DEMO_STUDENTS,
} from "./session-notes.ts";

// ─────────────────────────────────────────────
// Role → visible columns (FEATURE_LIST N-8 / N-9)
// ─────────────────────────────────────────────
describe("columnsFor", () => {
  test("staff roles see all four fields when not in in-session view", () => {
    for (const role of ["super_admin", "office_staff", "tutor"] as const) {
      assert.deepEqual(columnsFor(role, false), [
        "sessionPlan",
        "privateNotes",
        "sessionActivities",
        "publicNotes",
      ]);
    }
  });

  test("in-session view hides Private Notes for staff (N-3)", () => {
    assert.deepEqual(columnsFor("tutor", true), [
      "sessionPlan",
      "sessionActivities",
      "publicNotes",
    ]);
    assert.ok(!columnsFor("super_admin", true).includes("privateNotes"));
  });

  test("parents and students only ever see the two shared fields (N-9)", () => {
    for (const role of ["parent", "student"] as const) {
      assert.deepEqual(columnsFor(role, false), [
        "sessionActivities",
        "publicNotes",
      ]);
      // the toggle cannot reveal more for a family member
      assert.deepEqual(columnsFor(role, true), [
        "sessionActivities",
        "publicNotes",
      ]);
    }
  });

  test("families never see staff-only fields under any toggle", () => {
    for (const role of ["parent", "student"] as const) {
      const cols = [...columnsFor(role, false), ...columnsFor(role, true)];
      assert.ok(!cols.includes("sessionPlan"));
      assert.ok(!cols.includes("privateNotes"));
    }
  });
});

// ─────────────────────────────────────────────
// Permissions (R-3..R-7)
// ─────────────────────────────────────────────
describe("permissions", () => {
  test("only tutors + admins can author notes (#4)", () => {
    assert.equal(CAN_EDIT_NOTES.super_admin, true);
    assert.equal(CAN_EDIT_NOTES.office_staff, true);
    assert.equal(CAN_EDIT_NOTES.tutor, true);
    assert.equal(CAN_EDIT_NOTES.parent, false);
    assert.equal(CAN_EDIT_NOTES.student, false);
  });

  test("staff + tutors are billing-blind; only super admin + parent see money (R-4/R-5)", () => {
    assert.equal(CAN_SEE_BILLING.super_admin, true);
    assert.equal(CAN_SEE_BILLING.parent, true);
    assert.equal(CAN_SEE_BILLING.office_staff, false);
    assert.equal(CAN_SEE_BILLING.tutor, false);
    assert.equal(CAN_SEE_BILLING.student, false);
  });

  test("VISIBLE_FIELDS matches columnsFor with toggle off", () => {
    for (const role of ["super_admin", "office_staff", "tutor", "parent", "student"] as const) {
      assert.deepEqual(VISIBLE_FIELDS[role], columnsFor(role, false));
    }
  });
});

// ─────────────────────────────────────────────
// Role normalization (bridges existing master_admin/admin names)
// ─────────────────────────────────────────────
describe("normalizeRole", () => {
  test("maps the legacy codebase roles to the spec's five roles", () => {
    assert.equal(normalizeRole("master_admin"), "super_admin");
    assert.equal(normalizeRole("admin"), "office_staff");
    assert.equal(normalizeRole("tutor"), "tutor");
  });
  test("defaults unknown/empty to the least-privileged family view", () => {
    assert.equal(normalizeRole(undefined), "parent");
    assert.equal(normalizeRole("nonsense"), "parent");
  });
});

// ─────────────────────────────────────────────
// Group sessions (#1): siblings never see each other's notes
// ─────────────────────────────────────────────
describe("group sessions", () => {
  test("a group note appears on each member's own history only", () => {
    const robin = demoNotesForStudent("stu_robin");
    const milo = demoNotesForStudent("stu_milo");
    const robinGroup = robin.find((n) => n.noteGroupId);
    const miloGroup = milo.find((n) => n.noteGroupId);
    assert.ok(robinGroup, "robin has a group note");
    assert.ok(miloGroup, "milo has a group note");
    // same group, shared public content…
    assert.equal(robinGroup!.noteGroupId, miloGroup!.noteGroupId);
    assert.equal(robinGroup!.publicNotes, miloGroup!.publicNotes);
    // …but each is its own per-student record (distinct private notes)
    assert.notEqual(robinGroup!.privateNotes, miloGroup!.privateNotes);
    assert.equal(robinGroup!.studentId, "stu_robin");
    assert.equal(miloGroup!.studentId, "stu_milo");
  });

  test("demo students resolve", () => {
    assert.ok(DEMO_STUDENTS.length >= 2);
  });
});

// ─────────────────────────────────────────────
// Student scoping (R-2 / R-5 / R-6 / R-7)
// ─────────────────────────────────────────────
describe("studentsVisibleTo", () => {
  test("staff see every student", () => {
    assert.equal(studentsVisibleTo("super_admin", {}).length, DEMO_STUDENTS.length);
    assert.equal(studentsVisibleTo("office_staff", {}).length, DEMO_STUDENTS.length);
  });

  test("a tutor sees only their portfolio, not another tutor's student (R-5)", () => {
    const sam = studentsVisibleTo("tutor", { tutorId: "tutor_sam" }).map((s) => s.id);
    assert.deepEqual(sam.sort(), ["stu_milo", "stu_robin"]);
    assert.ok(!sam.includes("stu_ada"));
    const jess = studentsVisibleTo("tutor", { tutorId: "tutor_jess" }).map((s) => s.id);
    assert.deepEqual(jess, ["stu_ada"]);
  });

  test("a parent sees their family's children only, never another family (R-2/R-6)", () => {
    const avery = studentsVisibleTo("parent", { familyId: "fam_avery" }).map((s) => s.id);
    assert.deepEqual(avery.sort(), ["stu_milo", "stu_robin"]);
    assert.ok(!avery.includes("stu_ada"));
  });

  test("a student sees only themselves — no siblings (R-7)", () => {
    const self = studentsVisibleTo("student", { studentId: "stu_robin" }).map((s) => s.id);
    assert.deepEqual(self, ["stu_robin"]);
  });

  test("missing identity yields an empty, fail-closed scope", () => {
    assert.equal(studentsVisibleTo("tutor", {}).length, 0);
    assert.equal(studentsVisibleTo("parent", {}).length, 0);
    assert.equal(studentsVisibleTo("student", {}).length, 0);
  });
});
