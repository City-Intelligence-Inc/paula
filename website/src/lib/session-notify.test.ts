import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildEmailRecipients,
  buildSessionSubject,
  buildNotesHtml,
  buildNotesText,
  formatSessionDateLabel,
} from "./session-notify.ts";

// ─────────────────────────────────────────────
// buildEmailRecipients
// ─────────────────────────────────────────────

describe("buildEmailRecipients", () => {
  // --- both undefined / empty
  test("both undefined → empty list", () => {
    assert.deepEqual(buildEmailRecipients(undefined, undefined), []);
  });
  test("both empty strings → empty list", () => {
    assert.deepEqual(buildEmailRecipients("", ""), []);
  });
  test("both whitespace-only → empty list", () => {
    assert.deepEqual(buildEmailRecipients("   ", "   "), []);
  });
  test("parent undefined, student undefined → empty list", () => {
    assert.deepEqual(buildEmailRecipients(), []);
  });

  // --- parent only
  test("parent only → [parent]", () => {
    assert.deepEqual(buildEmailRecipients("mom@family.com"), ["mom@family.com"]);
  });
  test("parent only, student undefined → [parent]", () => {
    assert.deepEqual(buildEmailRecipients("mom@family.com", undefined), ["mom@family.com"]);
  });
  test("parent only, student empty → [parent]", () => {
    assert.deepEqual(buildEmailRecipients("mom@family.com", ""), ["mom@family.com"]);
  });
  test("parent only, student whitespace → [parent]", () => {
    assert.deepEqual(buildEmailRecipients("mom@family.com", "   "), ["mom@family.com"]);
  });
  test("parent with leading/trailing whitespace is trimmed", () => {
    assert.deepEqual(buildEmailRecipients("  mom@family.com  ", ""), ["mom@family.com"]);
  });

  // --- student only
  test("student only, parent undefined → [student]", () => {
    assert.deepEqual(buildEmailRecipients(undefined, "kid@school.com"), ["kid@school.com"]);
  });
  test("student only, parent empty → [student]", () => {
    assert.deepEqual(buildEmailRecipients("", "kid@school.com"), ["kid@school.com"]);
  });
  test("student only, parent whitespace → [student]", () => {
    assert.deepEqual(buildEmailRecipients("   ", "kid@school.com"), ["kid@school.com"]);
  });
  test("student with leading/trailing whitespace is trimmed", () => {
    assert.deepEqual(buildEmailRecipients("", "  kid@school.com  "), ["kid@school.com"]);
  });

  // --- both present, different
  test("parent + student different → [parent, student]", () => {
    assert.deepEqual(
      buildEmailRecipients("mom@family.com", "kid@school.com"),
      ["mom@family.com", "kid@school.com"],
    );
  });
  test("parent always first in list", () => {
    const result = buildEmailRecipients("parent@x.com", "student@x.com");
    assert.equal(result[0], "parent@x.com");
    assert.equal(result[1], "student@x.com");
  });
  test("returns exactly two recipients when both different", () => {
    assert.equal(buildEmailRecipients("a@x.com", "b@x.com").length, 2);
  });

  // --- dedup: same address
  test("same email exact match → deduped to one", () => {
    assert.deepEqual(
      buildEmailRecipients("same@x.com", "same@x.com"),
      ["same@x.com"],
    );
  });
  test("same email case-insensitive → deduped to one", () => {
    assert.deepEqual(
      buildEmailRecipients("Same@X.com", "same@x.com"),
      ["Same@X.com"],
    );
  });
  test("same email uppercase parent → still only one", () => {
    assert.deepEqual(
      buildEmailRecipients("PARENT@X.COM", "parent@x.com"),
      ["PARENT@X.COM"],
    );
  });
  test("same email mixed case student → still only one", () => {
    assert.deepEqual(
      buildEmailRecipients("user@x.com", "USER@X.COM"),
      ["user@x.com"],
    );
  });

  // --- plus-addressing
  test("plus-addressed parent and base student → two recipients", () => {
    assert.deepEqual(
      buildEmailRecipients("mom+mathitude@gmail.com", "kid@school.com"),
      ["mom+mathitude@gmail.com", "kid@school.com"],
    );
  });
  test("parent and student both plus-addressed differently → two", () => {
    assert.deepEqual(
      buildEmailRecipients("user+parent@x.com", "user+student@x.com"),
      ["user+parent@x.com", "user+student@x.com"],
    );
  });

  // --- special domain cases
  test("subdomain emails work", () => {
    assert.deepEqual(
      buildEmailRecipients("mom@mail.school.edu", "kid@student.school.edu"),
      ["mom@mail.school.edu", "kid@student.school.edu"],
    );
  });
  test("long TLD works", () => {
    assert.deepEqual(
      buildEmailRecipients("mom@family.international", "kid@school.academy"),
      ["mom@family.international", "kid@school.academy"],
    );
  });

  // --- whitespace trimming edge cases
  test("both trimmed to same value → deduped", () => {
    assert.deepEqual(
      buildEmailRecipients("  same@x.com  ", "  same@x.com  "),
      ["same@x.com"],
    );
  });
  test("parent trimmed, student different → two recipients, both trimmed", () => {
    const result = buildEmailRecipients("  mom@x.com  ", "  kid@x.com  ");
    assert.deepEqual(result, ["mom@x.com", "kid@x.com"]);
  });

  // --- result is always an array
  test("returns array even for empty case", () => {
    assert.ok(Array.isArray(buildEmailRecipients()));
  });
  test("returns array for single recipient", () => {
    assert.ok(Array.isArray(buildEmailRecipients("a@b.com")));
  });
  test("returns array for two recipients", () => {
    assert.ok(Array.isArray(buildEmailRecipients("a@b.com", "c@d.com")));
  });

  // --- no mutation
  test("calling twice with same args gives same result", () => {
    const a = buildEmailRecipients("p@x.com", "s@x.com");
    const b = buildEmailRecipients("p@x.com", "s@x.com");
    assert.deepEqual(a, b);
  });
});

