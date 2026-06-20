// Pure helper functions for post-session email notifications.
// Extracted from the sessions route so they can be unit-tested without
// any DDB or Resend calls.

export function buildEmailRecipients(
  parentEmail?: string,
  studentEmail?: string,
): string[] {
  const parent = parentEmail?.trim() ?? "";
  const student = studentEmail?.trim() ?? "";
  const out: string[] = [];
  if (parent) out.push(parent);
  if (student && student.toLowerCase() !== parent.toLowerCase()) out.push(student);
  return out;
}

export function buildSessionSubject(
  studentName: string,
  dateLabel: string,
): string {
  const name = studentName.trim() || "your student";
  return `Mathitude session notes — ${name}, ${dateLabel}`;
}

export function buildNotesHtml(
  studentName: string,
  dateLabel: string,
  notes: string,
  dashboardUrl: string,
): string {
  const name = studentName.trim() || "your student";
  const notesHtml = escapeHtml(notes).replace(/\n/g, "<br/>");
  return `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <p style="color:#7030A0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;margin:0 0 8px;">Mathitude</p>
        <h2 style="color:#111;margin:0 0 4px;font-size:20px;">Session notes</h2>
        <p style="color:#666;font-size:14px;margin:0 0 24px;">${escapeHtml(name)} &middot; ${escapeHtml(dateLabel)}</p>
        <div style="background:#faf9f8;border-left:3px solid #7030A0;padding:16px 20px;border-radius:0 8px 8px 0;font-size:15px;line-height:1.6;color:#222;">${notesHtml}</div>
        <p style="margin:24px 0 0;font-size:13px;color:#888;">
          <a href="${escapeHtml(dashboardUrl)}" style="color:#7030A0;text-decoration:none;">View all session notes →</a>
        </p>
        <p style="margin:32px 0 0;font-size:12px;color:#bbb;border-top:1px solid #eee;padding-top:16px;">
          Mathitude · Menlo Park, CA · <a href="mailto:info@mathitude.com" style="color:#bbb;">info@mathitude.com</a>
        </p>
      </div>
    `;
}

export function buildNotesText(
  studentName: string,
  dateLabel: string,
  notes: string,
  dashboardUrl: string,
): string {
  const name = studentName.trim() || "your student";
  return `Mathitude session notes — ${name}, ${dateLabel}\n\n${notes}\n\nView all notes: ${dashboardUrl}`;
}

export function formatSessionDateLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
