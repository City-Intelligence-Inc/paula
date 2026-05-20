// RFC 5545 .ics builder for Mathitude session invites.
//
// Targets all major calendar clients: Google, Apple, Outlook, Yahoo, Fastmail.
// Universal because every modern calendar accepts ICS via file attachment or
// a webcal:// subscription.
//
// Single-event:
//   buildICS({ uid, title, start, end, ... })
//
// Recurring (8-12 week class series):
//   buildICS({ ..., rrule: { freq: "WEEKLY", count: 10 } })
//
// Output is CRLF-terminated UTF-8 text. Lines longer than 75 octets are folded
// per RFC 5545. Attach with Content-Type: text/calendar; method=REQUEST.

export interface ICSAttendee {
  email: string;
  name?: string;
  rsvp?: boolean;
}

export interface ICSEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  url?: string;
  // ISO 8601 strings, either UTC ("2026-06-01T18:00:00Z") or with offset.
  start: string;
  end: string;
  organizerEmail?: string;
  organizerName?: string;
  attendees?: ICSAttendee[];
  rrule?: ICSRecurrence;
  method?: "REQUEST" | "PUBLISH" | "CANCEL";
  status?: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  sequence?: number;
}

export interface ICSRecurrence {
  freq: "DAILY" | "WEEKLY" | "MONTHLY";
  interval?: number;
  count?: number;
  until?: string; // ISO 8601
  byDay?: string[]; // ["MO","WE","FR"]
}

function formatICSDate(iso: string): string {
  // Convert to UTC zulu format: 20260601T180000Z
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

function escape(s: string | undefined): string {
  if (!s) return "";
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// RFC 5545 line folding: lines > 75 octets are split at 75 with a CRLF + space
// continuation. We do byte-aware folding using TextEncoder so multi-byte UTF-8
// characters aren't split mid-codepoint.
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < bytes.length) {
    let chunkEnd = Math.min(cursor + 75, bytes.length);
    // Don't split inside a UTF-8 multi-byte sequence: walk back if needed.
    while (chunkEnd < bytes.length && (bytes[chunkEnd] & 0xc0) === 0x80) {
      chunkEnd--;
    }
    chunks.push(decoder.decode(bytes.slice(cursor, chunkEnd)));
    cursor = chunkEnd;
  }
  return chunks.join("\r\n ");
}

function buildRRULE(r: ICSRecurrence): string {
  const parts: string[] = [`FREQ=${r.freq}`];
  if (r.interval && r.interval > 1) parts.push(`INTERVAL=${r.interval}`);
  if (r.count) parts.push(`COUNT=${r.count}`);
  if (r.until) parts.push(`UNTIL=${formatICSDate(r.until)}`);
  if (r.byDay && r.byDay.length > 0) parts.push(`BYDAY=${r.byDay.join(",")}`);
  return parts.join(";");
}

export function buildICS(event: ICSEvent): string {
  const now = formatICSDate(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mathitude//Mathitude Sessions//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${event.method || "REQUEST"}`,
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICSDate(event.start)}`,
    `DTEND:${formatICSDate(event.end)}`,
    `SUMMARY:${escape(event.title)}`,
    `STATUS:${event.status || "CONFIRMED"}`,
    `SEQUENCE:${event.sequence ?? 0}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escape(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escape(event.location)}`);
  if (event.url) lines.push(`URL:${event.url}`);
  if (event.organizerEmail) {
    const cn = event.organizerName ? `;CN=${escape(event.organizerName)}` : "";
    lines.push(`ORGANIZER${cn}:mailto:${event.organizerEmail}`);
  }
  for (const a of event.attendees || []) {
    const cn = a.name ? `;CN=${escape(a.name)}` : "";
    const rsvp = a.rsvp ? ";RSVP=TRUE" : "";
    lines.push(
      `ATTENDEE${cn}${rsvp};PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:mailto:${a.email}`,
    );
  }
  if (event.rrule) lines.push(`RRULE:${buildRRULE(event.rrule)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

// Convenience: turn a session row into ICS bytes.
export function sessionToICS(input: {
  studentId: string;
  studentName?: string;
  dateTime: string;       // ISO start
  durationMinutes?: number;
  tutorName?: string;
  location?: string;
  organizerEmail?: string;
  attendees?: ICSAttendee[];
  rrule?: ICSRecurrence;
  rsvpUrl?: string;
}): string {
  const start = input.dateTime;
  const end = new Date(
    new Date(start).getTime() + (input.durationMinutes || 60) * 60 * 1000,
  ).toISOString();
  const who = input.studentName || input.studentId;
  const title = input.tutorName
    ? `Mathitude tutoring — ${who} with ${input.tutorName}`
    : `Mathitude tutoring — ${who}`;
  const descLines = [
    `Mathitude tutoring session for ${who}.`,
    input.tutorName ? `Tutor: ${input.tutorName}` : "",
    input.location ? `Location: ${input.location}` : "",
    input.rsvpUrl ? `RSVP: ${input.rsvpUrl}` : "",
  ].filter(Boolean);

  return buildICS({
    uid: `session-${input.studentId}-${start}@mathitude.com`,
    title,
    description: descLines.join("\n"),
    location:
      input.location || "Mathitude — 770 Menlo Ave, Suite 200A, Menlo Park, CA",
    url: input.rsvpUrl,
    start,
    end,
    organizerEmail: input.organizerEmail || "info@mathitude.com",
    organizerName: "Mathitude",
    attendees: input.attendees,
    rrule: input.rrule,
  });
}
