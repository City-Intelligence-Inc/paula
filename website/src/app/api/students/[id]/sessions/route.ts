import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await params;
  const result = await ddb().send(
    new QueryCommand({
      TableName: Tables.sessions,
      KeyConditionExpression: "studentId = :sid",
      ExpressionAttributeValues: { ":sid": id },
      ScanIndexForward: false,
    }),
  );
  return Response.json({ sessions: result.Items || [] });
}
