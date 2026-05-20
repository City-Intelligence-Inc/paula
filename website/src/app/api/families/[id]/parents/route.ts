import {
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";
import { notifyAction } from "@/lib/server/notify";

interface AddParentBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

// POST /api/families/[id]/parents → add a second (or third) parent to an
// existing family. Mom and dad each get their own Parent record (and
// eventually their own Stripe customer when they save a card). The family
// keeps a single primaryPayerId pointing at whichever parent's card is the
// default. Siblings inherit the family default unless their Student row
// overrides via primaryPayerParentId.
//
// GET /api/families/[id]/parents → list all parents on the family.
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await ctx.params;

  const r = await ddb().send(
    new QueryCommand({
      TableName: Tables.parents,
      IndexName: "by-family",
      KeyConditionExpression: "familyId = :f",
      ExpressionAttributeValues: { ":f": id },
    }),
  );
  return Response.json({ parents: r.Items || [] });
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id: familyId } = await ctx.params;

  let body: AddParentBody;
  try {
    body = (await request.json()) as AddParentBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.firstName?.trim() && !body.lastName?.trim() && !body.email?.trim()) {
    return Response.json(
      { error: "At least one of firstName, lastName, email is required" },
      { status: 400 },
    );
  }

  const c = ddb();
  const fam = await c.send(
    new GetCommand({ TableName: Tables.families, Key: { id: familyId } }),
  );
  if (!fam.Item) {
    return Response.json({ error: "Family not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const seed =
    slugify(`${body.firstName || ""}_${body.lastName || ""}`) ||
    `p_${Date.now()}`;
  const suffix = Math.random().toString(36).slice(2, 6);
  const parent: Record<string, unknown> = {
    id: `par_${seed}_${suffix}`,
    familyId,
    createdAt: now,
    updatedAt: now,
  };
  if (body.firstName?.trim()) parent.firstName = body.firstName.trim();
  if (body.lastName?.trim()) parent.lastName = body.lastName.trim();
  if (body.email?.trim()) parent.email = body.email.trim();
  if (body.phone?.trim()) parent.phone = body.phone.trim();

  try {
    await c.send(
      new PutCommand({ TableName: Tables.parents, Item: parent }),
    );
  } catch (err) {
    console.error("[POST family parents] failed:", err);
    return Response.json(
      { error: "Create failed", detail: String(err) },
      { status: 500 },
    );
  }

  await notifyAction({
    kind: "family.parent_added",
    summary: `Second parent added to family: ${
      (parent.firstName as string) || ""
    } ${(parent.lastName as string) || ""}`.trim(),
    details: {
      familyId,
      parentId: parent.id as string,
      email: (parent.email as string) || "—",
      phone: (parent.phone as string) || "—",
    },
  }).catch(() => {});

  return Response.json({ parent }, { status: 201 });
}
