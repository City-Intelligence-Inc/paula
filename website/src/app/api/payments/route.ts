import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const result = await ddb().send(new ScanCommand({ TableName: Tables.payments }));
  const payments = (result.Items || []).sort((a, b) =>
    new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime(),
  );
  return Response.json({ payments });
}
