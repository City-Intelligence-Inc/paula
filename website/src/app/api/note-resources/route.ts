import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import type { NoteResource } from "@/lib/types";

// N-5 resource shortcut library. Org-wide reusable links a tutor inserts into
// a note by typing `@` ("Straws 1", "Spacers for the Rhombi ball"). Stored in
// the existing `resources` table under the "tutor-shortcut" partition — no new
// table. Any tutor/staff may create; only Super Admin may delete (separate
// handler, kept out of MVP). Parents/students get no access.
const SHORTCUT_CATEGORY = "tutor-shortcut";

export async function GET() {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin && actor!.role !== "tutor") return forbidden();

  const result = await ddb().send(
    new QueryCommand({
      TableName: Tables.resources,
      KeyConditionExpression: "category = :c",
      ExpressionAttributeValues: { ":c": SHORTCUT_CATEGORY },
    }),
  );
  const resources = ((result.Items as NoteResource[]) || []).sort((a, b) =>
    a.shortcut.localeCompare(b.shortcut),
  );
  return Response.json({ resources });
}

interface CreateBody {
  shortcut?: string;
  label?: string;
  href?: string;
}

export async function POST(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin && actor!.role !== "tutor") return forbidden();

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const shortcut = body.shortcut?.trim();
  const href = body.href?.trim();
  if (!shortcut || !href) {
    return Response.json(
      { error: "shortcut and href are required" },
      { status: 400 },
    );
  }
  if (!/^https?:\/\//i.test(href)) {
    return Response.json({ error: "href must be http(s)" }, { status: 400 });
  }

  // Dedupe by shortcut name (case-insensitive) — a shared shortcut shouldn't
  // exist twice. Return the existing one instead of creating a duplicate.
  const existing = await ddb().send(
    new QueryCommand({
      TableName: Tables.resources,
      KeyConditionExpression: "category = :c",
      ExpressionAttributeValues: { ":c": SHORTCUT_CATEGORY },
    }),
  );
  const dup = ((existing.Items as NoteResource[]) || []).find(
    (r) => r.shortcut.toLowerCase() === shortcut.toLowerCase(),
  );
  if (dup) return Response.json({ resource: dup }, { status: 200 });

  const now = new Date().toISOString();
  const resource: NoteResource = {
    category: "tutor-shortcut",
    id: `res_${Date.now().toString(36)}`,
    shortcut,
    label: body.label?.trim() || shortcut,
    href,
    createdBy: actor!.userId,
    createdAt: now,
  };

  try {
    await ddb().send(
      new PutCommand({ TableName: Tables.resources, Item: resource }),
    );
    return Response.json({ resource }, { status: 201 });
  } catch (err) {
    console.error("[note-resources POST] failed:", err);
    return Response.json(
      { error: "Create failed", detail: String(err) },
      { status: 500 },
    );
  }
}
