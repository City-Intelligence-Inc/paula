import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const result = await ddb().send(new ScanCommand({ TableName: Tables.events }));
  const events = (result.Items || []).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string),
  );
  return Response.json({ events });
}
