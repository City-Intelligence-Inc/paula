import {
  ScanCommand,
  UpdateCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";

// GET /api/admin/notifications → list newest 100
// POST /api/admin/notifications  { id, read } → mark a single row
// PUT  /api/admin/notifications  { all: true } → mark every row read
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const r = await ddb().send(
      new ScanCommand({ TableName: Tables.notifications, Limit: 200 }),
    );
    const items = ((r.Items as Record<string, unknown>[]) || [])
      .slice()
      .sort((a, b) => {
        const at = new Date((a.createdAt as string) || 0).getTime();
        const bt = new Date((b.createdAt as string) || 0).getTime();
        return bt - at;
      })
      .slice(0, 100);
    return Response.json({ notifications: items });
  } catch (err) {
    console.warn("[GET /api/admin/notifications] scan failed:", err);
    return Response.json({ notifications: [] });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  let body: { id?: string; read?: boolean };
  try {
    body = (await request.json()) as { id?: string; read?: boolean };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id) {
    return Response.json({ error: "id required" }, { status: 400 });
  }
  try {
    await ddb().send(
      new UpdateCommand({
        TableName: Tables.notifications,
        Key: { id: body.id },
        UpdateExpression: "SET #r = :v",
        ExpressionAttributeNames: { "#r": "read" },
        ExpressionAttributeValues: { ":v": body.read !== false },
      }),
    );
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: "Update failed", detail: String(err) },
      { status: 500 },
    );
  }
}

// PUT to mark everything read. Bounded scan + BatchWrite — fine at our
// volume; if the inbox grows past 25 rows per write we'd batch into 25s.
export async function PUT() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  try {
    const r = await ddb().send(
      new ScanCommand({ TableName: Tables.notifications, Limit: 500 }),
    );
    const unread = ((r.Items as Record<string, unknown>[]) || []).filter(
      (n) => n.read !== true,
    );
    if (unread.length === 0) return Response.json({ ok: true, marked: 0 });

    // BatchWrite supports up to 25 items per call; chunk it.
    const chunks: typeof unread[] = [];
    for (let i = 0; i < unread.length; i += 25) {
      chunks.push(unread.slice(i, i + 25));
    }
    let marked = 0;
    for (const chunk of chunks) {
      // BatchWrite doesn't support partial updates — re-put the whole row
      // with read=true. We have the full Item from the scan.
      await ddb().send(
        new BatchWriteCommand({
          RequestItems: {
            [Tables.notifications]: chunk.map((item) => ({
              PutRequest: { Item: { ...item, read: true } },
            })),
          },
        }),
      );
      marked += chunk.length;
    }
    return Response.json({ ok: true, marked });
  } catch (err) {
    return Response.json(
      { error: "Bulk update failed", detail: String(err) },
      { status: 500 },
    );
  }
}
