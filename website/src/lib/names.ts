// Human-readable display helpers — used everywhere the UI would otherwise
// leak a raw DDB id (fam_smith_abc, stu_jenny_xyz, par_dad_qrs, tut_paula).
// Raw ids are preserved on `title=` attributes so power users can still
// copy them for debugging without polluting the visible interface.

import { titleCase } from "@/lib/title-case";

interface Named {
  firstName?: string | null;
  lastName?: string | null;
}

interface FamilyShape {
  id: string;
  primary?: Named | null;
  parents?: Named[];
}

interface ParentShape extends Named {
  id: string;
  email?: string;
}

interface StudentShape extends Named {
  id: string;
}

interface TutorShape extends Named {
  id: string;
}

// Split a free-text "Parent Name" ("Jane Smith", "Smith", "") into
// { firstName, lastName }. A single token becomes the last name, NOT the
// first: the `parents`/`students` tables index families on the `by-family`
// GSI keyed by (familyId, lastName), and DynamoDB rejects an empty-string
// key attribute. A single-word name like "asd" used to derive an empty
// lastName and surface a raw "IndexKey: lastName" ValidationException to the
// admin (QA 2026-07-05 bug #3). Routing the lone token to lastName keeps the
// GSI key non-empty for any non-blank input, and renders cleanly through
// fullName() above.
export function splitFullName(full?: string | null): {
  firstName: string;
  lastName: string;
} {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: "", lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function fullName(n: Named | null | undefined): string {
  if (!n) return "";
  const fn = titleCase(n.firstName || "");
  const ln = titleCase(n.lastName || "");
  if (!fn && !ln) return "";
  if (!ln) return fn;
  if (!fn) return ln;
  if (fn === ln) return fn;
  return `${fn} ${ln}`;
}

// Friendly slug-fallback when no name parts exist. "fam_smith_abc" →
// "Smith". Strips the prefix + the suffix random characters.
function slugFallback(id: string): string {
  const stripped = id.replace(/^(fam|stu|par|tut)_/, "");
  // The id format is {slug}_{4 random chars}. Drop the random tail.
  const parts = stripped.split("_");
  if (parts.length > 1 && parts[parts.length - 1].length <= 4) {
    parts.pop();
  }
  const slug = parts.join(" ");
  // Title-case it.
  return slug.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function familyDisplayName(f: FamilyShape): string {
  const primary = f.primary || f.parents?.[0];
  const last = titleCase(primary?.lastName || "");
  if (last) return `${last} family`;
  const first = titleCase(primary?.firstName || "");
  if (first) return `${first}'s family`;
  const fallback = slugFallback(f.id);
  return fallback ? `${fallback} family` : "Family";
}

export function parentDisplayName(p: ParentShape): string {
  const name = fullName(p);
  if (name) return name;
  if (p.email) return p.email;
  return slugFallback(p.id) || "Parent";
}

export function studentDisplayName(s: StudentShape): string {
  const name = fullName(s);
  if (name) return name;
  return slugFallback(s.id) || "Student";
}

export function tutorDisplayName(t: TutorShape): string {
  const name = fullName(t);
  if (name) return name;
  return slugFallback(t.id) || "Tutor";
}
