// Admin notification email helper.
//
// Uses Resend's HTTP API directly (no SDK) so we don't carry a dependency
// solely to send transactional email. Configure two env vars:
//
//   RESEND_API_KEY            — your Resend API key (re_…)
//   ADMIN_NOTIFICATION_EMAIL  — where admin alerts should be delivered
//                               (default: ari@coframe.com)
//
// Best-effort by design: returns { ok, error } and never throws. Callers
// should not block the user-facing path on email delivery.

const RESEND_FROM = "Mathitude Notifications <onboarding@resend.dev>";

export interface AdminNotifyInput {
  subject: string;
  html: string;
  text?: string;
  to?: string;
}

export async function sendAdminNotification(
  input: AdminNotifyInput,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const to =
    input.to ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    "ari@coframe.com";

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