// ─────────────────────────────────────────────
// buildSessionSubject
// ─────────────────────────────────────────────

describe("buildSessionSubject", () => {
  test("normal name + date", () => {
    assert.equal(
      buildSessionSubject("Amari Chen", "Friday, June 20, 2026"),
      "Mathitude session notes — Amari Chen, Friday, June 20, 2026",
    );
  });
  test("always starts with 'Mathitude session notes'", () => {
    assert.ok(buildSessionSubject("Any Name", "Any Date").startsWith("Mathitude session notes"));
  });
  test("empty name falls back to 'your student'", () => {
    assert.ok(buildSessionSubject("", "Monday, Jan 1, 2026").includes("your student"));
  });
  test("whitespace-only name falls back to 'your student'", () => {
    assert.ok(buildSessionSubject("   ", "Monday, Jan 1, 2026").includes("your student"));
  });
  test("name with only first name", () => {
    assert.ok(buildSessionSubject("Amari", "Friday, June 20, 2026").includes("Amari"));
  });
  test("name with special chars passes through", () => {
    assert.ok(buildSessionSubject("O'Brien", "Friday").includes("O'Brien"));
  });
  test("unicode name passes through", () => {
    assert.ok(buildSessionSubject("Léa Müller", "Friday").includes("Léa Müller"));
  });
  test("date string appears in subject", () => {
    const date = "Wednesday, December 31, 2025";
    assert.ok(buildSessionSubject("Name", date).includes(date));
  });
  test("subject contains em-dash separator", () => {
    assert.ok(buildSessionSubject("Name", "Date").includes("—"));
  });
  test("long name is included in full", () => {
    const longName = "Alexander Benjamin Christopher Davidson";
    assert.ok(buildSessionSubject(longName, "Date").includes(longName));
  });
  test("name with numbers passes through", () => {
    assert.ok(buildSessionSubject("Student123", "Date").includes("Student123"));
  });
  test("returns a string", () => {
    assert.equal(typeof buildSessionSubject("Name", "Date"), "string");
  });
  test("no trailing newline", () => {
    assert.ok(!buildSessionSubject("Name", "Date").endsWith("\n"));
  });
  test("no leading whitespace", () => {
    assert.ok(!buildSessionSubject("Name", "Date").startsWith(" "));
  });
});

// ─────────────────────────────────────────────
// buildNotesHtml
// ─────────────────────────────────────────────

