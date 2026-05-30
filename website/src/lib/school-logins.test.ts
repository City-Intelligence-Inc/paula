import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeSchoolLogins } from "./school-logins.ts";

const NOW = "2026-05-30T12:00:00.000Z";

test("non-array / garbage input returns []", () => {
  assert.deepEqual(sanitizeSchoolLogins("nope", NOW), []);
  assert.deepEqual(sanitizeSchoolLogins(null, NOW), []);
  assert.deepEqual(sanitizeSchoolLogins(undefined, NOW), []);
  assert.deepEqual(sanitizeSchoolLogins(42, NOW), []);
});

test("rows with neither portal nor username are dropped", () => {
  const out = sanitizeSchoolLogins(
    [{}, { portal: "", username: "" }, null, "str", { notes: "only notes" }],
    NOW,
  );
  assert.equal(out.length, 0);
});

test("portal-only and username-only rows are kept", () => {
  assert.equal(sanitizeSchoolLogins([{ portal: "Google Classroom" }], NOW).length, 1);
  assert.equal(sanitizeSchoolLogins([{ username: "abc" }], NOW).length, 1);
});

test("text fields are trimmed but password is preserved verbatim", () => {
  const [c] = sanitizeSchoolLogins(
    [
      {
        portal: " Clever ",
        username: " kid@school.org ",
        url: " https://clever.com ",
        notes: " PIN 1234 ",
        password: "  P@ss w/ spaces ",
      },
    ],
    NOW,
  );
  assert.equal(c.portal, "Clever");
  assert.equal(c.username, "kid@school.org");
  assert.equal(c.url, "https://clever.com");
  assert.equal(c.notes, "PIN 1234");
  // Critical: a real password may have meaningful leading/trailing spaces.
  assert.equal(c.password, "  P@ss w/ spaces ");
});

test("updatedAt is stamped server-side from `now`, ignoring client value", () => {
  const [c] = sanitizeSchoolLogins(
    [{ portal: "X", username: "y", password: "z", updatedAt: "1999-01-01" }],
    NOW,
  );
  assert.equal(c.updatedAt, NOW);
});

test("missing id is generated, existing id is retained", () => {
  const [gen] = sanitizeSchoolLogins([{ portal: "X", username: "y" }], NOW);
  assert.match(gen.id, /^cred_/);
  const [kept] = sanitizeSchoolLogins(
    [{ id: "cred_keepme", portal: "X", username: "y" }],
    NOW,
  );
  assert.equal(kept.id, "cred_keepme");
});

test("mixed batch keeps only valid rows, in order", () => {
  const out = sanitizeSchoolLogins(
    [
      { portal: "A", username: "a", password: "1" },
      {},
      { portal: "B", username: "b", password: "2" },
    ],
    NOW,
  );
  assert.equal(out.length, 2);
  assert.equal(out[0].portal, "A");
  assert.equal(out[1].portal, "B");
});

test("non-string fields fall back to empty/undefined without throwing", () => {
  const [c] = sanitizeSchoolLogins(
    [{ portal: 123, username: "y", url: 5, notes: {}, password: null }],
    NOW,
  );
  assert.equal(c.portal, "");
  assert.equal(c.username, "y");
  assert.equal(c.url, undefined);
  assert.equal(c.notes, undefined);
  assert.equal(c.password, "");
});
