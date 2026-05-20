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
}

// PUT /api/families/[id]
// Currently used to change which parent is the family's Primary Payer
// (the parent whose Stripe customer is the source of truth for charges
// when a student doesn't override it via Student.primaryPayerParentId).
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

  if (!body.primaryPayerId) {
    return Response.json(
      { error: "primaryPayerId is required" },
      { status: 400 },
    );
  }

  const out = await ddb().send(
    new UpdateCommand({
      TableName: Tables.families,
      Key: { id },
      UpdateExpression:
        "SET primaryPayerId = :p, updatedAt = :u",
      ExpressionAttributeValues: {
        ":p": body.primaryPayerId,
        ":u": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    }),
  );
  return Response.json({ family: out.Attributes });
}
