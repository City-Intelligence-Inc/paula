import { ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";

// Today endpoint — answers "what do I need to do today?" in one round trip.
// Pulls sessions for today + this-week revenue + open consultations +
// unbilled completed sessions + failed payment retries. Bounded scans are
// fine at Mathitude's volume; collapse to GSI queries if data grows.
//
// Shape lets the dashboard render five command-deck cards without any
// client-side aggregation logic.

function startOfDayISO(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

function startOfWeekISO(d: Date): string {
  // Monday-anchored week. JavaScript Sunday=0, treat Monday as start.
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  return monday.toISOString();
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const now = new Date();
  const todayStart = startOfDayISO(now);
  const todayDate = todayStart.slice(0, 10); // YYYY-MM-DD
  const weekStart = startOfWeekISO(now);
  // Last week's window for revenue delta.
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const lastWeekStart = new Date(
    new Date(weekStart).getTime() - oneWeekMs,
  ).toISOString();

  try {
    const [sessRes, payRes, consultRes, studentRes] = await Promise.all([
      ddb().send(
        new QueryCommand({
          TableName: Tables.sessions,
          IndexName: "by-date",
          KeyConditionExpression: "#d = :date",
          ExpressionAttributeNames: { "#d": "date" },
          ExpressionAttributeValues: { ":date": todayDate },
        }),
      ).catch(() =>
        // Fall back to scan if GSI is missing (e.g. dev table).
        ddb().send(
          new ScanCommand({
            TableName: Tables.sessions,
            FilterExpression: "#d = :date",
            ExpressionAttributeNames: { "#d": "date" },
            ExpressionAttributeValues: { ":date": todayDate },
            Limit: 200,
          }),
        ),
      ),
      ddb().send(new ScanCommand({ TableName: Tables.payments, Limit: 2000 })),
      ddb().send(
        new ScanCommand({
          TableName: Tables.bookings,
          FilterExpression: "#t = :t AND #s = :s",
          ExpressionAttributeNames: { "#t": "type", "#s": "status" },
          ExpressionAttributeValues: {
            ":t": "consultation",
            ":s": "requested",
          },
          Limit: 200,
        }),
      ),
      ddb().send(new ScanCommand({ TableName: Tables.students, Limit: 1000 })),
    ]);

    interface Session {
      studentId: string;
      dateTime: string;
      date?: string;
      time?: string;
      status?: string;
      type?: string;
      offering?: string;
      duration?: number;
      tutorId?: string;
      rate?: number;
      amountCents?: number;
      students?: string[];
    }
    interface Payment {
      studentId: string;
      createdAt: string;
      amount?: number;
      paymentStatus?: string;
    }
    interface Student {
      id: string;
      firstName?: string;
      lastName?: string;
      rate?: number;
    }

    const todaySessions = ((sessRes.Items || []) as Session[]).filter(
      (s) => s.type !== "note",
    );
    todaySessions.sort((a, b) =>
      (a.time || "").localeCompare(b.time || ""),
    );

    const payments = (payRes.Items || []) as Payment[];
    const students = (studentRes.Items || []) as Student[];
    const studentById = new Map(students.map((s) => [s.id, s]));

    // This week paid total
    let weekPaidCents = 0;
    let lastWeekPaidCents = 0;
    let overdueOrFailedCents = 0;
    let overdueOrFailedCount = 0;
    for (const p of payments) {
      const created = p.createdAt;
      const amt = p.amount || 0;
      if (p.paymentStatus === "paid") {
        if (created >= weekStart) weekPaidCents += amt;
        else if (created >= lastWeekStart && created < weekStart) {
          lastWeekPaidCents += amt;
        }
      }
      if (p.paymentStatus === "overdue" || p.paymentStatus === "failed") {
        overdueOrFailedCents += amt;
        overdueOrFailedCount += 1;
      }
    }

    // Unbilled completed sessions: completed but no payment row exists.
    const paymentKey = new Set(
      payments.map((p) => `${p.studentId}|${p.createdAt}`),
    );
    let unbilledCents = 0;
    let unbilledCount = 0;
    // Need a wider session scan for this — pull all sessions, not just today.
    const allSessions = await ddb().send(
      new ScanCommand({ TableName: Tables.sessions, Limit: 2000 }),
    );
    const completed = ((allSessions.Items || []) as Session[]).filter(
      (s) => s.status === "completed" && s.type !== "note",
    );
    for (const s of completed) {
      const key = `${s.studentId}|${s.dateTime}`;
      if (!paymentKey.has(key)) {
        const fromRow =
          typeof s.amountCents === "number"
            ? s.amountCents
            : (s.rate || 0) > 1000
              ? s.rate || 0
              : (s.rate || 0) * 100;
        const rate = fromRow || (studentById.get(s.studentId)?.rate || 0) * 100;
        unbilledCents += rate;
        unbilledCount += 1;
      }
    }

    const consultations = consultRes.Items || [];

    // Decorate today sessions with student names
    const todayDecorated = todaySessions.map((s) => {
      const student = studentById.get(s.studentId);
      const studentName = student
        ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
        : null;
      return {
        studentId: s.studentId,
        studentName,
        dateTime: s.dateTime,
        time: s.time || "",
        type: s.type || "individual",
        status: s.status || "scheduled",
        duration: s.duration || 60,
        tutorId: s.tutorId,
      };
    });

    const revenueDeltaCents = weekPaidCents - lastWeekPaidCents;

    return Response.json({
      today: {
        date: todayDate,
        weekday: now.toLocaleDateString("en-US", { weekday: "long" }),
      },
      todaySessions: todayDecorated,
      thisWeek: {
        paidCents: weekPaidCents,
        lastWeekPaidCents,
        deltaCents: revenueDeltaCents,
      },
      pendingConsultations: consultations.length,
      unbilled: {
        cents: unbilledCents,
        count: unbilledCount,
      },
      attention: {
        overdueOrFailedCents,
        overdueOrFailedCount,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/today] failed:", err);
    return Response.json(
      { error: "Failed to load Today data", detail: String(err) },
      { status: 500 },
    );
  }
}
