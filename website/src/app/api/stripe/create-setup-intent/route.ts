import { GetCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";
import { getStripe } from "@/lib/server/stripe";

interface Body {
  parentId?: string;
  studentId?: string;
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // empty body is allowed — fall through to lookup-by-Clerk
  }

  const c = ddb();
  const stripe = await getStripe();

  let parent: Record<string, unknown> | null = null;
  if (body.parentId) {
    const r = await c.send(
      new GetCommand({ TableName: Tables.parents, Key: { id: body.parentId } }),
    );
    parent = (r.Item as Record<string, unknown>) || null;
  } else if (body.studentId) {
    const s = await c.send(
      new GetCommand({ TableName: Tables.students, Key: { id: body.studentId } }),
    );
    const familyId = s.Item?.familyId as string | undefined;
    if (familyId) {
      const ps = await c.send(
        new ScanCommand({
          TableName: Tables.parents,
          FilterExpression: "familyId = :f",
          ExpressionAttributeValues: { ":f": familyId },
          Limit: 5,
        }),
      );
      parent = (ps.Items?.[0] as Record<string, unknown>) || null;
    }
  } else {
    const ps = await c.send(
      new ScanCommand({
        TableName: Tables.parents,
        FilterExpression: "clerkUserId = :u",
        ExpressionAttributeValues: { ":u": auth.userId },
        Limit: 1,
      }),
    );
    parent = (ps.Items?.[0] as Record<string, unknown>) || null;
  }

  if (!parent) {
    return Response.json({ error: "No parent record found" }, { status: 404 });
  }

  let stripeCustomerId = parent.stripeCustomerId as string | undefined;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: parent.email as string,
      name: `${parent.firstName} ${parent.lastName}`.trim(),
      metadata: {
        parentId: parent.id as string,
        familyId: parent.familyId as string,
      },
    });
    stripeCustomerId = customer.id;
    await c.send(
      new UpdateCommand({
        TableName: Tables.parents,
        Key: { id: parent.id },
        UpdateExpression: "SET stripeCustomerId = :s, updatedAt = :u",
        ExpressionAttributeValues: {
          ":s": stripeCustomerId,
          ":u": new Date().toISOString(),
        },
      }),
    );
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    usage: "off_session",
  });

  return Response.json({
    clientSecret: setupIntent.client_secret,
    customerId: stripeCustomerId,
  });
}
