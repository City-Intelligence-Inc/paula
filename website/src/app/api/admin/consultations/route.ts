import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";

// GET /api/admin/consultations
// Lists every consultation submission persisted by /api/consultations into
// the bookings table. Per Paula's 5/17 question ("how would I access all
// of the data that will be captured in the form?"), this is the operator
// surface — a CSV export will be added next sprint if she wants offline use.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const result = await ddb().send(
      new ScanCommand({
        TableName: Tables.bookings,
        FilterExpression: "#t = :t",
        ExpressionAttributeNames: { "#t": "type" },
        ExpressionAttributeValues: { ":t": "consultation" },
        Limit: 1000,
      }),
    );
    const items = result.Items || [];
    items.sort(
      (a, b) =>
        new Date((b.createdAt as string) || 0).getTime() -
        new Date((a.createdAt as string) || 0).getTime(),
    );
    return Response.json({ consultations: items });
  } catch (err) {
    console.error("[GET /api/admin/consultations] failed:", err);
    return Response.json(
      { error: "Scan failed", detail: String(err) },
      { status: 500 },
    );
  }
}
