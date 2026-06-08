// Create all Mathitude DynamoDB tables in the local dynalite instance.
// Mirrors infra/dynamodb.tf (+ notifications and user-roles tables that the
// app code references but the terraform doesn't yet declare).
//
//   node scripts/create-local-tables.mjs
//
import {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";

const endpoint = process.env.AWS_ENDPOINT_URL_DYNAMODB || "http://localhost:8000";
const PREFIX = process.env.DYNAMODB_TABLE_PREFIX || "mathitude-staging";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
  endpoint,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

const S = (name) => ({ AttributeName: name, AttributeType: "S" });
const gsi = (name, hash, range) => ({
  IndexName: name,
  KeySchema: [
    { AttributeName: hash, KeyType: "HASH" },
    ...(range ? [{ AttributeName: range, KeyType: "RANGE" }] : []),
  ],
  Projection: { ProjectionType: "ALL" },
});

const tables = [
  {
    name: "students",
    keys: [{ AttributeName: "id", KeyType: "HASH" }],
    attrs: [S("id"), S("status"), S("lastName"), S("familyId")],
    gsis: [gsi("by-status", "status", "lastName"), gsi("by-family", "familyId", "lastName")],
  },
  {
    name: "sessions",
    keys: [
      { AttributeName: "studentId", KeyType: "HASH" },
      { AttributeName: "dateTime", KeyType: "RANGE" },
    ],
    attrs: [S("studentId"), S("dateTime"), S("date"), S("time"), S("tutorId"), S("status")],
    gsis: [
      gsi("by-date", "date", "time"),
      gsi("by-tutor-date", "tutorId", "dateTime"),
      gsi("by-status", "status", "dateTime"),
    ],
  },
  {
    name: "payments",
    keys: [
      { AttributeName: "studentId", KeyType: "HASH" },
      { AttributeName: "createdAt", KeyType: "RANGE" },
    ],
    attrs: [S("studentId"), S("createdAt"), S("paymentStatus")],
    gsis: [gsi("by-status", "paymentStatus", "createdAt")],
  },
  {
    name: "events",
    keys: [
      { AttributeName: "id", KeyType: "HASH" },
      { AttributeName: "date", KeyType: "RANGE" },
    ],
    attrs: [S("id"), S("date"), S("type")],
    gsis: [gsi("by-type", "type", "date")],
  },
  {
    name: "resources",
    keys: [
      { AttributeName: "category", KeyType: "HASH" },
      { AttributeName: "id", KeyType: "RANGE" },
    ],
    attrs: [S("category"), S("id")],
  },
  {
    name: "subscribers",
    keys: [{ AttributeName: "email", KeyType: "HASH" }],
    attrs: [S("email")],
  },
  {
    name: "bookings",
    keys: [{ AttributeName: "id", KeyType: "HASH" }],
    attrs: [S("id"), S("createdAt"), S("status")],
    gsis: [gsi("by-status", "status", "createdAt")],
  },
  {
    name: "content",
    keys: [
      { AttributeName: "pageId", KeyType: "HASH" },
      { AttributeName: "blockId", KeyType: "RANGE" },
    ],
    attrs: [S("pageId"), S("blockId")],
  },
  {
    name: "families",
    keys: [{ AttributeName: "id", KeyType: "HASH" }],
    attrs: [S("id")],
  },
  {
    name: "parents",
    keys: [{ AttributeName: "id", KeyType: "HASH" }],
    attrs: [S("id"), S("familyId"), S("lastName"), S("email"), S("stripeCustomerId")],
    gsis: [
      gsi("by-family", "familyId", "lastName"),
      gsi("by-email", "email"),
      gsi("by-stripe-customer", "stripeCustomerId"),
    ],
  },
  {
    name: "tutors",
    keys: [{ AttributeName: "id", KeyType: "HASH" }],
    attrs: [S("id"), S("clerkUserId")],
    gsis: [gsi("by-clerk-user", "clerkUserId")],
  },
  {
    name: "users",
    keys: [{ AttributeName: "clerkUserId", KeyType: "HASH" }],
    attrs: [S("clerkUserId"), S("role"), S("createdAt")],
    gsis: [gsi("by-role", "role", "createdAt")],
  },
  {
    name: "secrets",
    keys: [{ AttributeName: "id", KeyType: "HASH" }],
    attrs: [S("id")],
  },
  {
    name: "notifications",
    keys: [{ AttributeName: "id", KeyType: "HASH" }],
    attrs: [S("id")],
  },
  {
    name: "user-roles",
    keys: [{ AttributeName: "clerkUserId", KeyType: "HASH" }],
    attrs: [S("clerkUserId")],
  },
];

const existing = new Set(
  (await client.send(new ListTablesCommand({})).catch(() => ({}))).TableNames || [],
);

for (const t of tables) {
  const TableName = `${PREFIX}-${t.name}`;
  if (existing.has(TableName)) {
    console.log(`skip  ${TableName} (exists)`);
    continue;
  }
  await client.send(
    new CreateTableCommand({
      TableName,
      BillingMode: "PAY_PER_REQUEST",
      KeySchema: t.keys,
      AttributeDefinitions: t.attrs,
      ...(t.gsis ? { GlobalSecondaryIndexes: t.gsis } : {}),
    }),
  );
  console.log(`created ${TableName}`);
}

const after = (await client.send(new ListTablesCommand({}))).TableNames || [];
console.log(`\n${after.length} tables present:\n  ${after.join("\n  ")}`);
