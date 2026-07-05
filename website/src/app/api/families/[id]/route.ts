import {
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser, requireAdmin } from "@/lib/server/ddb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await params;
  const c = ddb();

  const [family, parents, students] = await Promise.all([
    c.send(new GetCommand({ TableName: Tables.families, Key: { id } })),
    c.send(
      new QueryCommand({
        TableName: Tables.parents,
        IndexName: "by-family",
        KeyConditionExpression: "familyId = :f",
        ExpressionAttributeValues: { ":f": id },
      }),
    ),
    c.send(
      new QueryCommand({
        TableName: Tables.students,
        IndexName: "by-family",
        KeyConditionExpression: "familyId = :f",
        ExpressionAttributeValues: { ":f": id },
      }),
    ),
  ]);

  if (!family.Item) {
    return Response.json({ error: "Family not found" }, { status: 404 });
  }

  return Response.json({
    family: family.Item,
    parents: parents.Items || [],
    students: students.Items || [],
  });
}

interface PutBody {
  primaryPayerId?: string;
  depositCents?: number; // B-4 ledger: upfront deposit for the academic year
  depositNote?: string;
}

// PUT /api/families/[id]
// Updates the family's Primary Payer (the parent whose Stripe customer is
// the source of truth for charges when a student doesn't override it via
// Student.primaryPayerParentId) and/or the recorded upfront deposit that the
// ledger view (B-4) draws down against the year's first sessions.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;

  let body: PutBody;
  try {
    body = (await request.json()) as PutBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sets: string[] = ["updatedAt = :u"];
  const values: Record<string, unknown> = { ":u": new Date().toISOString() };

  if (body.primaryPayerId) {
    sets.push("primaryPayerId = :p");
    values[":p"] = body.primaryPayerId;
  }
  if (typeof body.depositCents === "number") {
    if (!Number.isFinite(body.depositCents) || body.depositCents < 0) {
      return Response.json(
        { error: "depositCents must be a non-negative number" },
        { status: 400 },
      );
    }
    sets.push("depositCents = :d", "depositReceivedAt = :dr");
    values[":d"] = Math.round(body.depositCents);
    values[":dr"] = new Date().toISOString();
  }
  if (typeof body.depositNote === "string") {
    sets.push("depositNote = :dn");
    values[":dn"] = body.depositNote.trim();
  }

  if (sets.length === 1) {
    return Response.json(
      { error: "Nothing to update — send primaryPayerId, depositCents, or depositNote." },
      { status: 400 },
    );
  }

  const out = await ddb().send(
    new UpdateCommand({
      TableName: Tables.families,
      Key: { id },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }),
  );
  return Response.json({ family: out.Attributes });
}
