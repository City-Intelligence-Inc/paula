import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";
import { sessionToICS, type ICSRecurrence } from "@/lib/server/ics";

// GET /api/sessions/:studentId/:dateTime/ics
//
// Returns a text/calendar payload for the requested session. Universal:
// any calendar client (Google, Apple, Outlook, Yahoo, Fastmail) imports
// an .ics from an HTTP URL. Query params:
//
//   ?series=N    — emit a weekly recurring series of N occurrences,
//                  for the 8-12 week small group classes.
//   ?until=ISO   — alternative recurrence terminator (UTC ISO).
//
// Read-only — any signed-in user can fetch the ICS for any session.
// Tighten later via requireRole(["admin","tutor","parent"]) once
// parent/tutor links to sessions exist.
export async function GET(
  request: Request,
  ctx: { params: Promise<{ studentId: string; dateTime: string }> },
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { studentId, dateTime } = await ctx.params;
  const decodedDateTime = decodeURIComponent(dateTime);

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
        notes?: string;
      }
    | undefined;
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const studentR = await c.send(
    new GetCommand({ TableName: Tables.students, Key: { id: studentId } }),
  );
  const student = studentR.Item as
    | { firstName?: string; lastName?: string }
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

  const { searchParams } = new URL(request.url);
  let rrule: ICSRecurrence | undefined;
  const seriesCount = parseInt(searchParams.get("series") || "", 10);
  const until = searchParams.get("until") || undefined;
  if (until) {
    rrule = { freq: "WEEKLY", until };
  } else if (Number.isFinite(seriesCount) && seriesCount > 1) {
    rrule = { freq: "WEEKLY", count: Math.min(seriesCount, 52) };
  }

  const origin = new URL(request.url).origin;
  const ics = sessionToICS({
    studentId,
    studentName,
    dateTime: session.dateTime,
    durationMinutes: session.duration,
    tutorName,
    location: session.location,
    rrule,
    rsvpUrl: `${origin}/api/rsvp?student=${encodeURIComponent(
      studentId,
    )}&dt=${encodeURIComponent(session.dateTime)}`,
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8; method=REQUEST",
      "Content-Disposition": `attachment; filename="mathitude-${studentId}-${session.dateTime.slice(
        0,
        10,
      )}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
