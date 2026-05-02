import { ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;

  if (date) {
    const result = await ddb().send(
      new QueryCommand({
        TableName: Tables.sessions,
        IndexName: "by-date",
        KeyConditionExpression: "#d = :date",
        ExpressionAttributeNames: { "#d": "date" },
        ExpressionAttributeValues: { ":date": date },
      }),
    );
    return Response.json({ sessions: result.Items || [] });
  }

  const result = await ddb().send(
    new ScanCommand({ TableName: Tables.sessions, Limit: 500 }),
  );
  return Response.json({ sessions: result.Items || [] });
}
