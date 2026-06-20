import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/server/ddb";
import { sendAdminNotification } from "@/lib/server/notify";

const TABLE = `${process.env.DYNAMODB_TABLE_PREFIX || "mathitude-staging"}-subscribers`;

export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json()) as Record<string, unknown>;
    email = String(body.email || "").toLowerCase().trim();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  const now = new Date().toISOString();

  await ddb().send(
    new PutCommand({
      TableName: TABLE,
      Item: { email, subscribedAt: now },
    }),
  );

  sendAdminNotification({
    subject: `New newsletter subscriber: ${email}`,
    html: `<p style="font-family:sans-serif;font-size:15px;color:#111;">${email} subscribed to the Mathitude newsletter.</p>`,
    text: `${email} subscribed to the Mathitude newsletter.`,
  }).catch(() => {});

  return Response.json({ ok: true });
}
