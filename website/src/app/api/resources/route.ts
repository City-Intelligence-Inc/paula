import { DeleteCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

interface ResourceBody {
  title?: string;
  description?: string;
  url?: string;
  category?: string;
  gradeMin?: string;
  gradeMax?: string;
  tags?: string[];
}

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

// GET /api/resources → every resource on file. Used by admin + tutor pages.
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const result = await ddb().send(
    new ScanCommand({ TableName: Tables.resources }),
  );
  const items = ((result.Items as Record<string, unknown>[]) || [])
    .slice()
    .sort((a, b) => {
      const at = `${a.category || ""} ${a.title || ""}`.toLowerCase();
      const bt = `${b.category || ""} ${b.title || ""}`.toLowerCase();
      return at.localeCompare(bt);
    });
  return Response.json({ resources: items });
}

// POST /api/resources → create. Body: { title, description, url, category, gradeMin?, gradeMax?, tags? }
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  let body: ResourceBody;
  try {
    body = (await request.json()) as ResourceBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.title?.trim()) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const slug = slugify(body.title);
  const suffix = Math.random().toString(36).slice(2, 6);
  const item: Record<string, unknown> = {
    id: `res_${slug || "item"}_${suffix}`,
    category: body.category || "tools",
    title: body.title.trim(),
    description: body.description?.trim() || "",
    createdAt: now,
    updatedAt: now,
  };
  if (body.url?.trim()) item.url = body.url.trim();
  if (body.gradeMin?.trim()) item.gradeMin = body.gradeMin.trim();
  if (body.gradeMax?.trim()) item.gradeMax = body.gradeMax.trim();
  if (Array.isArray(body.tags) && body.tags.length > 0) item.tags = body.tags;

  try {
    await ddb().send(
      new PutCommand({ TableName: Tables.resources, Item: item }),
    );
    return Response.json({ resource: item }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/resources] failed:", err);
    return Response.json(
      { error: "Create failed", detail: String(err) },
      { status: 500 },
    );
  }
}

// DELETE /api/resources?id=res_... → remove one resource.
// The resources table may have been provisioned with composite (category, id)
// in production; we look the item up first and delete with whatever key
// shape it actually has so the route works against either schema.
export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) {
    return Response.json({ error: "id query param required" }, { status: 400 });
  }
  try {
    const r = await ddb().send(
      new ScanCommand({
        TableName: Tables.resources,
        FilterExpression: "id = :i",
        ExpressionAttributeValues: { ":i": id },
        Limit: 1,
      }),
    );
    const item = (r.Items || [])[0] as Record<string, unknown> | undefined;
    if (!item) {
      return Response.json({ error: "Resource not found" }, { status: 404 });
    }
    const key: Record<string, unknown> = { id: item.id };
    if (item.category) key.category = item.category;
    await ddb().send(
      new DeleteCommand({ TableName: Tables.resources, Key: key }),
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/resources] failed:", err);
    return Response.json(
      { error: "Delete failed", detail: String(err) },
      { status: 500 },
    );
  }
}
