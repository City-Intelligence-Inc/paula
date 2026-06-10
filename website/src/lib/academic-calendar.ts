// Mathitude 2026–2027 Academic Calendar.
//
// Data transcribed from the official one-page PDF Sara Bell sent
// (MATHITUDE_ACADEMIC_CALENDAR_2026_2027.pdf, S3). The PDF shades cells in
// four ways; we model them here so the in-app calendar reproduces the same
// meaning:
//   green  → academic year start          (Mon Aug 24, 2026)
//   red    → academic year end            (Fri Jun  4, 2027)
//   blue   → holiday closures             (named breaks below)
//   light  → summer Saturday closures     (explicit dates below)
//   grey   → closed Sundays               (every Sunday, all year)
//
// All dates are local calendar dates (YYYY-MM-DD); parse with parseLocalDate
// so they never shift by a timezone offset.

export const ACADEMIC_YEAR = {
  label: "2026–2027",
  start: "2026-08-24",
  end: "2027-06-04",
  // The calendar grid covers Aug 2026 → Jul 2027.
  firstMonth: "2026-08-01",
  lastMonth: "2027-07-01",
} as const;

export type EventKind = "year-start" | "year-end" | "holiday";

export interface AcademicEvent {
  id: string;
  title: string;
  /** Inclusive start date, YYYY-MM-DD. */
  start: string;
  /** Inclusive end date for multi-day events. Omit for single days. */
  end?: string;
  kind: EventKind;
  note?: string;
}

// Year-start / year-end are single highlighted days (not closures). Holidays
// are closures spanning one or more days.
export const ACADEMIC_EVENTS: AcademicEvent[] = [
  {
    id: "year-start",
    title: "Academic Year Begins",
    start: "2026-08-24",
    kind: "year-start",
  },
  {
    id: "labor-day",
    title: "Labor Day",
    start: "2026-09-07",
    kind: "holiday",
  },
  {
    id: "thanksgiving",
    title: "Thanksgiving Break",
    start: "2026-11-20",
    end: "2026-11-30",
    kind: "holiday",
  },
  {
    id: "winter-break",
    title: "Winter Break",
    start: "2026-12-19",
    end: "2027-01-02",
    kind: "holiday",
  },
  {
    id: "mlk",
    title: "Martin Luther King Jr. Day",
    start: "2027-01-16",
    end: "2027-01-18",
    kind: "holiday",
  },
  {
    id: "february-break",
    title: "February Break",
    start: "2027-02-13",
    end: "2027-02-20",
    kind: "holiday",
    note: "Presidents' week",
  },
  {
    id: "spring-break",
    title: "Spring Break",
    start: "2027-04-03",
    end: "2027-04-10",
    kind: "holiday",
  },
  {
    id: "memorial-day",
    title: "Memorial Day",
    start: "2027-05-31",
    kind: "holiday",
  },
  {
    id: "year-end",
    title: "Academic Year Ends",
    start: "2027-06-04",
    kind: "year-end",
  },
];

// Saturdays Mathitude is closed for the summer (start and tail of the
// calendar year). Transcribed from the light-blue cells in the PDF.
export const SUMMER_SATURDAYS: ReadonlySet<string> = new Set([
  "2026-08-01",
  "2026-08-08",
  "2026-08-15",
  "2026-08-22",
  "2026-08-29",
  "2026-09-05",
  "2027-05-29",
  "2027-06-05",
  "2027-06-12",
  "2027-06-19",
  "2027-06-26",
  "2027-07-03",
  "2027-07-10",
  "2027-07-17",
  "2027-07-24",
  "2027-07-31",
]);

export type DayKind =
  | "year-start"
  | "year-end"
  | "holiday"
  | "summer-saturday"
  | "closed-sunday"
  | "open";

export interface DayStatus {
  iso: string;
  kind: DayKind;
  closed: boolean;
  label?: string;
}

/** Parse a YYYY-MM-DD string as a local date (no UTC shift). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Format a Date as a local YYYY-MM-DD string. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isWithin(iso: string, start: string, end?: string): boolean {
  return iso >= start && iso <= (end ?? start);
}

// Resolve a single day's status. Year start/end markers win first (they're
// highlights, not closures), then named holiday closures, then the recurring
// summer-Saturday and Sunday closures.
export function getDayStatus(date: Date): DayStatus {
  const iso = toISODate(date);

  for (const ev of ACADEMIC_EVENTS) {
    if (ev.kind === "year-start" && iso === ev.start) {
      return { iso, kind: "year-start", closed: false, label: ev.title };
    }
    if (ev.kind === "year-end" && iso === ev.start) {
      return { iso, kind: "year-end", closed: false, label: ev.title };
    }
  }

  for (const ev of ACADEMIC_EVENTS) {
    if (ev.kind === "holiday" && isWithin(iso, ev.start, ev.end)) {
      return { iso, kind: "holiday", closed: true, label: ev.title };
    }
  }

  if (SUMMER_SATURDAYS.has(iso)) {
    return {
      iso,
      kind: "summer-saturday",
      closed: true,
      label: "Summer Saturday closure",
    };
  }

  if (date.getDay() === 0) {
    return { iso, kind: "closed-sunday", closed: true, label: "Closed Sunday" };
  }

  return { iso, kind: "open", closed: false };
}

/** Events overlapping a given month (0-indexed month, full year). */
export function eventsInMonth(year: number, month: number): AcademicEvent[] {
  const monthStart = toISODate(new Date(year, month, 1));
  const monthEnd = toISODate(new Date(year, month + 1, 0));
  return ACADEMIC_EVENTS.filter((ev) => {
    const evEnd = ev.end ?? ev.start;
    return ev.start <= monthEnd && evEnd >= monthStart;
  });
}