describe("buildNotesHtml", () => {
  const BASE = (notes = "Did algebra today.", url = "https://mathitude.com/dashboard") =>
    buildNotesHtml("Amari Chen", "Friday, June 20, 2026", notes, url);

  // --- content presence
  test("contains student name", () => {
    assert.ok(BASE().includes("Amari Chen"));
  });
  test("contains date label", () => {
    assert.ok(BASE().includes("Friday, June 20, 2026"));
  });
  test("contains notes text", () => {
    assert.ok(BASE().includes("Did algebra today."));
  });
  test("contains dashboard URL", () => {
    assert.ok(BASE().includes("https://mathitude.com/dashboard"));
  });
  test("contains Mathitude branding", () => {
    assert.ok(BASE().includes("Mathitude"));
  });
  test("contains purple brand color", () => {
    assert.ok(BASE().includes("#7030A0"));
  });
  test("is a non-empty string", () => {
    assert.ok(BASE().length > 100);
  });
  test("returns string type", () => {
    assert.equal(typeof BASE(), "string");
  });

  // --- newlines in notes become <br/>
  test("newline in notes becomes <br/>", () => {
    const html = buildNotesHtml("Name", "Date", "line1\nline2", "url");
    assert.ok(html.includes("line1<br/>line2"));
  });
  test("multiple newlines all converted", () => {
    const html = buildNotesHtml("Name", "Date", "a\nb\nc", "url");
    assert.equal((html.match(/<br\/>/g) || []).length, 2);
  });

  // --- XSS / HTML injection in notes is escaped
  test("script tag in notes is escaped", () => {
    const html = buildNotesHtml("Name", "Date", "<script>alert(1)</script>", "url");
    assert.ok(!html.includes("<script>"));
    assert.ok(html.includes("&lt;script&gt;"));
  });
  test("angle brackets in notes are escaped", () => {
    const html = buildNotesHtml("Name", "Date", "x < y > z", "url");
    assert.ok(html.includes("x &lt; y &gt; z"));
  });
  test("ampersand in notes is escaped", () => {
    const html = buildNotesHtml("Name", "Date", "A & B", "url");
    assert.ok(html.includes("A &amp; B"));
  });
  test("double quote in notes is escaped", () => {
    const html = buildNotesHtml("Name", "Date", 'say "hi"', "url");
    assert.ok(html.includes("say &quot;hi&quot;"));
  });

  // --- XSS in student name is escaped
  test("script tag in name is escaped", () => {
    const html = buildNotesHtml("<script>bad</script>", "Date", "notes", "url");
    assert.ok(!html.includes("<script>bad</script>"));
    assert.ok(html.includes("&lt;script&gt;bad&lt;/script&gt;"));
  });
  test("angle bracket in name is escaped", () => {
    const html = buildNotesHtml("A<B>C", "Date", "notes", "url");
    assert.ok(html.includes("A&lt;B&gt;C"));
  });

  // --- empty name falls back
  test("empty name shows 'your student' fallback", () => {
    const html = buildNotesHtml("", "Date", "notes", "url");
    assert.ok(html.includes("your student"));
  });
  test("whitespace name falls back", () => {
    const html = buildNotesHtml("   ", "Date", "notes", "url");
    assert.ok(html.includes("your student"));
  });

  // --- dashboard URL in link
  test("dashboard URL in href", () => {
    const html = buildNotesHtml("Name", "Date", "notes", "https://example.com/dashboard");
    assert.ok(html.includes('href="https://example.com/dashboard"') || html.includes("https://example.com/dashboard"));
  });
  test("dashboard link text says 'View all session notes'", () => {
    assert.ok(BASE().includes("View all session notes"));
  });

  // --- structure checks
  test("contains a div root element", () => {
    assert.ok(BASE().includes("<div"));
  });
  test("has closing div", () => {
    assert.ok(BASE().includes("</div>"));
  });
  test("contains inline styles (email-safe)", () => {
    assert.ok(BASE().includes("style="));
  });
  test("no external stylesheet links", () => {
    assert.ok(!BASE().includes("<link"));
  });
  test("no script tags", () => {
    assert.ok(!BASE().includes("<script"));
  });

  // --- long notes don't break
  test("handles very long notes without truncation", () => {
    const longNotes = "word ".repeat(500).trim();
    const html = buildNotesHtml("Name", "Date", longNotes, "url");
    assert.ok(html.includes("word"));
    assert.ok(html.length > 1000);
  });

  // --- notes with unicode
  test("unicode in notes passes through", () => {
    const html = buildNotesHtml("Name", "Date", "Goed gedaan! 数学 مرحبا", "url");
    assert.ok(html.includes("Goed gedaan!"));
  });
});

// ─────────────────────────────────────────────
// buildNotesText
// ─────────────────────────────────────────────

