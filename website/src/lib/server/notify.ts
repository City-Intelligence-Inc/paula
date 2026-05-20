// Notification email helper. Uses Resend's HTTP API directly so we don't
// carry an SDK dependency just for transactional email.
//
// Environment:
//   RESEND_API_KEY            — Resend API key (re_…)
//   ADMIN_NOTIFICATION_EMAIL  — comma-separated list of admin recipients.
//                               Defaults to phamilton@mathitude.com and
//                               ari@coframe.com so that every notification
//                               reaches Paula AND Ari without needing the
//                               env var configured.
//
// Best-effort throughout: returns { ok, error } and never throws so callers
// can layer it under user-facing flows without blocking the UX path.

const RESEND_FROM = "Mathitude Notifications <onboarding@resend.dev>";

export const DEFAULT_ADMIN_RECIPIENTS = [
  "phamilton@mathitude.com",
  "ari@coframe.com",
];

export function adminRecipients(): string[] {
  const raw = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!raw) return DEFAULT_ADMIN_RECIPIENTS;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_ADMIN_RECIPIENTS;
}

export interface NotifyAttachment {
  filename: string;
  content: string;     // base64-encoded body
  contentType?: string;
}

export interface AdminNotifyInput {
  subject: string;
  html: string;
  text?: string;
  to?: string | string[];
  attachments?: NotifyAttachment[];
}

export async function sendAdminNotification(
  input: AdminNotifyInput,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const to: string[] = Array.isArray(input.to)
    ? input.to
    : typeof input.to === "string"
      ? [input.to]
      : adminRecipients();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to,
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
        ...(input.attachments && input.attachments.length > 0
          ? { attachments: input.attachments }
          : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Encode an ICS string as a base64 attachment Resend accepts directly.
export function icsAttachment(filename: string, ics: string): NotifyAttachment {
  return {
    filename: filename.endsWith(".ics") ? filename : `${filename}.ics`,
    content: Buffer.from(ics, "utf8").toString("base64"),
    contentType: "text/calendar; method=REQUEST; charset=UTF-8",
  };
}
