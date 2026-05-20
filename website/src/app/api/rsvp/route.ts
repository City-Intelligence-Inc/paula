import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { sendAdminNotification } from "@/lib/server/notify";

type RsvpStatus = "yes" | "no" | "maybe";

// GET /api/rsvp?student=...&dt=...&status=yes&email=...
// Renders a tiny HTML confirmation. Token-less by design — calendar
// clients fire links blind, and we'd rather record a casual "yes" than
// gate behind auth and silently lose RSVPs.
//
// POST /api/rsvp
// Body: { studentId, dateTime, email, status, name? }
// Same effect, programmatic clients.
//
// Writes one row per (sessionRef, email) into the notifications table
// with kind="session.rsvp". Cheap, scan-friendly, no schema migration.

async function record(
  studentId: string,
  dateTime: string,
  email: string,
  status: RsvpStatus,
  name?: string,
): Promise<void> {
  const c = ddb();
  const now = new Date().toISOString();

  // Mirror the RSVP status onto the session row for fast lookups in the
  // admin UI. session is keyed by (studentId, dateTime); we keep a map
  // of email → status under `rsvps`.
  try {
    await c.send(
      new UpdateCommand({
        TableName: Tables.sessions,
        Key: { studentId, dateTime },
        UpdateExpression:
          "SET rsvps.#e = :s, lastRsvpAt = :n",
        ExpressionAttributeNames: { "#e": email },
        ExpressionAttributeValues: { ":s": status, ":n": now },
      }),
    );
  } catch {
    // The rsvps map may not exist yet — initialize it.
    await c.send(
      new UpdateCommand({
        TableName: Tables.sessions,
        Key: { studentId, dateTime },
        UpdateExpression: "SET rsvps = :m, lastRsvpAt = :n",
        ExpressionAttributeValues: {
          ":m": { [email]: status },
          ":n": now,
        },
      }),
    );
  }

  // Append a notification row so admins see the RSVP in their inbox.
  try {
    await c.send(
      new PutCommand({
        TableName: Tables.notifications,
        Item: {
          id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: now,
          kind: "session.rsvp",
          studentId,
          dateTime,
          email,
          name: name || null,
          rsvp: status,
          read: false,
        },
      }),
    );
  } catch (err) {
    console.warn("[rsvp] notifications insert failed:", err);
  }

  // Best-effort admin email.
  await sendAdminNotification({
    subject: `RSVP: ${email} → ${status.toUpperCase()} for session ${dateTime.slice(0, 16)}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#7030A0;margin:0 0 16px;">Session RSVP</h2>
        <p style="color:#111;font-size:15px;margin:0 0 12px;">
          <strong>${name || email}</strong> responded
          <strong>${status.toUpperCase()}</strong>.
        </p>
        <table style="border-collapse:collapse;margin:16px 0;font-size:14px;">
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Student ID</td><td style="padding:4px 0;color:#111;font-family:monospace;font-size:12px;">${studentId}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">When</td><td style="padding:4px 0;color:#111;">${dateTime}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td style="padding:4px 0;color:#111;">${email}</td></tr>
        </table>
      </div>
    `,
    text: `${name || email} responded ${status.toUpperCase()} for ${studentId} at ${dateTime}.`,
  }).catch(() => {});
}

function htmlOk(status: RsvpStatus, name: string): string {
  const verb =
    status === "yes" ? "See you there." : status === "no" ? "Got it." : "Tentative — noted.";
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>RSVP received</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #faf9fb; color: #111; margin: 0; padding: 0; }
  main { max-width: 480px; margin: 80px auto; padding: 32px; background: #fff; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.04); text-align: center; }
  h1 { color: #7030A0; font-size: 28px; margin: 0 0 8px; }
  p { color: #444; font-size: 16px; line-height: 1.5; }
</style></head><body><main>
  <h1>Thanks, ${name || "friend"}</h1>
  <p>${verb}</p>
  <p style="font-size:13px;color:#888;margin-top:24px;">Mathitude — math engagement and tutoring</p>
</main></body></html>`;
}

function htmlErr(msg: string): string {
  return `<!doctype html><html><body style="font-family:sans-serif;padding:40px;text-align:center;">
  <h2 style="color:#b00;">RSVP error</h2><p>${msg}</p></body></html>`;
}

export async function GET(request: Request) {
  const u = new URL(request.url);
  const studentId = u.searchParams.get("student") || "";
  const dateTime = u.searchParams.get("dt") || "";
  const email = (u.searchParams.get("email") || "").toLowerCase();
  const statusRaw = (u.searchParams.get("status") || "").toLowerCase();
  const name = u.searchParams.get("name") || "";

  if (!studentId || !dateTime) {
    return new Response(htmlErr("Missing student or session"), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }
  // No email? render a tiny form so the recipient can type theirs.
  if (!email || !["yes", "no", "maybe"].includes(statusRaw)) {
    const form = `<!doctype html><html><head><meta charset="utf-8"><title>RSVP</title>
<style>body{font-family:-apple-system,sans-serif;background:#faf9fb;color:#111;margin:0;padding:0}
main{max-width:420px;margin:80px auto;padding:32px;background:#fff;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.04)}
h1{color:#7030A0;font-size:24px;margin:0 0 8px}
label{display:block;margin-top:16px;font-size:13px;color:#444}
input,select{width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:15px;margin-top:4px;box-sizing:border-box}
button{margin-top:20px;width:100%;background:#7030A0;color:#fff;border:0;border-radius:8px;padding:12px;font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;cursor:pointer}
button:hover{background:#5d288a}
</style></head><body><main>
<h1>RSVP to Mathitude</h1>
<form method="POST" action="/api/rsvp">
  <input type="hidden" name="studentId" value="${studentId}">
  <input type="hidden" name="dateTime" value="${dateTime}">
  <label>Your name<input name="name" required></label>
  <label>Your email<input name="email" type="email" required></label>
  <label>Going?<select name="status"><option value="yes">Yes</option><option value="no">No</option><option value="maybe">Maybe</option></select></label>
  <button type="submit">Send RSVP</button>
</form>
</main></body></html>`;
    return new Response(form, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  await record(studentId, dateTime, email, statusRaw as RsvpStatus, name);
  return new Response(htmlOk(statusRaw as RsvpStatus, name), {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
  } else {
    const form = await request.formData();
    form.forEach((v, k) => {
      body[k] = String(v);
    });
  }
  const studentId = String(body.studentId || "");
  const dateTime = String(body.dateTime || "");
  const email = String(body.email || "").toLowerCase();
  const status = String(body.status || "").toLowerCase() as RsvpStatus;
  const name = body.name ? String(body.name) : undefined;
  if (!studentId || !dateTime || !email || !["yes", "no", "maybe"].includes(status)) {
    if (ct.includes("application/json")) {
      return Response.json({ error: "Missing or invalid fields" }, { status: 400 });
    }
    return new Response(htmlErr("Missing fields"), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }
  await record(studentId, dateTime, email, status, name);
  if (ct.includes("application/json")) {
    return Response.json({ ok: true });
  }
  return new Response(htmlOk(status, name || ""), {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