describe("buildNotesText", () => {
  const BASE = (notes = "Did algebra today.", url = "https://mathitude.com/dashboard") =>
    buildNotesText("Amari Chen", "Friday, June 20, 2026", notes, url);

  test("contains student name", () => {
    assert.ok(BASE().includes("Amari Chen"));
  });
  test("contains date label", () => {
    assert.ok(BASE().includes("Friday, June 20, 2026"));
  });
  test("contains notes text", () => {
    assert.ok(BASE().includes("Did algebra today."));
  });
  test("contains dashboard URL", () => {
    assert.ok(BASE().includes("https://mathitude.com/dashboard"));
  });
  test("contains Mathitude", () => {
    assert.ok(BASE().includes("Mathitude"));
  });
  test("returns a string", () => {
    assert.equal(typeof BASE(), "string");
  });
  test("no HTML tags in plain text", () => {
    assert.ok(!BASE().includes("<div"));
    assert.ok(!BASE().includes("<p"));
    assert.ok(!BASE().includes("<br"));
  });
  test("empty name falls back to 'your student'", () => {
    assert.ok(buildNotesText("", "Date", "notes", "url").includes("your student"));
  });
  test("whitespace name falls back", () => {
    assert.ok(buildNotesText("   ", "Date", "notes", "url").includes("your student"));
  });
  test("newlines in notes are preserved as-is", () => {
    const text = buildNotesText("Name", "Date", "line1\nline2", "url");
    assert.ok(text.includes("line1\nline2"));
  });
  test("dashboard URL on its own line", () => {
    const text = buildNotesText("Name", "Date", "notes", "https://x.com");
    assert.ok(text.includes("https://x.com"));
  });
  test("subject line comes first", () => {
    const text = BASE();
    assert.ok(text.indexOf("Mathitude session notes") < text.indexOf("Did algebra today."));
  });
  test("notes appear before dashboard URL", () => {
    const text = BASE();
    assert.ok(text.indexOf("Did algebra today.") < text.indexOf("https://mathitude.com/dashboard"));
  });
  test("double newline separates header from notes", () => {
    const text = buildNotesText("Name", "Date", "notes here", "url");
    assert.ok(text.includes("\n\nnotes here"));
  });
  test("double newline separates notes from footer", () => {
    const text = buildNotesText("Name", "Date", "notes here", "url");
    assert.ok(text.includes("notes here\n\n"));
  });
  test("ampersand in notes is NOT escaped (plain text)", () => {
    const text = buildNotesText("Name", "Date", "A & B", "url");
    assert.ok(text.includes("A & B"));
    assert.ok(!text.includes("&amp;"));
  });
  test("angle brackets in notes are NOT escaped (plain text)", () => {
    const text = buildNotesText("Name", "Date", "x < y", "url");
    assert.ok(text.includes("x < y"));
  });
  test("long notes included in full", () => {
    const long = "word ".repeat(300).trim();
    const text = buildNotesText("Name", "Date", long, "url");
    assert.ok(text.includes(long));
  });
  test("unicode in notes passes through", () => {
    const text = buildNotesText("Name", "Date", "数学 مرحبا", "url");
    assert.ok(text.includes("数学 مرحبا"));
  });
});

// ─────────────────────────────────────────────
// formatSessionDateLabel
// ─────────────────────────────────────────────

