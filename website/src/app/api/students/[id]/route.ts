import { GetCommand } from "@aws-sdk/lib-dynamodb";
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
