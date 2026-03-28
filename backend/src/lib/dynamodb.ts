import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
});

export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const prefix = process.env.DYNAMODB_TABLE_PREFIX || "mathitude";

export const Tables = {
  students: `${prefix}-students`,
  sessions: `${prefix}-sessions`,
  payments: `${prefix}-payments`,
  events: `${prefix}-events`,
  resources: `${prefix}-resources`,
  subscribers: `${prefix}-subscribers`,
  content: `${prefix}-content`,
} as const;
