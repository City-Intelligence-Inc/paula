// Centralized grade options + labels — extended for college + gap (5/17 spec).
// Used in /admin/students (create + filter), /admin/students/[id] (edit),
// /admin/families/new, /admin/sessions/new, and any future grade selector.
// Keep this list as the single source of truth.

export const GRADE_OPTIONS = [
  "PK",
  "K",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "UG1",
  "UG2",
  "UG3",
  "UG4",
  "GRAD",
  "OTHER",
] as const;

export type Grade = (typeof GRADE_OPTIONS)[number];

export function gradeLabel(g: string | undefined): string {
  if (!g) return "—";
  const u = g.toUpperCase();
  if (u === "PK" || u === "PK3" || u === "PK4") return "Pre-K";
  if (u === "K" || u === "KG") return "Kindergarten";
  if (u === "UG1") return "Undergrad — First year";
  if (u === "UG2") return "Undergrad — Sophomore";
  if (u === "UG3") return "Undergrad — Junior";
  if (u === "UG4") return "Undergrad — Senior";
  if (u === "GRAD") return "Graduate school";
  if (u === "OTHER") return "Other / gap year";
  // Legacy values from earlier import — map 13–16 to undergrad years.
  if (u === "13") return "Undergrad — First year";
  if (u === "14") return "Undergrad — Sophomore";
  if (u === "15") return "Undergrad — Junior";
  if (u === "16") return "Undergrad — Senior";
  const n = parseInt(g, 10);
  if (!Number.isFinite(n)) return `Grade ${g}`;
  return `Grade ${g}`;
}

// Compact label used in dense table cells / chips.
export function gradeShort(g: string | undefined): string {
  if (!g) return "—";
  const u = g.toUpperCase();
  if (u === "PK" || u === "PK3" || u === "PK4") return "Pre-K";
  if (u === "K" || u === "KG") return "K";
  if (u === "UG1") return "UG1";
  if (u === "UG2") return "UG2";
  if (u === "UG3") return "UG3";
  if (u === "UG4") return "UG4";
  if (u === "GRAD") return "Grad";
  if (u === "OTHER") return "Other";
  if (u === "13") return "UG1";
  if (u === "14") return "UG2";
  if (u === "15") return "UG3";
  if (u === "16") return "UG4";
  return g;
}

// Sort rank: Pre-K < K < 1..12 < UG1..UG4 < Grad < Other/unknown.
export function gradeRank(g: string | undefined): number {
  if (!g) return 999;
  const u = g.toUpperCase();
  if (u.startsWith("PK")) return -1;
  if (u === "K" || u === "KG") return 0;
  if (u === "UG1" || u === "13") return 13;
  if (u === "UG2" || u === "14") return 14;
  if (u === "UG3" || u === "15") return 15;
  if (u === "UG4" || u === "16") return 16;
  if (u === "GRAD") return 17;
  if (u === "OTHER") return 18;
  const n = parseInt(g, 10);
  return Number.isFinite(n) ? n : 998;
}
