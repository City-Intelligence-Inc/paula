import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";

export async function GET() {
  // Payment/pricing data is hidden from tutors (5/17 Paula — pricing blind to
  // tutors). Admins only.
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Payment data is restricted to admins.");

  const result = await ddb().send(new ScanCommand({ TableName: Tables.payments }));
  const payments = (result.Items || []).sort((a, b) =>
    new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime(),
  );
  return Response.json({ payments });
}
