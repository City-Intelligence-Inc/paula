import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const result = await ddb().send(
    new GetCommand({
      TableName: Tables.users,
      Key: { clerkUserId: auth.userId },
    }),
  );

  if (!result.Item) {
    return Response.json({
      user: {
        clerkUserId: auth.userId,
        role: "parent",
        linkedEntityId: null,
        provisional: true,
      },
    });
  }
  return Response.json({ user: result.Item });
}
