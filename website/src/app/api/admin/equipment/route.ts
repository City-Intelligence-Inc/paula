import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";

// Internal equipment / supply links (5/9 Paula — "capture my Amazon purchases
// and have links readily available for remote employees"). Admin-only,
// distinct from the public-facing resource library so internal procurement
// links never leak. Stored as a singleton row in the secrets table.
const KEY = "internal-equipment";

export interface EquipmentItem {
  id: string;
  title: string;
  url: string;
  category?: string;
  notes?: string;
  addedAt: string;
}

async function readItems(): Promise<EquipmentItem[]> {
  const r = await ddb().send(
    new GetCommand({ TableName: Tables.secrets, Key: { id: KEY } }),
  );
  const row = r.Item as { items?: EquipmentItem[] } | undefined;
  return row?.items || [];
}

async function writeItems(items: EquipmentItem[]): Promise<void> {
  await ddb().send(
    new PutCommand({
      TableName: Tables.secrets,
      Item: { id: KEY, items, updatedAt: new Date().toISOString() },
    }),
  );
}

export async function GET() {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Admin access required.");
  return Response.json({ items: await readItems() });
}

export async function POST(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Admin access required.");

  let body: {
    op?: "add" | "delete";
    id?: string;
    title?: string;
    url?: string;
    category?: string;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = await readItems();

  if (body.op === "delete") {
    if (!body.id) return Response.json({ error: "id required" }, { status: 400 });
    await writeItems(items.filter((i) => i.id !== body.id));
    return Response.json({ ok: true, items: await readItems() });
  }

  // default: add
  if (!body.title?.trim() || !body.url?.trim()) {
    return Response.json({ error: "title and url are required" }, { status: 400 });
  }
  const item: EquipmentItem = {
    id: `eqp_${Math.random().toString(36).slice(2, 9)}`,
    title: body.title.trim(),
    url: body.url.trim(),
    category: body.category?.trim() || undefined,
    notes: body.notes?.trim() || undefined,
    addedAt: new Date().toISOString(),
  };
  await writeItems([item, ...items]);
  return Response.json({ ok: true, item, items: await readItems() });
}
