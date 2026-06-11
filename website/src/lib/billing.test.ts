import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeSessionTotalCents,
  splitCentsEvenly,
  splitCentsByPct,
  expandSessionToChargeRows,
} from "./billing.ts";

test("computeSessionTotalCents prefers explicit amountCents", () => {
  assert.equal(
    computeSessionTotalCents({ studentId: "s", dateTime: "t", amountCents: 7500 }, 100),
    7500,
  );
});

test("computeSessionTotalCents prorates partial hours from rate", () => {
  // 45 min at $100/hr = $75
  assert.equal(
    computeSessionTotalCents({ studentId: "s", dateTime: "t", duration: 45 }, 100),
    7500,
  );
  // 90 min at $80/hr = $120
  assert.equal(
    computeSessionTotalCents({ studentId: "s", dateTime: "t", duration: 90 }, 80),
    12000,
  );
});

test("computeSessionTotalCents defaults to 60 min when no duration", () => {
  assert.equal(
    computeSessionTotalCents({ studentId: "s", dateTime: "t" }, 90),
    9000,
  );
});

test("splitCentsEvenly distributes remainder, sums to total", () => {
  const parts = splitCentsEvenly(10000, 3); // $100 / 3
  assert.deepEqual(parts, [3334, 3333, 3333]);
  assert.equal(parts.reduce((a, b) => a + b, 0), 10000);
});

test("splitCentsByPct uses largest-remainder, sums to total", () => {
  const parts = splitCentsByPct(10000, [60, 40]);
  assert.deepEqual(parts, [6000, 4000]);
  const odd = splitCentsByPct(10001, [50, 50]);
  assert.equal(odd.reduce((a, b) => a + b, 0), 10001);
});

test("expand: single individual session → one full charge", () => {
  const rows = expandSessionToChargeRows(
    { studentId: "stu_a", dateTime: "t", type: "individual", amountCents: 9000 },
    90,
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amountCents, 9000);
  assert.equal(rows[0].chargeStudentId, undefined);
});

test("expand: group session splits equally across attendees", () => {
  const rows = expandSessionToChargeRows(
    {
      studentId: "stu_a",
      dateTime: "t",
      type: "group",
      amountCents: 10000,
      students: ["stu_a", "stu_b"],
    },
    100,
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].amountCents + rows[1].amountCents, 10000);
  assert.deepEqual(rows.map((r) => r.chargeStudentId), ["stu_a", "stu_b"]);
});

test("expand: explicit payer split by percentage", () => {
  const rows = expandSessionToChargeRows(
    {
      studentId: "stu_a",
      dateTime: "t",
      type: "individual",
      amountCents: 10000,
      payers: [
        { familyId: "fam_mom", pct: 60 },
        { familyId: "fam_dad", pct: 40 },
      ],
    },
    100,
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].amountCents, 6000);
  assert.equal(rows[1].amountCents, 4000);
  assert.equal(rows[0].payerFamilyId, "fam_mom");
});

test("expand: partial-hour group session (intersection)", () => {
  // 45 min group at $120 entered total, 3 kids → 4000 each
  const rows = expandSessionToChargeRows(
    {
      studentId: "stu_a",
      dateTime: "t",
      type: "group",
      duration: 45,
      amountCents: 12000,
      students: ["stu_a", "stu_b", "stu_c"],
    },
    100,
  );
  assert.equal(rows.length, 3);
  assert.equal(rows.reduce((a, r) => a + r.amountCents, 0), 12000);
});