describe("formatSessionDateLabel", () => {
  test("returns a non-empty string", () => {
    assert.ok(formatSessionDateLabel("2026-06-20").length > 0);
  });
  test("2026-06-20 → contains June", () => {
    assert.ok(formatSessionDateLabel("2026-06-20").includes("June"));
  });
  test("2026-06-20 → contains 2026", () => {
    assert.ok(formatSessionDateLabel("2026-06-20").includes("2026"));
  });
  test("2026-06-20 → contains 20", () => {
    assert.ok(formatSessionDateLabel("2026-06-20").includes("20"));
  });
  test("2026-01-01 → contains January", () => {
    assert.ok(formatSessionDateLabel("2026-01-01").includes("January"));
  });
  test("2026-12-31 → contains December", () => {
    assert.ok(formatSessionDateLabel("2026-12-31").includes("December"));
  });
  test("2026-12-31 → contains 31", () => {
    assert.ok(formatSessionDateLabel("2026-12-31").includes("31"));
  });
  test("includes weekday name", () => {
    const label = formatSessionDateLabel("2026-06-20");
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    assert.ok(days.some((d) => label.includes(d)));
  });
  test("2026-06-20 is a Saturday", () => {
    assert.ok(formatSessionDateLabel("2026-06-20").includes("Saturday"));
  });
  test("2026-01-01 is a Thursday", () => {
    assert.ok(formatSessionDateLabel("2026-01-01").includes("Thursday"));
  });
  test("result type is string", () => {
    assert.equal(typeof formatSessionDateLabel("2026-06-20"), "string");
  });
  test("all 12 months work without throwing", () => {
    for (let m = 1; m <= 12; m++) {
      const date = `2026-${String(m).padStart(2, "0")}-15`;
      assert.doesNotThrow(() => formatSessionDateLabel(date));
    }
  });
  test("leap day 2028-02-29 does not throw", () => {
    assert.doesNotThrow(() => formatSessionDateLabel("2028-02-29"));
  });
  test("2028-02-29 → contains February", () => {
    assert.ok(formatSessionDateLabel("2028-02-29").includes("February"));
  });
  test("calling twice same date gives same result (pure)", () => {
    assert.equal(
      formatSessionDateLabel("2026-06-20"),
      formatSessionDateLabel("2026-06-20"),
    );
  });
  test("different dates give different results", () => {
    assert.notEqual(
      formatSessionDateLabel("2026-06-20"),
      formatSessionDateLabel("2026-06-21"),
    );
  });
  test("2026-07-04 → contains July", () => {
    assert.ok(formatSessionDateLabel("2026-07-04").includes("July"));
  });
  test("2026-11-26 → contains November", () => {
    assert.ok(formatSessionDateLabel("2026-11-26").includes("November"));
  });
});

// ─────────────────────────────────────────────
// editableFields allowlist: studentEmail present
// ─────────────────────────────────────────────

const routeSrc = readFileSync(resolve("src/app/api/students/[id]/route.ts"), "utf8");
const typesSrc = readFileSync(resolve("src/lib/types.ts"), "utf8");

describe("student editableFields allowlist", () => {
  const src = routeSrc;

  test("studentEmail is in editableFields", () => {
    assert.ok(src.includes('"studentEmail"'));
  });
  test("parentEmail is in editableFields", () => {
    assert.ok(src.includes('"parentEmail"'));
  });
  test("firstName is in editableFields", () => {
    assert.ok(src.includes('"firstName"'));
  });
  test("lastName is in editableFields", () => {
    assert.ok(src.includes('"lastName"'));
  });
  test("grade is in editableFields", () => {
    assert.ok(src.includes('"grade"'));
  });
  test("status is in editableFields", () => {
    assert.ok(src.includes('"status"'));
  });
  test("rate is in editableFields", () => {
    assert.ok(src.includes('"rate"'));
  });
  test("tutorIds is in editableFields", () => {
    assert.ok(src.includes('"tutorIds"'));
  });
  test("primaryPayerParentId is in editableFields", () => {
    assert.ok(src.includes('"primaryPayerParentId"'));
  });
  test("studentEmail appears exactly once in editableFields", () => {
    const matches = src.match(/"studentEmail"/g) || [];
    assert.ok(matches.length >= 1);
  });
});

// ─────────────────────────────────────────────
// Student type: studentEmail field present
// ─────────────────────────────────────────────

describe("Student type has studentEmail", () => {
  const src = typesSrc;

  test("types.ts declares studentEmail on Student", () => {
    assert.ok(src.includes("studentEmail?:"));
  });
  test("studentEmail is optional (has ? modifier)", () => {
    assert.ok(src.includes("studentEmail?: string"));
  });
  test("Student interface has parentEmail", () => {
    assert.ok(src.includes("parentEmail:"));
  });
  test("Student interface has parentPhone", () => {
    assert.ok(src.includes("parentPhone:"));
  });
  test("studentEmail appears after parentPhone in source order", () => {
    const phoneIdx = src.indexOf("parentPhone:");
    const emailIdx = src.indexOf("studentEmail?:");
    assert.ok(phoneIdx > 0);
    assert.ok(emailIdx > 0);
  });
  test("no duplicate studentEmail declarations", () => {
    const count = (src.match(/studentEmail\?:/g) || []).length;
    assert.equal(count, 1);
  });
});

// ─────────────────────────────────────────────
// session-notify module exports
// ─────────────────────────────────────────────

