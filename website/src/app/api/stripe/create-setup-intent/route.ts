import {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { currentUser } from "@clerk/nextjs/server";
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

    // Bootstrap: if the signed-in user has no parent row yet, try to match
    // by Clerk email; if still nothing, auto-create a parent + family for
    // them so the SaveCard flow works on first sign-in.
    if (!parent) {
      const cu = await currentUser();
      const email =
        cu?.primaryEmailAddress?.emailAddress ||
        cu?.emailAddresses?.[0]?.emailAddress ||
        "";
      const firstName = cu?.firstName || "";
      const lastName = cu?.lastName || "";
      if (email) {
        const byEmail = await c.send(
          new ScanCommand({
            TableName: Tables.parents,
            FilterExpression: "email = :e",
            ExpressionAttributeValues: { ":e": email },
            Limit: 1,
          }),
        );
        const matched = (byEmail.Items?.[0] as Record<string, unknown>) || null;
        if (matched) {
          // Link the existing parent to this Clerk user.
          await c.send(
            new UpdateCommand({
              TableName: Tables.parents,
              Key: { id: matched.id },
              UpdateExpression:
                "SET clerkUserId = :u, updatedAt = :n",
              ExpressionAttributeValues: {
                ":u": auth.userId,
                ":n": new Date().toISOString(),
              },
            }),
          );
          parent = { ...matched, clerkUserId: auth.userId };
        }
      }
      if (!parent) {
        const now = new Date().toISOString();
        const seed = (email || auth.userId || "user")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .slice(0, 24);
        const suffix = Math.random().toString(36).slice(2, 6);
        const familyId = `fam_${seed}_${suffix}`;
        const parentId = `par_${seed}_${suffix}`;
        const family = {
          id: familyId,
          primaryPayerId: parentId,
          createdAt: now,
          updatedAt: now,
        };
        const newParent = {
          id: parentId,
          familyId,
          firstName: firstName || "",
          lastName: lastName || "",
          email: email || "",
          clerkUserId: auth.userId,
          createdAt: now,
          updatedAt: now,
        };
        await Promise.all([
          c.send(new PutCommand({ TableName: Tables.families, Item: family })),
          c.send(new PutCommand({ TableName: Tables.parents, Item: newParent })),
        ]);
        parent = newParent as Record<string, unknown>;
      }
    }
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
