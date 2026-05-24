import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";

interface SessionRow {
  studentId: string;
  dateTime: string;
  date?: string;
  status?: string;
  type?: string;
  rate?: number;
  amountCents?: number;
  offering?: string;
  duration?: number;
  tutorId?: string;
  familyId?: string;
  familyBillingSplits?: { familyId: string; pct: number }[];
}

interface PaymentRow {
  studentId: string;
  createdAt: string;
  amount?: number;
  paymentStatus?: string;
  description?: string;
}

interface StudentRow {
  id: string;
  firstName?: string;
  lastName?: string;
  rate?: number;
}

// GET /api/admin/financials
// Master admin financial overview: revenue totals, AR (pending), overdue,
// per-status counts, and a recent activity strip. Reads from sessions +
// payments tables and rolls up in memory. Bounded by Scan limits — fine for
// Mathitude's volume (hundreds of sessions, not millions).
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const [sessRes, payRes, stuRes] = await Promise.all([
      ddb().send(new ScanCommand({ TableName: Tables.sessions, Limit: 2000 })),
      ddb().send(new ScanCommand({ TableName: Tables.payments, Limit: 2000 })),
      ddb().send(new ScanCommand({ TableName: Tables.students, Limit: 1000 })),
    ]);

    const sessions = (sessRes.Items || []) as SessionRow[];
    const payments = (payRes.Items || []) as PaymentRow[];
    const students = (stuRes.Items || []) as StudentRow[];
    const studentById = new Map(students.map((s) => [s.id, s]));

    const realSessions = sessions.filter((s) => s.type !== "note");

    let revenuePaidCents = 0;
    let pendingCents = 0;
    let overdueCents = 0;
    let failedCents = 0;
    let countPaid = 0;
    let countPending = 0;
    let countOverdue = 0;
    let countFailed = 0;

    for (const p of payments) {
      const amt = p.amount || 0;
      switch (p.paymentStatus) {
        case "paid":
          revenuePaidCents += amt;
          countPaid++;
          break;
        case "pending":
          pendingCents += amt;
          countPending++;
          break;
        case "overdue":
          overdueCents += amt;
          countOverdue++;
          break;
        case "failed":
          failedCents += amt;
          countFailed++;
          break;
      }
    }

    // Sessions completed but not yet billed (no payment row)
    const paymentKeys = new Set(
      payments.map((p) => `${p.studentId}|${p.createdAt}`),
    );
    const completedSessions = realSessions.filter(
      (s) => s.status === "completed",
    );
    let unbilledCents = 0;
    let unbilledCount = 0;
    for (const s of completedSessions) {
      // crude: if no payment exists for the same student around the same
      // dateTime, count as unbilled
      const studentRate =
        s.rate || s.amountCents || studentById.get(s.studentId)?.rate || 0;
      // If rate is stored as dollars (legacy), normalize to cents
      const cents = studentRate > 1000 ? studentRate : studentRate * 100;
      const key = `${s.studentId}|${s.dateTime}`;
      if (!paymentKeys.has(key)) {
        unbilledCents += cents;
        unbilledCount++;
      }
    }

    // Monthly trend (last 6 months)
    const months: Record<string, number> = {};
    for (const p of payments) {
      if (p.paymentStatus !== "paid") continue;
      const month = (p.createdAt || "").slice(0, 7); // YYYY-MM
      if (!month) continue;
      months[month] = (months[month] || 0) + (p.amount || 0);
    }
    const monthsSorted = Object.entries(months)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .reverse()
      .map(([month, cents]) => ({ month, cents }));

    // Top students by paid revenue
    const byStudent: Record<string, number> = {};
    for (const p of payments) {
      if (p.paymentStatus !== "paid") continue;
      byStudent[p.studentId] = (byStudent[p.studentId] || 0) + (p.amount || 0);
    }
    const topStudents = Object.entries(byStudent)
      .map(([sid, cents]) => {
        const s = studentById.get(sid);
        return {
          studentId: sid,
          name: s ? `${s.firstName || ""} ${s.lastName || ""}`.trim() : sid,
          cents,
        };
      })
      .sort((a, b) => b.cents - a.cents)
      .slice(0, 10);

    const recentPayments = payments
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 10)
      .map((p) => {
        const s = studentById.get(p.studentId);
        return {
          ...p,
          studentName: s
            ? `${s.firstName || ""} ${s.lastName || ""}`.trim()
            : p.studentId,
        };
      });

    return Response.json({
      revenuePaidCents,
      pendingCents,
      overdueCents,
      failedCents,
      unbilledCents,
      unbilledCount,
      counts: {
        paid: countPaid,
        pending: countPending,
        overdue: countOverdue,
        failed: countFailed,
        sessionsTotal: realSessions.length,
        sessionsCompleted: completedSessions.length,
      },
      monthsSorted,
      topStudents,
      recentPayments,
    });
  } catch (err) {
    console.error("[GET /api/admin/financials] failed:", err);
    return Response.json(
      { error: "Aggregate failed", detail: String(err) },
      { status: 500 },
    );
  }
}
