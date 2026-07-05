import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";
import { expandSessionToChargeRows } from "@/lib/billing";
import type { Family, Parent, Payment, Session, Student } from "@/lib/types";

// GET /api/admin/ledger (FEATURE_LIST B-4)
// Per-family account for the current academic year: the upfront deposit and
// how far it has drawn down across the year's first sessions, sessions banked
// from eligible cancellations, total charges, and payments received. Charges
// reuse the exact billing math (expandSessionToChargeRows) so group splits
// and explicit payer splits land on the same family the billing run would
// charge.

interface LedgerSessionRow {
  date: string;
  student: string;
  amountCents: number;
  coveredByDeposit: boolean;
}

export interface FamilyLedger {
  familyId: string;
  name: string;
  students: string[];
  depositCents: number;
  depositReceivedAt?: string;
  depositAppliedCents: number;
  depositRemainingCents: number;
  sessionsCoveredByDeposit: number;
  chargesCents: number;
  paymentsCents: number;
  balanceCents: number; // charges − deposit applied − payments (negative = credit)
  bankedSessions: { date: string; student: string }[];
  sessions: LedgerSessionRow[];
}

function academicYearStart(now: Date): string {
  const y = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-08-01`;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const c = ddb();
  const [familiesR, parentsR, studentsR, sessionsR, paymentsR] =
    await Promise.all([
      c.send(new ScanCommand({ TableName: Tables.families })),
      c.send(new ScanCommand({ TableName: Tables.parents })),
      c.send(new ScanCommand({ TableName: Tables.students })),
      c.send(new ScanCommand({ TableName: Tables.sessions })),
      c.send(new ScanCommand({ TableName: Tables.payments })),
    ]);

  const families = (familiesR.Items as Family[]) || [];
  const parents = (parentsR.Items as Parent[]) || [];
  const students = (studentsR.Items as Student[]) || [];
  const sessions = (sessionsR.Items as Session[]) || [];
  const payments = (paymentsR.Items as Payment[]) || [];

  const yearStart = academicYearStart(new Date());

  const studentById = new Map(students.map((s) => [s.id, s]));
  const parentById = new Map(parents.map((p) => [p.id, p]));
  const familyOfStudent = (sid: string | undefined): string | undefined =>
    sid ? studentById.get(sid)?.familyId : undefined;
  const studentName = (sid: string | undefined): string => {
    const s = sid ? studentById.get(sid) : undefined;
    return s ? `${s.firstName || ""} ${s.lastName || ""}`.trim() || sid! : sid || "?";
  };

  // Display name: primary payer's last name, else any parent, else students.
  const familyName = (f: Family): string => {
    const primary = parentById.get(f.primaryPayerId);
    const anyParent =
      primary || parents.find((p) => p.familyId === f.id);
    if (anyParent?.lastName) return `${anyParent.lastName} family`;
    const kid = students.find((s) => s.familyId === f.id);
    if (kid?.lastName) return `${kid.lastName} family`;
    return f.id;
  };

  // ---- Charges per family (academic year to date) ----
  const chargeRowsByFamily = new Map<string, LedgerSessionRow[]>();
  const push = (fid: string, row: LedgerSessionRow) => {
    if (!chargeRowsByFamily.has(fid)) chargeRowsByFamily.set(fid, []);
    chargeRowsByFamily.get(fid)!.push(row);
  };

  const billable = sessions
    .filter(
      (s) =>
        (s.type === "individual" || s.type === "group") &&
        (s.status === "completed" || s.status === "billed" || s.status === "paid") &&
        s.date >= yearStart,
    )
    .sort((a, b) => (a.dateTime || "").localeCompare(b.dateTime || ""));

  for (const s of billable) {
    const rate = studentById.get(s.studentId)?.rate || 0;
    for (const row of expandSessionToChargeRows(s, rate)) {
      if (row.payerCounterpartyName) continue; // off-Stripe payer (a school) — not a family account
      const fid =
        row.payerFamilyId ||
        (row.payerParentId ? parentById.get(row.payerParentId)?.familyId : undefined) ||
        familyOfStudent(row.chargeStudentId) ||
        familyOfStudent(s.studentId);
      if (!fid) continue;
      push(fid, {
        date: s.date,
        student: studentName(row.chargeStudentId || s.studentId),
        amountCents: row.amountCents,
        coveredByDeposit: false,
      });
    }
  }

  // ---- Banked sessions (eligible cancellations not yet rescheduled) ----
  const bankedByFamily = new Map<string, { date: string; student: string }[]>();
  for (const s of sessions) {
    if (s.status !== "cancelled" || !s.makeupEligible) continue;
    if (s.makeupStatus === "scheduled") continue;
    if (s.date < yearStart) continue;
    const fid = familyOfStudent(s.studentId);
    if (!fid) continue;
    if (!bankedByFamily.has(fid)) bankedByFamily.set(fid, []);
    bankedByFamily.get(fid)!.push({ date: s.date, student: studentName(s.studentId) });
  }

  // ---- Payments per family (academic year to date) ----
  const paymentsByFamily = new Map<string, number>();
  for (const p of payments) {
    if (p.paymentStatus !== "paid") continue;
    if ((p.createdAt || "").slice(0, 10) < yearStart) continue;
    const fid = familyOfStudent(p.studentId);
    if (!fid) continue;
    paymentsByFamily.set(fid, (paymentsByFamily.get(fid) || 0) + (p.amount || 0));
  }

  // ---- Assemble ----
  const out: FamilyLedger[] = families.map((f) => {
    const rows = (chargeRowsByFamily.get(f.id) || []).slice();
    const depositCents = f.depositCents || 0;

    // Draw the deposit down across the first sessions of the year, in order.
    let remaining = depositCents;
    let applied = 0;
    let covered = 0;
    for (const row of rows) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, row.amountCents);
      remaining -= take;
      applied += take;
      if (take >= row.amountCents) {
        row.coveredByDeposit = true;
        covered++;
      }
    }

    const chargesCents = rows.reduce((a, r) => a + r.amountCents, 0);
    const paymentsCents = paymentsByFamily.get(f.id) || 0;
    const kids = students
      .filter((s) => s.familyId === f.id)
      .map((s) => `${s.firstName || ""} ${s.lastName || ""}`.trim());

    return {
      familyId: f.id,
      name: familyName(f),
      students: kids,
      depositCents,
      depositReceivedAt: f.depositReceivedAt,
      depositAppliedCents: applied,
      depositRemainingCents: remaining,
      sessionsCoveredByDeposit: covered,
      chargesCents,
      paymentsCents,
      balanceCents: chargesCents - applied - paymentsCents,
      bankedSessions: bankedByFamily.get(f.id) || [],
      sessions: rows,
    };
  });

  out.sort((a, b) => a.name.localeCompare(b.name));
  return Response.json({ yearStart, families: out });
}
