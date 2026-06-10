import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAKEUP_NOTICE_DAYS,
  computeNoticeDays,
  isMakeupEligible,
  evaluateCancellation,
} from "./makeup.ts";

// Anchor: a session 40 days out, cancelled "now".
const SESSION = "2026-08-01T14:30:00";

test("computeNoticeDays: exact day counts", () => {
  assert.equal(computeNoticeDays("2026-08-01T14:30:00", "2026-07-02T14:30:00"), 30);
  assert.equal(computeNoticeDays("2026-08-01T14:30:00", "2026-07-01T14:30:00"), 31);
  assert.equal(computeNoticeDays("2026-08-01T14:30:00", "2026-07-31T14:30:00"), 1);
});

test("computeNoticeDays: floors partial days (30d minus a minute → 29)", () => {
  // Cancelled 30 minutes after the 30-days-prior mark → still 29 whole days.
  assert.equal(
    computeNoticeDays("2026-08-01T14:30:00", "2026-07-02T15:00:00"),
    29,
  );
});

test("computeNoticeDays: same moment is 0; after the session is negative", () => {
  assert.equal(computeNoticeDays(SESSION, SESSION), 0);
  assert.equal(computeNoticeDays(SESSION, "2026-08-02T14:30:00") < 0, true);
});

test("computeNoticeDays: unparseable input → 0", () => {
  assert.equal(computeNoticeDays("nonsense", "2026-07-01T00:00:00"), 0);
});

test("isMakeupEligible: boundary at the policy threshold", () => {
  assert.equal(isMakeupEligible(MAKEUP_NOTICE_DAYS), true); // exactly 30 → eligible
  assert.equal(isMakeupEligible(MAKEUP_NOTICE_DAYS - 1), false); // 29 → not
  assert.equal(isMakeupEligible(MAKEUP_NOTICE_DAYS + 5), true);
  assert.equal(isMakeupEligible(0), false);
  assert.equal(isMakeupEligible(-3), false);
});

test("evaluateCancellation: eligible cancellation → available credit", () => {
  const e = evaluateCancellation("2026-08-01T14:30:00", "2026-06-15T09:00:00");
  assert.equal(e.makeupEligible, true);
  assert.equal(e.makeupStatus, "available");
  assert.equal(e.noticeDays >= 30, true);
});

test("evaluateCancellation: short notice → forfeited", () => {
  const e = evaluateCancellation("2026-08-01T14:30:00", "2026-07-20T09:00:00");
  assert.equal(e.makeupEligible, false);
  assert.equal(e.makeupStatus, "not-eligible");
  assert.equal(e.noticeDays < 30, true);
});
