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

// One-stop helper for "an action happened — record it in the notifications
// inbox AND email the admins." Used by every Stripe/admin/tutor CRUD touch
// point so Paula + Ari get notified on every action.
//
// The DDB write and the Resend send are independent — a failure on one
// doesn't block the other. Returns the notification id (or null on full
// failure) so callers can attach it to audit logs.

import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";

export interface NotifyActionInput {
  kind: string;                 // e.g. "tutor.created", "card.removed"
  summary: string;              // human-readable sentence for the inbox
  subject?: string;             // email subject (defaults to summary)
  details?: Record<string, unknown>;
  attachments?: NotifyAttachment[];
}

export async function notifyAction(
  input: NotifyActionInput,
): Promise<{ id: string | null; emailOk: boolean }> {
  const id = `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const detailRows = Object.entries(input.details || {})
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#666;text-transform:capitalize;">${k}</td><td style="padding:4px 0;color:#111;">${escapeHtml(formatValue(v))}</td></tr>`,
    )
    .join("");

  let writeOk = true;
  try {
    await ddb().send(
      new PutCommand({
        TableName: Tables.notifications,
        Item: {
          id,
          createdAt: now,
          kind: input.kind,
          summary: input.summary,
          details: input.details || {},
          read: false,
        },
      }),
    );
  } catch (err) {
    writeOk = false;
    console.warn(`[notifyAction:${input.kind}] DDB write failed:`, err);
  }

  const result = await sendAdminNotification({
    subject: input.subject || `Mathitude: ${input.summary}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <p style="color:#7030A0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;margin:0 0 8px;">${input.kind.replace(/[._]/g, " ")}</p>
        <h2 style="color:#111;margin:0 0 16px;font-size:20px;line-height:1.3;">${escapeHtml(input.summary)}</h2>
        ${detailRows ? `<table style="border-collapse:collapse;margin:16px 0;font-size:14px;">${detailRows}</table>` : ""}
        <p style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:16px;margin-top:24px;">
          Mathitude · ${new Date(now).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>
    `,
    text: `${input.summary}\n\n${Object.entries(input.details || {})
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join("\n")}`,
    attachments: input.attachments,
  }).catch(() => ({ ok: false, error: "send threw" }));

  return { id: writeOk ? id : null, emailOk: result.ok };
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
