// Billing math — pure, testable. Turns a logged session into the concrete
// set of charges to run. Encodes the tutoring complexities Paula described:
//
//   * Partial hours        — a 45-min or 90-min session bills duration/60 × rate
//                            when no explicit total was entered.
//   * Group / shared        — a session with N attending students splits the
//     sessions               total across each attendee's family (Jeremy & Yuma:
//                            "two families being charged for ½ the session").
//   * Split payers          — explicit payers[] (divorced parents, a school
//                            paying a share) split the total by percentage.
//
// Integer cents only; remainders are distributed largest-first so the parts
// always sum to the total (no lost or phantom pennies).
import type { Session, SessionPayerSplit } from "@/lib/types";

export interface ChargeRow {
  // The session this charge belongs to (its primary student + sort key). Used
  // to display the row and to transition the session's status after billing.
  studentId: string;
  dateTime: string;
  amountCents: number;
  // Who actually pays. When set, the approve step resolves the Stripe customer
  // from these instead of the session's primary student:
  chargeStudentId?: string; // a group attendee — charge THEIR family
  payerFamilyId?: string; // an explicit family payer
  payerParentId?: string; // an explicit parent payer
  payerCounterpartyName?: string; // an off-Stripe payer (e.g. a school)
  splitLabel?: string; // human label, e.g. "Mom — 60%"
  splitIndex: number; // disambiguates multiple charges from one session
}

interface SessionLike
  extends Pick<Session, "studentId" | "dateTime" | "duration" | "type"> {
  amountCents?: number;
  rate?: number; // legacy dollars
  students?: string[];
  payers?: SessionPayerSplit[];
}

// The session's total in cents. Prefers the explicitly entered amountCents;
// then a legacy `rate` (treated as dollars); otherwise computes from the
// tutor/student rate prorated by duration (partial-hour support).
export function computeSessionTotalCents(
  session: SessionLike,
  studentRateDollars: number,
): number {
  if (typeof session.amountCents === "number" && session.amountCents > 0) {
    return Math.round(session.amountCents);
  }
  if (typeof session.rate === "number" && session.rate > 0) {
    // Legacy rows stored a dollar rate in `rate`.
    return Math.round(session.rate * 100);
  }
  const duration = typeof session.duration === "number" ? session.duration : 60;
  return Math.round((studentRateDollars || 0) * (duration / 60) * 100);
}

// Split a cent total into n parts as evenly as possible, distributing the
// remainder one cent at a time to the earliest parts. Sum(parts) === total.
export function splitCentsEvenly(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  let remainder = total - base * n;
  const parts: number[] = [];
  for (let i = 0; i < n; i++) {
    parts.push(base + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder--;
  }
  return parts;
}

// Split a cent total by percentage weights. Uses largest-remainder rounding so
// the parts sum exactly to total even when percentages don't divide cleanly.
export function splitCentsByPct(total: number, pcts: number[]): number[] {
  if (pcts.length === 0) return [];
  const raw = pcts.map((p) => (total * p) / 100);
  const floors = raw.map((r) => Math.floor(r));
  let used = floors.reduce((a, b) => a + b, 0);
  let leftover = total - used;
  // Hand out leftover cents to the largest fractional remainders first.
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  const parts = floors.slice();
  for (const { i } of order) {
    if (leftover <= 0) break;
    parts[i] += 1;
    leftover--;
    used++;
  }
  return parts;
}

export function expandSessionToChargeRows(
  session: SessionLike,
  studentRateDollars: number,
): ChargeRow[] {
  const total = computeSessionTotalCents(session, studentRateDollars);
  const base = { studentId: session.studentId, dateTime: session.dateTime };

  // 1. Explicit payer split wins (divorced parents, school sharing a cost).
  if (session.payers && session.payers.length > 0) {
    const amounts = splitCentsByPct(
      total,
      session.payers.map((p) => p.pct || 0),
    );
    return session.payers.map((p, i) => ({
      ...base,
      amountCents: amounts[i],
      payerFamilyId: p.familyId,
      payerParentId: p.parentId,
      payerCounterpartyName: p.counterpartyName,
      splitLabel: payerLabel(p),
      splitIndex: i,
    }));
  }

  // 2. Group/shared session: split equally across the attending students so
  //    each child's family pays their share.
  const attendees =
    session.type === "group" && session.students && session.students.length > 1
      ? session.students
      : null;
  if (attendees) {
    const amounts = splitCentsEvenly(total, attendees.length);
    return attendees.map((sid, i) => ({
      ...base,
      amountCents: amounts[i],
      chargeStudentId: sid,
      splitLabel: `Shared — 1 of ${attendees.length}`,
      splitIndex: i,
    }));
  }

  // 3. Single charge to the student's family.
  return [{ ...base, amountCents: total, splitIndex: 0 }];
}

function payerLabel(p: SessionPayerSplit): string {
  const who =
    p.counterpartyName ||
    (p.parentId ? `Parent ${p.parentId}` : p.familyId ? `Family ${p.familyId}` : "Payer");
  return `${who} — ${p.pct}%`;
}
