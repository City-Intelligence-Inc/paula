import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import { notifyAction } from "@/lib/server/notify";
import type { Session, Student } from "@/lib/types";

// POST /api/sessions/copy-last-week (FEATURE_LIST D-2)
// Duplicates last week's schedule into the current week. Admins copy the
// whole schedule; a tutor copies only their own sessions (Paula 6/25 #27 —
// "copy last week workflow should be at the tutor level"). Idempotent: a
// session that already exists in the target week (same student, date, time)
// is skipped, so re-clicking never double-books.

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

// Monday of the week containing `d` (Sunday counts as the trailing day of
// the prior Mon–Sun week, matching the Mon-first schedule views).
function mondayOf(d: Date): Date {
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
}

async function sessionsOnDate(date: string): Promise<Session[]> {
  try {
    const r = await ddb().send(
      new QueryCommand({
        TableName: Tables.sessions,
        IndexName: "by-date",
        KeyConditionExpression: "#d = :date",
        ExpressionAttributeNames: { "#d": "date" },
        ExpressionAttributeValues: { ":date": date },
      }),
    );
    return (r.Items as Session[]) || [];
  } catch {
    return [];
  }
}

export async function POST() {
  const { actor, response } = await resolveActor();
  if (response) return response;
  const a = actor!;
  if (!a.isAdmin && a.role !== "tutor") return forbidden();

  const thisMonday = mondayOf(new Date());
  const sourceDates: string[] = [];
  const targetDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const src = new Date(
      thisMonday.getFullYear(),
      thisMonday.getMonth(),
      thisMonday.getDate() + i - 7,
    );
    const dst = new Date(
      thisMonday.getFullYear(),
      thisMonday.getMonth(),
      thisMonday.getDate() + i,
    );
    sourceDates.push(ymd(src));
    targetDates.push(ymd(dst));
  }

  const [sourceByDay, targetByDay] = await Promise.all([
    Promise.all(sourceDates.map(sessionsOnDate)),
    Promise.all(targetDates.map(sessionsOnDate)),
  ]);

  // A tutor only copies their own schedule: sessions explicitly theirs, or
  // untagged sessions for students assigned to them.
  let assignedIds: Set<string> | null = null;
  if (!a.isAdmin) {
    const r = await ddb().send(
      new ScanCommand({
        TableName: Tables.students,
        ProjectionExpression: "id, tutorIds",
      }),
    );
    const tid = a.tutor?.id || "__none__";
    assignedIds = new Set(
      ((r.Items as Pick<Student, "id" | "tutorIds">[]) || [])
        .filter((s) => (s.tutorIds || []).includes(tid))
        .map((s) => s.id),
    );
  }

  const mine = (s: Session): boolean => {
    if (a.isAdmin) return true;
    const tid = a.tutor?.id;
    if (!tid) return false;
    if (s.tutorId === tid || s.sessionLeadId === tid) return true;
    return !s.tutorId && !s.sessionLeadId && !!assignedIds?.has(s.studentId);
  };

  const existing = new Set(
    targetByDay.flat().map((s) => `${s.studentId}#${s.date}#${s.time}`),
  );

  const now = new Date().toISOString();
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < 7; i++) {
    for (const s of sourceByDay[i]) {
      // Only real, still-standing sessions travel forward — notes and
      // cancellations stay in the past.
      if (s.type !== "individual" && s.type !== "group") continue;
      if (s.status === "cancelled") continue;
      if (!mine(s)) continue;

      const key = `${s.studentId}#${targetDates[i]}#${s.time}`;
      if (existing.has(key)) {
        skipped++;
        continue;
      }
      existing.add(key);

      const copy: Record<string, unknown> = {
        studentId: s.studentId,
        dateTime: `${targetDates[i]}T${s.time}:00`,
        date: targetDates[i],
        time: s.time,
        duration: s.duration ?? 60,
        type: s.type,
        status: "scheduled",
        copiedFromDateTime: s.dateTime,
        createdAt: now,
        updatedAt: now,
      };
      if (s.offering) copy.offering = s.offering;
      if (s.tutorId) copy.tutorId = s.tutorId;
      if (s.sessionLeadId) copy.sessionLeadId = s.sessionLeadId;
      if (s.students && s.students.length > 0) copy.students = s.students;
      if (s.payers && s.payers.length > 0) copy.payers = s.payers;
      if (typeof s.amountCents === "number") copy.amountCents = s.amountCents;

      await ddb().send(
        new PutCommand({ TableName: Tables.sessions, Item: copy }),
      );
      created++;
    }
  }

  notifyAction({
    kind: "schedule.copied",
    summary: `${a.email || a.userId} copied last week's schedule forward: ${created} created, ${skipped} already existed`,
    details: { created, skipped, weekOf: targetDates[0], actor: a.role },
  }).catch(() => {});

  return Response.json({ created, skipped, weekOf: targetDates[0] });
}
