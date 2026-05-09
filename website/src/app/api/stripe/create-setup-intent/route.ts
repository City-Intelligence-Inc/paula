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
  const userId = auth.userId!;

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // empty body is fine — fall through to lookup-by-Clerk
  }

  try {
    const c = ddb();
    const stripe = await getStripe();

    let parent: Record<string, unknown> | null = null;

    if (body.parentId) {
      const r = await c.send(
        new GetCommand({
          TableName: Tables.parents,
          Key: { id: body.parentId },
        }),
      );
      parent = (r.Item as Record<string, unknown>) || null;
    } else if (body.studentId) {
      const s = await c.send(
        new GetCommand({
          TableName: Tables.students,
          Key: { id: body.studentId },
        }),
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
      // NOTE: ScanCommand applies `Limit` before `FilterExpression`, so a
      // Limit:1 here would silently miss matching parents and the bootstrap
      // would keep creating duplicate Family+Parent+StripeCustomer rows on
      // every Save Card click. Don't add Limit until we have a
      // by-clerk-user GSI on parents.
      const ps = await c.send(
        new ScanCommand({
          TableName: Tables.parents,
          FilterExpression: "clerkUserId = :u",
          ExpressionAttributeValues: { ":u": userId },
        }),
      );
      // Prefer the most recently created match.
      const matches = (ps.Items as Record<string, unknown>[]) || [];
      matches.sort(
        (a, b) =>
          new Date((b.createdAt as string) || 0).getTime() -
          new Date((a.createdAt as string) || 0).getTime(),
      );
      parent = matches[0] || null;

      // Bootstrap: if the signed-in user has no parent row yet, try to
      // match by Clerk email; if still nothing, auto-create a parent +
      // family so the SaveCard flow works on first sign-in.
      if (!parent) {
        let email = "";
        let firstName = "";
        let lastName = "";
        try {
          const cu = await currentUser();
          email =
            cu?.primaryEmailAddress?.emailAddress ||
            cu?.emailAddresses?.[0]?.emailAddress ||
            "";
          firstName = cu?.firstName || "";
          lastName = cu?.lastName || "";
        } catch (e) {
          console.warn("[setup-intent] currentUser() failed:", e);
        }

        if (email) {
          const byEmail = await c.send(
            new ScanCommand({
              TableName: Tables.parents,
              FilterExpression: "email = :e",
              ExpressionAttributeValues: { ":e": email },
              Limit: 1,
            }),
          );
          const matched =
            (byEmail.Items?.[0] as Record<string, unknown>) || null;
          if (matched) {
            await c.send(
              new UpdateCommand({
                TableName: Tables.parents,
                Key: { id: matched.id },
                UpdateExpression: "SET clerkUserId = :u, updatedAt = :n",
                ExpressionAttributeValues: {
                  ":u": userId,
                  ":n": new Date().toISOString(),
                },
              }),
            );
            parent = { ...matched, clerkUserId: userId };
          }
        }

        if (!parent) {
          const now = new Date().toISOString();
          const seed = (email || userId)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 24) || "user";
          const suffix = Math.random().toString(36).slice(2, 6);
          const familyId = `fam_${seed}_${suffix}`;
          const parentId = `par_${seed}_${suffix}`;
          const family = {
            id: familyId,
            primaryPayerId: parentId,
            createdAt: now,
            updatedAt: now,
          };
          // Only set GSI key fields when they have non-empty values —
          // DynamoDB rejects empty strings as values for indexed string
          // attributes (parents.by-family uses lastName range; by-email
          // uses email hash).
          const newParent: Record<string, unknown> = {
            id: parentId,
            familyId,
            clerkUserId: userId,
            createdAt: now,
            updatedAt: now,
          };
          if (firstName) newParent.firstName = firstName;
          if (lastName) newParent.lastName = lastName;
          if (email) newParent.email = email;

          try {
            await Promise.all([
              c.send(
                new PutCommand({ TableName: Tables.families, Item: family }),
              ),
              c.send(
                new PutCommand({
                  TableName: Tables.parents,
                  Item: newParent,
                }),
              ),
            ]);
          } catch (e) {
            console.error(
              "[setup-intent] auto-create parent/family failed:",
              { newParent, family },
              e,
            );
            return Response.json(
              {
                error:
                  "Could not create parent record. " +
                  (e instanceof Error ? e.message : String(e)),
              },
              { status: 500 },
            );
          }
          parent = newParent;
        }
      }
    }

    if (!parent) {
      return Response.json(
        { error: "No parent record found" },
        { status: 404 },
      );
    }

    let stripeCustomerId = parent.stripeCustomerId as string | undefined;
    if (!stripeCustomerId) {
      const customerArgs: {
        email?: string;
        name?: string;
        metadata: Record<string, string>;
      } = {
        metadata: {
          parentId: parent.id as string,
          familyId: (parent.familyId as string) || "",
        },
      };
      const parentEmail = (parent.email as string) || "";
      if (parentEmail) customerArgs.email = parentEmail;
      const fullName = `${(parent.firstName as string) || ""} ${
        (parent.lastName as string) || ""
      }`.trim();
      if (fullName) customerArgs.name = fullName;

      const customer = await stripe.customers.create(customerArgs);
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
  } catch (err) {
    console.error("[setup-intent] failed:", err);
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not create setup intent",
      },
      { status: 500 },
    );
  }
}
