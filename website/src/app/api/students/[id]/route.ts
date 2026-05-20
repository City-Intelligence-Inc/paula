import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await params;
  const result = await ddb().send(
    new GetCommand({ TableName: Tables.students, Key: { id } }),
  );
  if (!result.Item) {
    return Response.json({ error: "Student not found" }, { status: 404 });
  }
  return Response.json({ student: result.Item });
}

const editableFields = [
  "firstName",
  "lastName",
  "grade",
  "status",
  "parentName",
  "parentEmail",
  "parentPhone",
  "sessionType",
  "rate",
  "tutorIds",
  "primaryPayerParentId",
] as const;

type Editable = (typeof editableFields)[number];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sets: string[] = ["#updatedAt = :updatedAt"];
  const names: Record<string, string> = { "#updatedAt": "updatedAt" };
  const values: Record<string, unknown> = {
    ":updatedAt": new Date().toISOString(),
  };

  for (const f of editableFields as readonly Editable[]) {
    if (!(f in body)) continue;
    const v = body[f];
    if (v === undefined) continue;
    names[`#${f}`] = f;
    values[`:${f}`] = v;
    sets.push(`#${f} = :${f}`);
  }

  if (sets.length === 1) {
    return Response.json({ error: "No editable fields supplied" }, { status: 400 });
  }

  try {
    const out = await ddb().send(
      new UpdateCommand({
        TableName: Tables.students,
        Key: { id },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      }),
    );
    return Response.json({ student: out.Attributes });
  } catch (err) {
    console.error("[PUT /api/students/:id] failed:", err);
    return Response.json(
      { error: "Update failed", detail: String(err) },
      { status: 500 },
    );
  }
}
