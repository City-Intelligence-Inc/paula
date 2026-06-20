import { ScanCommand, QueryCommand, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser, requireAdmin } from "@/lib/server/ddb";
import { notifyAction, sendAdminNotification } from "@/lib/server/notify";
import {
  buildEmailRecipients,
  buildSessionSubject,
  buildNotesHtml,
  buildNotesText,
  formatSessionDateLabel,
} from "@/lib/session-notify";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;

  if (date) {
    const result = await ddb().send(
      new QueryCommand({
        TableName: Tables.sessions,
        IndexName: "by-date",
        KeyConditionExpression: "#d = :date",
        ExpressionAttributeNames: { "#d": "date" },
        ExpressionAttributeValues: { ":date": date },
      }),
    );
    return Response.json({ sessions: result.Items || [] });
  }

  const result = await ddb().send(
    new ScanCommand({ TableName: Tables.sessions, Limit: 500 }),
  );
  return Response.json({ sessions: result.Items || [] });
}

const OFFERINGS = [
  "tutoring",
  "group-parent-ed",
  "stem-fair",
  "family-advising",
  "speaking",
] as const;
type Offering = (typeof OFFERINGS)[number];

interface PayerInput {
  familyId?: string;
  parentId?: string;
  counterpartyName?: string;
  pct: number;
}

interface NewSessionBody {
  studentId?: string;
  students?: string[];
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  duration?: number;
  type?: "individual" | "group";
  status?: "scheduled" | "completed" | "cancelled";
  offering?: Offering;
  tutorId?: string;
  sessionLeadId?: string;
  notes?: string;
  privateNotes?: string;
  amountCents?: number;
  payers?: PayerInput[];
}

// POST /api/sessions
// Post-session form (5/17 spec): create or log a session with a free-form
// offering type (default tutoring, can be parent-ed / STEM fair / advising
// / speaking), individual vs group, a total charge, and an optional payer
// split. Percentages are validated to sum to 100 when payers are supplied.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: NewSessionBody;
  try {
    body = (await request.json()) as NewSessionBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.studentId && !(body.students && body.students.length > 0)) {
    return Response.json(
      {
        error:
          "studentId (or students[] for group) is required — at minimum a primary student must be attached so billing can resolve.",
      },
      { status: 400 },
    );
  }
  if (!body.date || !body.time) {
    return Response.json(
      { error: "date and time are required" },
      { status: 400 },
    );
  }

  const offering: Offering =
    body.offering && OFFERINGS.includes(body.offering)
      ? body.offering
      : "tutoring";
  const type: "individual" | "group" =
    body.type === "group" ? "group" : "individual";

  // Validate payer splits if provided.
  let payers: PayerInput[] | undefined;
  if (body.payers && body.payers.length > 0) {
    const total = body.payers.reduce((acc, p) => acc + (p.pct || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      return Response.json(
        {
          error: `Payer split percentages must sum to 100 (got ${total}).`,
          code: "bad_split",
        },
        { status: 400 },
      );
    }
    for (const p of body.payers) {
      if (!p.familyId && !p.parentId && !p.counterpartyName) {
        return Response.json(
          {
            error:
              "Each payer must specify a familyId, parentId, or counterpartyName.",
          },
          { status: 400 },
        );
      }
    }
    payers = body.payers;
  }

  const dateTime = `${body.date}T${body.time}:00`;
  const studentId =
    body.studentId || (body.students && body.students[0]) || "";

  const session: Record<string, unknown> = {
    studentId,
    dateTime,
    date: body.date,
    time: body.time,
    duration: typeof body.duration === "number" ? body.duration : 60,
    type,
    status: body.status || "completed",
    offering,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (body.tutorId?.trim()) session.tutorId = body.tutorId.trim();
  if (body.sessionLeadId?.trim()) session.sessionLeadId = body.sessionLeadId.trim();
  if (typeof body.amountCents === "number" && body.amountCents >= 0) {
    session.amountCents = body.amountCents;
  }
  if (body.notes?.trim()) session.notes = body.notes.trim();
  if (body.privateNotes?.trim()) session.privateNotes = body.privateNotes.trim();
  if (body.students && body.students.length > 0) {
    session.students = body.students;
  }
  if (payers) session.payers = payers;

  try {
    await ddb().send(
      new PutCommand({ TableName: Tables.sessions, Item: session }),
    );
    await notifyAction({
      kind: "session.logged",
      summary: `Session logged (${offering}, ${type}): ${studentId} on ${body.date} ${body.time}`,
      details: {
        studentId,
        dateTime,
        offering,
        type,
        amountCents: (session.amountCents as number) || 0,
        payerCount: payers?.length || 0,
      },
    }).catch(() => {});

    // Send session notes email to parent + student (if email set).
    // Best-effort: never blocks the session save.
    if (body.notes?.trim()) {
      sendSessionNotesEmail(studentId, body.date!, body.notes.trim()).catch(() => {});
    }

    return Response.json({ session }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sessions] failed:", err);
    return Response.json(
      { error: "Create failed", detail: String(err) },
      { status: 500 },
    );
  }
}

async function sendSessionNotesEmail(studentId: string, date: string, notes: string) {
  const result = await ddb().send(
    new GetCommand({ TableName: Tables.students, Key: { id: studentId } }),
  );
  const student = result.Item;
  if (!student) return;

  const recipients = buildEmailRecipients(student.parentEmail, student.studentEmail);
  if (recipients.length === 0) return;

  const studentName = [student.firstName, student.lastName].filter(Boolean).join(" ") || "your student";
  const dateLabel = formatSessionDateLabel(date);
  const dashboardUrl = process.env.NEXT_PUBLIC_URL
    ? `${process.env.NEXT_PUBLIC_URL}/dashboard`
    : "https://mathitude.com/dashboard";

  await sendAdminNotification({
    subject: buildSessionSubject(studentName, dateLabel),
    to: recipients,
    html: buildNotesHtml(studentName, dateLabel, notes, dashboardUrl),
    text: buildNotesText(studentName, dateLabel, notes, dashboardUrl),
  });
}
