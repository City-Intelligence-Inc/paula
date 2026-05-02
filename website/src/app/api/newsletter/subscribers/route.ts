import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const result = await ddb().send(
    new ScanCommand({ TableName: `${process.env.DYNAMODB_TABLE_PREFIX || "mathitude-staging"}-subscribers` }),
  );
  const subscribers = (result.Items || []).sort((a, b) =>
    new Date(b.subscribedAt as string).getTime() - new Date(a.subscribedAt as string).getTime(),
  );
  return Response.json({ subscribers, count: subscribers.length });
}
