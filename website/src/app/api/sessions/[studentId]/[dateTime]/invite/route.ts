import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";
import { sessionToICS, type ICSRecurrence } from "@/lib/server/ics";
import {
  adminRecipients,
  icsAttachment,
  sendAdminNotification,
} from "@/lib/server/notify";

// POST /api/sessions/:studentId/:dateTime/invite
// Body (optional): { recipients: string[], seriesCount?: number }
//
// Sends a calendar invite as a Resend email with an .ics attachment.
// Default recipients: the student's parent on file, plus the admin
// notification list (Paula + Ari) so they see every invite that goes
// out. Works on Yahoo, Outlook, Google, Apple — anywhere that opens
// an .ics file, which is every major calendar client.
//
// seriesCount > 1 sends a weekly recurring series (for the 8–12 week
// small group classes).
export async function POST(
  request: Request,
  ctx: { params: Promise<{ studentId: string; dateTime: string }> },
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { studentId, dateTime } = await ctx.params;
  const decodedDateTime = decodeURIComponent(dateTime);

  let body: { recipients?: string[]; seriesCount?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // empty body fine
  }

  const c = ddb();
  const sessionR = await c.send(
    new GetCommand({
      TableName: Tables.sessions,
      Key: { studentId, dateTime: decodedDateTime },
    }),
  );
  const session = sessionR.Item as
    | {
        studentId: string;
        dateTime: string;
        duration?: number;
        tutorId?: string;
        location?: string;
      }
    | undefined;
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const studentR = await c.send(
    new GetCommand({ TableName: Tables.students, Key: { id: studentId } }),
  );
  const student = studentR.Item as
    | {
        firstName?: string;
        lastName?: string;
        parentName?: string;
        parentEmail?: string;
      }
    | undefined;
  const studentName = student
    ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
    : studentId;

  let tutorName: string | undefined;
  if (session.tutorId) {
    try {
      const t = await c.send(
        new ScanCommand({
          TableName: Tables.tutors,
          FilterExpression: "id = :i",
          ExpressionAttributeValues: { ":i": session.tutorId },
          Limit: 1,
        }),
      );
      const tu = (t.Items || [])[0] as
        | { firstName?: string; lastName?: string }
        | undefined;
      if (tu) tutorName = `${tu.firstName || ""} ${tu.lastName || ""}`.trim();
    } catch {
      // best-effort
    }
  }

  const explicit = (body.recipients || []).filter(Boolean);
  const parentEmail = (student?.parentEmail || "").trim();
  const recipients = Array.from(
    new Set(
      [
        ...explicit,
        parentEmail,
        ...adminRecipients(),
      ].filter(Boolean),
    ),
  );

  let rrule: ICSRecurrence | undefined;
  if (body.seriesCount && body.seriesCount > 1) {
    rrule = { freq: "WEEKLY", count: Math.min(body.seriesCount, 52) };
  }

  const origin = new URL(request.url).origin;
  const rsvpBase = `${origin}/api/rsvp?student=${encodeURIComponent(
    studentId,
  )}&dt=${encodeURIComponent(session.dateTime)}`;

  const ics = sessionToICS({
    studentId,
    studentName,
    dateTime: session.dateTime,
    durationMinutes: session.duration,
    tutorName,
    location: session.location,
    rrule,
    rsvpUrl: rsvpBase,
    attendees: recipients.map((email) => ({ email, rsvp: true })),
  });

  const dt = new Date(session.dateTime);
  const dateLabel = dt.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const seriesNote = rrule
    ? `<p style="color:#666;font-size:13px;">This is the first of ${rrule.count} weekly sessions.</p>`
    : "";

  const result = await sendAdminNotification({
    to: recipients,
    subject: `Mathitude tutoring — ${studentName} (${dateLabel})`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#7030A0;margin:0 0 12px;">You're invited to a Mathitude session</h2>
        <p style="color:#111;font-size:15px;line-height:1.5;margin:0 0 12px;">
          The attached .ics will add this session to any calendar
          (Google, Apple, Outlook, Yahoo).
        </p>
        <table style="border-collapse:collapse;margin:16px 0;font-size:14px;">
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Student</td><td style="padding:4px 0;color:#111;"><strong>${studentName}</strong></td></tr>
          ${tutorName ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Tutor</td><td style="padding:4px 0;color:#111;">${tutorName}</td></tr>` : ""}
          <tr><td style="padding:4px 12px 4px 0;color:#666;">When</td><td style="padding:4px 0;color:#111;">${dateLabel}</td></tr>
          ${session.location ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Where</td><td style="padding:4px 0;color:#111;">${session.location}</td></tr>` : ""}
        </table>
        ${seriesNote}
        <p style="margin:24px 0 8px;font-size:14px;">RSVP:</p>
        <p style="margin:0 0 24px;">
          <a href="${rsvpBase}&status=yes" style="background:#7030A0;color:#fff;text-decoration:none;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-right:8px;">Yes</a>
          <a href="${rsvpBase}&status=no" style="background:#eee;color:#444;text-decoration:none;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-right:8px;">No</a>
          <a href="${rsvpBase}&status=maybe" style="background:#eee;color:#444;text-decoration:none;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Maybe</a>
        </p>
        <p style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:16px;">
          Mathitude — 770 Menlo Ave, Suite 200A, Menlo Park, CA
        </p>
      </div>
    `,
    text: `Mathitude session for ${studentName} on ${dateLabel}. RSVP: ${rsvpBase}&status=yes / =no / =maybe`,
    attachments: [
      icsAttachment(
        `mathitude-${studentId}-${session.dateTime.slice(0, 10)}.ics`,
        ics,
      ),
    ],
  });

  // Audit row so the admin notifications inbox shows what went out.
  try {
    await c.send(
      new PutCommand({
        TableName: Tables.notifications,
        Item: {
          id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
          kind: "session.invite_sent",
          studentId,
          dateTime: session.dateTime,
          studentName,
          recipients,
          ok: result.ok,
          error: result.error || null,
          read: false,
        },
      }),
    );
  } catch (err) {
    console.warn("[invite] notification log failed:", err);
  }

  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error, recipients },
      { status: 500 },
    );
  }
  return Response.json({ ok: true, recipients });
}
