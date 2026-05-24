import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";
import { notifyAction } from "@/lib/server/notify";

const RELATIONSHIPS = [
  "parent",
  "stepparent",
  "grandparent",
  "aunt",
  "uncle",
  "nanny",
  "guardian",
  "other",
] as const;
type Relationship = (typeof RELATIONSHIPS)[number];

// "parent" and "stepparent" are protected — they can't be removed via the
// UI. Other caregivers (nanny, aunt, etc.) can be removed.
const PROTECTED_RELATIONSHIPS = new Set<Relationship>(["parent", "stepparent"]);

interface AddParentBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  relationship?: Relationship;
}

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

// GET /api/families/[id]/parents → list all caregivers on a family
// (parents + other guardians). Each row carries a relationship tag.
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

// POST /api/families/[id]/parents → add a parent or other caregiver to a
// family. Mom, dad, nanny, aunt all share the family's primary card on
// file (single primaryPayerId on the Family). Relationship is recorded so
// the family page can render context + protect biological parents from
// removal.
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

  const relationship: Relationship =
    body.relationship && RELATIONSHIPS.includes(body.relationship)
      ? body.relationship
      : "parent";

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
    relationship,
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
    summary: `Caregiver added to family (${relationship}): ${
      (parent.firstName as string) || ""
    } ${(parent.lastName as string) || ""}`.trim(),
    details: {
      familyId,
      parentId: parent.id as string,
      relationship,
      email: (parent.email as string) || "—",
      phone: (parent.phone as string) || "—",
    },
  }).catch(() => {});

  return Response.json({ parent }, { status: 201 });
}

// DELETE /api/families/[id]/parents?parentId=...
// Removes a caregiver. Refuses if relationship is "parent" or "stepparent"
// (per the 5/17 spec: can add a parent but can't remove one). Refuses if
// the parent is the family's primary payer — assign a new primary payer
// first. Other caregivers (nanny, aunt, uncle, grandparent, guardian,
// other) can be removed freely.
export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id: familyId } = await ctx.params;

  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");
  if (!parentId) {
    return Response.json(
      { error: "parentId query param required" },
      { status: 400 },
    );
  }

  const c = ddb();
  const r = await c.send(
    new GetCommand({ TableName: Tables.parents, Key: { id: parentId } }),
  );
  const existing = r.Item as Record<string, unknown> | undefined;
  if (!existing) {
    return Response.json({ error: "Parent not found" }, { status: 404 });
  }
  if (existing.familyId !== familyId) {
    return Response.json(
      { error: "Parent doesn't belong to this family" },
      { status: 400 },
    );
  }

  const relationship = (existing.relationship as Relationship) || "parent";
  if (PROTECTED_RELATIONSHIPS.has(relationship)) {
    return Response.json(
      {
        error:
          "A biological parent or stepparent cannot be removed from the UI. Update the relationship type first if this caregiver is actually a different role.",
        code: "protected_relationship",
      },
      { status: 400 },
    );
  }

  const fam = await c.send(
    new GetCommand({ TableName: Tables.families, Key: { id: familyId } }),
  );
  if (fam.Item?.primaryPayerId === parentId) {
    return Response.json(
      {
        error:
          "This caregiver is the family's primary payer. Assign a new primary payer first.",
        code: "primary_payer",
      },
      { status: 400 },
    );
  }

  await c.send(
    new DeleteCommand({
      TableName: Tables.parents,
      Key: { id: parentId },
    }),
  );

  await notifyAction({
    kind: "family.parent_removed",
    summary: `Caregiver removed (${relationship}): ${
      (existing.firstName as string) || ""
    } ${(existing.lastName as string) || ""}`.trim(),
    details: { familyId, parentId, relationship },
  }).catch(() => {});

  return Response.json({ ok: true, parentId });
}
