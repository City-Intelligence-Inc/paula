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
      FilterExpression: "#t = :note",
      ExpressionAttributeNames: { "#t": "type" },
      ExpressionAttributeValues: { ":sid": id, ":note": "note" },
    }),
  );
  const notes = (result.Items || []).sort((a, b) =>
    (b.dateTime as string).localeCompare(a.dateTime as string),
  );
  return Response.json({ notes });
}
