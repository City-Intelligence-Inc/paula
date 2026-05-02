import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

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
