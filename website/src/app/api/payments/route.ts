import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";

export async function GET() {
  const { actor, response } = await resolveActor();
  if (response) return response;

  // Tutors never see pricing/payment data.
  if (actor!.role === "tutor") return forbidden("Payment data is not available to tutors.");

  const c = ddb();

  // Admins get all payments.
  if (actor!.isAdmin) {
    const result = await c.send(new ScanCommand({ TableName: Tables.payments }));
    const payments = (result.Items || []).sort((a, b) =>
      new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime(),
    );
    return Response.json({ payments });
  }

  // Parents see only their own family's payments (filtered by studentId).
  const parentsResult = await c.send(
    new ScanCommand({
      TableName: Tables.parents,
      FilterExpression: "clerkUserId = :u",
      ExpressionAttributeValues: { ":u": actor!.userId },
    }),
  );
  const parent = (parentsResult.Items || [])[0] as Record<string, unknown> | undefined;
  if (!parent?.familyId) {
    return Response.json({ payments: [] });
  }

  const studentsResult = await c.send(
    new ScanCommand({
      TableName: Tables.students,
      FilterExpression: "familyId = :f",
      ExpressionAttributeValues: { ":f": parent.familyId },
      ProjectionExpression: "id",
    }),
  );
  const studentIds = new Set(
    (studentsResult.Items || []).map((s) => (s as Record<string, unknown>).id as string),
  );

  if (studentIds.size === 0) return Response.json({ payments: [] });

  const paymentsResult = await c.send(new ScanCommand({ TableName: Tables.payments }));
  const payments = (paymentsResult.Items || [])
    .filter((p) => studentIds.has((p as Record<string, unknown>).studentId as string))
    .sort((a, b) =>
      new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime(),
    );
  return Response.json({ payments });
}
