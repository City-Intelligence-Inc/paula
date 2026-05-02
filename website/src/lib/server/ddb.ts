import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
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
