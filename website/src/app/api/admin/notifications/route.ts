import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";

// GET /api/admin/notifications → recent admin notifications
//
// Today this surfaces "payment_method.updated" events written by
// /api/stripe/payment-methods/finalize-new-card. Designed so additional
// kinds (charge.failed, consultation.received, …) can land in the same
// inbox without schema changes.
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
    // Table may not be provisioned yet — return an empty list so the UI
    // doesn't surface a hard error. Vercel logs still capture the issue.
    console.warn("[GET /api/admin/notifications] scan failed:", err);
    return Response.json({ notifications: [] });
  }
}