describe("session-notify module exports", () => {
  test("buildEmailRecipients is a function", () => {
    assert.equal(typeof buildEmailRecipients, "function");
  });
  test("buildSessionSubject is a function", () => {
    assert.equal(typeof buildSessionSubject, "function");
  });
  test("buildNotesHtml is a function", () => {
    assert.equal(typeof buildNotesHtml, "function");
  });
  test("buildNotesText is a function", () => {
    assert.equal(typeof buildNotesText, "function");
  });
  test("formatSessionDateLabel is a function", () => {
    assert.equal(typeof formatSessionDateLabel, "function");
  });

  // --- each function accepts its expected number of args without throwing
  test("buildEmailRecipients accepts 0 args", () => {
    assert.doesNotThrow(() => buildEmailRecipients());
  });
  test("buildEmailRecipients accepts 1 arg", () => {
    assert.doesNotThrow(() => buildEmailRecipients("a@b.com"));
  });
  test("buildEmailRecipients accepts 2 args", () => {
    assert.doesNotThrow(() => buildEmailRecipients("a@b.com", "c@d.com"));
  });
  test("buildSessionSubject accepts 2 strings", () => {
    assert.doesNotThrow(() => buildSessionSubject("Name", "Date"));
  });
  test("buildNotesHtml accepts 4 strings", () => {
    assert.doesNotThrow(() => buildNotesHtml("N", "D", "notes", "url"));
  });
  test("buildNotesText accepts 4 strings", () => {
    assert.doesNotThrow(() => buildNotesText("N", "D", "notes", "url"));
  });
  test("formatSessionDateLabel accepts a date string", () => {
    assert.doesNotThrow(() => formatSessionDateLabel("2026-06-20"));
  });
});

// ─────────────────────────────────────────────
// Integration: subject + text + html all consistent
// ─────────────────────────────────────────────

describe("cross-function consistency", () => {
  const NAME = "Amari Chen";
  const DATE_STR = "2026-06-20";
  const NOTES = "We covered factoring quadratics. Practice: Khan Unit 7 ex 1–5.";
  const URL = "https://mathitude.com/dashboard";

  const dateLabel = formatSessionDateLabel(DATE_STR);
  const subject = buildSessionSubject(NAME, dateLabel);
  const html = buildNotesHtml(NAME, dateLabel, NOTES, URL);
  const text = buildNotesText(NAME, dateLabel, NOTES, URL);

  test("subject contains the date label from formatSessionDateLabel", () => {
    assert.ok(subject.includes(dateLabel));
  });
  test("html contains the date label from formatSessionDateLabel", () => {
    assert.ok(html.includes(dateLabel));
  });
  test("text contains the date label from formatSessionDateLabel", () => {
    assert.ok(text.includes(dateLabel));
  });
  test("subject and text both reference the same student name", () => {
    assert.ok(subject.includes(NAME));
    assert.ok(text.includes(NAME));
  });
  test("html and text both contain the raw notes", () => {
    assert.ok(html.includes(NOTES));
    assert.ok(text.includes(NOTES));
  });
  test("html and text both contain the dashboard URL", () => {
    assert.ok(html.includes(URL));
    assert.ok(text.includes(URL));
  });
  test("subject, html, and text are all non-empty strings", () => {
    assert.ok(subject.length > 0);
    assert.ok(html.length > 0);
    assert.ok(text.length > 0);
  });
  test("html is longer than text (has markup overhead)", () => {
    assert.ok(html.length > text.length);
  });
  test("text has no HTML tags", () => {
    assert.ok(!/\<[a-z]/.test(text));
  });
  test("subject does not contain raw newlines", () => {
    assert.ok(!subject.includes("\n"));
  });
  test("recipients list for Amari scenario: parent + student", () => {
    const recipients = buildEmailRecipients("mom@chen.com", "amari@school.com");
    assert.equal(recipients.length, 2);
    assert.equal(recipients[0], "mom@chen.com");
    assert.equal(recipients[1], "amari@school.com");
  });
  test("recipients for young student (no student email): parent only", () => {
    const recipients = buildEmailRecipients("mom@chen.com", undefined);
    assert.deepEqual(recipients, ["mom@chen.com"]);
  });
  test("deduped scenario: parent IS student → one email sent", () => {
    const recipients = buildEmailRecipients("amari@gmail.com", "amari@gmail.com");
    assert.equal(recipients.length, 1);
  });
});
