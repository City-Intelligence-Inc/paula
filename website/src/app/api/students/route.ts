import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;

  const params: ScanCommandInput = { TableName: Tables.students };
  if (q) {
    params.FilterExpression =
      "contains(firstName, :q) OR contains(lastName, :q) OR contains(parentName, :q) OR contains(grade, :q)";
    params.ExpressionAttributeValues = { ":q": q };
  }

  const result = await ddb().send(new ScanCommand(params));
  return Response.json({ students: result.Items || [] });
}
