import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

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

  if (!name || !email || !message) {
    return Response.json(
      { error: "name, email, and message are required" },
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
    studentInfo: body.studentInfo?.trim() || undefined,
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

  // Email-out to Sara + Paula (and CC to submitter) requires SES/Resend setup.
  // Tracked: when RESEND_API_KEY is provisioned, add the send call here.

  return Response.json({ ok: true, id: item.id });
}
