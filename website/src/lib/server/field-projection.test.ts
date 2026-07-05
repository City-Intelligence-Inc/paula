import { test } from "node:test";
import assert from "node:assert/strict";
import {
  stripPricingFromStudent,
  stripContactFromStudent,
  stripPricingFromSession,
} from "./field-projection.ts";

const student = {
  id: "stu_1",
  firstName: "Robin",
  lastName: "Avery",
  grade: "2nd",
  school: "WCS",
  rate: 150,
  stripeCustomerId: "cus_x",
  primaryPayerParentId: "par_1",
  parentName: "Sam Avery",
  parentEmail: "sam@example.com",
  parentPhone: "555-0100",
  studentEmail: "robin@example.com",
  tutorIds: ["tutor_sam"],
};

test("stripPricingFromStudent removes only billing fields", () => {
  const out = stripPricingFromStudent(student);
  assert.equal("rate" in out, false);
  assert.equal("stripeCustomerId" in out, false);
  assert.equal("primaryPayerParentId" in out, false);
  // keeps identity + contact (contact is stripped separately)
  assert.equal(out.firstName, "Robin");
  assert.equal(out.parentEmail, "sam@example.com");
});

test("stripContactFromStudent removes parent/student contact channels (R-5)", () => {
  const out = stripContactFromStudent(student);
  assert.equal("parentEmail" in out, false);
  assert.equal("parentPhone" in out, false);
  assert.equal("studentEmail" in out, false);
  // keeps names (a tutor needs to know whose session it is) + non-contact data
  assert.equal(out.parentName, "Sam Avery");
  assert.equal(out.firstName, "Robin");
  assert.equal(out.grade, "2nd");
});

test("tutor projection (pricing + contact) leaks neither money nor contact", () => {
  const out = stripContactFromStudent(stripPricingFromStudent(student));
  for (const leaked of [
    "rate",
    "stripeCustomerId",
    "primaryPayerParentId",
    "parentEmail",
    "parentPhone",
    "studentEmail",
  ]) {
    assert.equal(leaked in out, false, `${leaked} must not reach a tutor`);
  }
  assert.equal(out.firstName, "Robin");
  assert.equal(out.school, "WCS");
});

test("stripPricingFromSession removes money fields", () => {
  const session = {
    studentId: "stu_1",
    dateTime: "2026-07-04T12:00:00Z",
    rate: 150,
    amountCents: 15000,
    payers: [{ familyId: "fam_1", pct: 100 }],
    sessionActivities: "SET",
  };
  const out = stripPricingFromSession(session);
  assert.equal("rate" in out, false);
  assert.equal("amountCents" in out, false);
  assert.equal("payers" in out, false);
  assert.equal(out.sessionActivities, "SET");
});
