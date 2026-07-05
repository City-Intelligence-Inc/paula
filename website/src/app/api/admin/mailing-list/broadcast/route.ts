import { resolveActor, forbidden } from "@/lib/server/access";
import { listContacts } from "@/lib/server/contacts";
import { notifyAction } from "@/lib/server/notify";

// Mailing-list broadcast — the list is OUR contacts table; sending loops
// through subscribed contacts with the same sending-only Resend key used
// for all transactional email. No external audience, no extra permissions.
//
// GET  → { subscribers } (count for the compose UI)
// POST → { subject, message } — master only; message is plain text
//        (paragraph breaks preserved). Every email carries a tokenized
//        one-click unsubscribe link + List-Unsubscribe header.

const FROM = "Mathitude <onboarding@resend.dev>";
const BATCH_SIZE = 100; // Resend /emails/batch cap

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden();
  const contacts = await listContacts();
  return Response.json({
    subscribers: contacts.filter((c) => !c.unsubscribed).length,
    unsubscribed: contacts.filter((c) => c.unsubscribed).length,
  });
}

export async function POST(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isMaster) {
    return forbidden("Only the super admin sends broadcasts.");
  }

  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    return Response.json(
      { error: "RESEND_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  let body: { subject?: string; message?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const subject = (body.subject || "").trim().slice(0, 200);
  const message = (body.message || "").trim().slice(0, 20000);
  if (!subject || !message) {
    return Response.json(
      { error: "subject and message are required" },
      { status: 400 },
    );
  }

  const recipients = (await listContacts()).filter(
    (c) => !c.unsubscribed && c.email.includes("@"),
  );
  if (recipients.length === 0) {
    return Response.json({ error: "No subscribed contacts to send to." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const paragraphs = message
    .split(/\n{2,}/)
    .map((p) => `<p style="color:#111;font-size:15px;line-height:1.6;margin:0 0 14px;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  let sent = 0;
  const failures: string[] = [];
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE).map((c) => {
      const unsubUrl = `${origin}/api/unsubscribe?e=${encodeURIComponent(c.email)}&t=${encodeURIComponent(c.unsubToken || "")}`;
      return {
        from: FROM,
        to: [c.email],
        subject,
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;">
            <h2 style="color:#7030A0;margin:0 0 16px;font-size:20px;">${escapeHtml(subject)}</h2>
            ${paragraphs}
            <p style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:16px;margin-top:24px;">
              You're receiving this because you're on the Mathitude mailing list.
              <a href="${unsubUrl}" style="color:#888;">Unsubscribe</a>
            </p>
          </div>
        `,
        text: `${message}\n\n—\nUnsubscribe: ${unsubUrl}`,
      };
    });

    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });
      if (res.ok) {
        sent += batch.length;
      } else {
        const t = await res.text().catch(() => "");
        failures.push(`batch ${i / BATCH_SIZE + 1}: ${res.status} ${t.slice(0, 150)}`);
      }
    } catch (err) {
      failures.push(`batch ${i / BATCH_SIZE + 1}: ${String(err)}`);
    }
  }

  await notifyAction({
    kind: "mailing-list.broadcast",
    summary: `Broadcast "${subject}" sent to ${sent}/${recipients.length} subscribers`,
    details: { sent, total: recipients.length, failures: failures.slice(0, 5) },
  }).catch(() => {});

  return Response.json({
    ok: failures.length === 0,
    sent,
    total: recipients.length,
    failures,
  });
}
