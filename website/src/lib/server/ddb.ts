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
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId, response: null as Response | null };
}
