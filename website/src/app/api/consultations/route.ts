import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { sendAdminNotification } from "@/lib/server/notify";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-west-2" }),
  { marshallOptions: { removeUndefinedValues: true } },
);

// Pinned to the staging table while Sara reviews SCHEMA.md.
// Promote to ${DYNAMODB_TABLE_PREFIX}-consultations when prod tables exist.
const TABLE = process.env.CONSULTATIONS_TABLE || "mathitude-staging-bookings";

const VALID_OFFERINGS = new Set([
  "private-tutoring",
  "small-group",
  "parent-advisories",
  "speaking",
  "school-stem",
  "math-festival",
  "general",
]);

interface ConsultationBody {
  name?: string;
  email?: string;
  phone?: string;
  offering?: string;
  studentInfo?: string;
  message?: string;
  source?: string;
}

export async function POST(request: Request) {
  let body: ConsultationBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const message = body.message?.trim();
  const offering = body.offering?.trim();
  const studentInfo = body.studentInfo?.trim();

  if (!name || !email || !message || !studentInfo) {
    return Response.json(
      { error: "name, email, studentInfo, and message are required" },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  if (offering && !VALID_OFFERINGS.has(offering)) {
    return Response.json({ error: "Invalid offering" }, { status: 400 });
  }

  if (message.length > 5000) {
    return Response.json({ error: "Message too long" }, { status: 400 });
  }

  const item = {
    bookingId: randomUUID(),
    id: `consult_${randomUUID()}`,
    type: "consultation",
    status: "requested",
    parentName: name,
    email,
    phone: body.phone?.trim() || undefined,
    offering: offering || "general",
    studentInfo,
    notes: message,
    source: body.source?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  try {
    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  } catch (err) {
    console.error("Failed to persist consultation:", err);
    return Response.json(
      { error: "Could not record your request. Please email info@mathitude.com." },
      { status: 500 },
    );
  }

  // Notify Paula + Ari via Resend (defaults to both per
  // ADMIN_NOTIFICATION_EMAIL). Best-effort — never blocks the public
  // consultation submission if Resend is misconfigured.
  const offeringLabel =
    {
      "private-tutoring": "Private tutoring",
      "small-group": "Small group engagement",
      "parent-advisories": "Parent advisories",
      speaking: "Speaking engagement",
      "school-stem": "School STEM workshop",
      "math-festival": "Math festival advisory",
      general: "Something else",
    }[item.offering] || item.offering;

  await sendAdminNotification({
    subject: `New consultation: ${name} — ${offeringLabel}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#7030A0;margin:0 0 16px;">New consultation request</h2>
        <table style="border-collapse:collapse;margin:16px 0;font-size:14px;">
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Name</td><td style="padding:4px 0;color:#111;"><strong>${name}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td style="padding:4px 0;color:#111;"><a href="mailto:${email}" style="color:#7030A0;">${email}</a></td></tr>
          ${item.phone ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Phone</td><td style="padding:4px 0;color:#111;">${item.phone}</td></tr>` : ""}
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Interest</td><td style="padding:4px 0;color:#111;">${offeringLabel}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;">Student</td><td style="padding:4px 0;color:#111;">${studentInfo}</td></tr>
        </table>
        <div style="margin-top:16px;padding:16px;background:#faf9fb;border-left:3px solid #7030A0;border-radius:4px;">
          <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Message</p>
          <p style="margin:0;color:#111;white-space:pre-wrap;">${message.replace(/</g, "&lt;")}</p>
        </div>
      </div>
    `,
    text: `New consultation from ${name} <${email}>. Interest: ${offeringLabel}. Student: ${studentInfo}\n\nMessage:\n${message}`,
  }).catch(() => {});

  return Response.json({ ok: true, id: item.id });
}
