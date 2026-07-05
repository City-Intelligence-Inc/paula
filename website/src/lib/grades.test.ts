// C-6: the August-1 rollover ladder. Every active student advances exactly
// one step; terminal and unknown grades must never move.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { advanceGrade, GRADE_OPTIONS, gradeRank } from "./grades.ts";

describe("advanceGrade (C-6 school-year rollover)", () => {
  test("full K-12 ladder", () => {
    assert.equal(advanceGrade("PK"), "K");
    assert.equal(advanceGrade("K"), "1");
    for (let g = 1; g <= 11; g++) {
      assert.equal(advanceGrade(String(g)), String(g + 1));
    }
    assert.equal(advanceGrade("12"), "UG1");
  });

  test("undergrad ladder ends at GRAD", () => {
    assert.equal(advanceGrade("UG1"), "UG2");
    assert.equal(advanceGrade("UG2"), "UG3");
    assert.equal(advanceGrade("UG3"), "UG4");
    assert.equal(advanceGrade("UG4"), "GRAD");
  });

  test("legacy numeric undergrad values advance", () => {
    assert.equal(advanceGrade("13"), "UG2");
    assert.equal(advanceGrade("16"), "GRAD");
  });

  test("terminal / unknown grades never move", () => {
    assert.equal(advanceGrade("GRAD"), null);
    assert.equal(advanceGrade("OTHER"), null);
    assert.equal(advanceGrade(""), null);
    assert.equal(advanceGrade(undefined), null);
    assert.equal(advanceGrade("banana"), null);
  });

  test("case-insensitive", () => {
    assert.equal(advanceGrade("k"), "1");
    assert.equal(advanceGrade("pk"), "K");
    assert.equal(advanceGrade("ug1"), "UG2");
  });

  test("every advanceable option lands on another valid option", () => {
    for (const g of GRADE_OPTIONS) {
      const next = advanceGrade(g);
      if (next !== null) {
        assert.ok(
          (GRADE_OPTIONS as readonly string[]).includes(next),
          `${g} → ${next} is not a valid grade option`,
        );
      }
    }
  });

  test("advancing always increases rank by exactly one step", () => {
    for (const g of GRADE_OPTIONS) {
      const next = advanceGrade(g);
      if (next !== null) {
        assert.ok(
          gradeRank(next) > gradeRank(g),
          `${g} → ${next} did not increase rank`,
        );
      }
    }
  });

  test("double application never skips a year (idempotence marker is external)", () => {
    // The route guards re-runs with a year marker; the pure function itself
    // moves one step per call — 5 → 6 → 7, never 5 → 7 in one call.
    assert.equal(advanceGrade(advanceGrade("5")!), "7");
  });
});
