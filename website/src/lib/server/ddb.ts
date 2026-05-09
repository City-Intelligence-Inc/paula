import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs/server";

let _ddb: DynamoDBDocumentClient | null = null;

export function ddb() {
  if (!_ddb) {
    _ddb = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: process.env.AWS_REGION || "us-west-2" }),
      { marshallOptions: { removeUndefinedValues: true } },
    );
  }
  return _ddb;
}

const PREFIX = process.env.DYNAMODB_TABLE_PREFIX || "mathitude-staging";

export const Tables = {
  students: `${PREFIX}-students`,
  sessions: `${PREFIX}-sessions`,
  payments: `${PREFIX}-payments`,
  events: `${PREFIX}-events`,
  resources: `${PREFIX}-resources`,
  bookings: `${PREFIX}-bookings`,
  content: `${PREFIX}-content`,
  families: `${PREFIX}-families`,
  parents: `${PREFIX}-parents`,
  tutors: `${PREFIX}-tutors`,
  users: `${PREFIX}-users`,
  secrets: `${PREFIX}-secrets`,
} as const;

export async function requireUser() {
  try {
    const { userId } = await auth();
    console.log("[requireUser]", {
      userId,
      hasAwsKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecret: !!process.env.AWS_SECRET_ACCESS_KEY,
      prefix: process.env.DYNAMODB_TABLE_PREFIX || "(default)",
      region: process.env.AWS_REGION || "(default)",
    });
    if (!userId) {
      return { userId: null, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { userId, response: null as Response | null };
  } catch (err) {
    console.error("[requireUser] auth() threw:", err);
    return {
      userId: null,
      response: Response.json({ error: "Auth error", detail: String(err) }, { status: 500 }),
    };
  }
}

// Admin gate. A caller is admin if EITHER:
//   1. Their clerkUserId is listed (comma-separated) in ADMIN_CLERK_USER_IDS, or
//   2. mathitude-users has a row with their clerkUserId where role === "admin".
// Returns the same shape as requireUser().
export async function requireAdmin() {
  const base = await requireUser();
  if (base.response) return base;
  const userId = base.userId!;

  const allowlist = (process.env.ADMIN_CLERK_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowlist.includes(userId)) return base;

  try {
    const r = await ddb().send(
      new GetCommand({ TableName: Tables.users, Key: { clerkUserId: userId } }),
    );
    if (r.Item?.role === "admin") return base;
  } catch (err) {
    console.warn("[requireAdmin] users lookup failed:", err);
  }

  return {
    userId: null,
    response: Response.json({ error: "Forbidden" }, { status: 403 }),
  };
}
