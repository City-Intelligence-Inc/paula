import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

export async function GET() {
  console.log("[GET /api/families] start, table:", Tables.families);
  const auth = await requireUser();
  if (auth.response) {
    console.log("[GET /api/families] auth gate returned response, userId:", auth.userId);
    return auth.response;
  }

  try {
    const result = await ddb().send(new ScanCommand({ TableName: Tables.families }));
    console.log("[GET /api/families] scan ok, count:", result.Items?.length);
    return Response.json({ families: result.Items || [] });
  } catch (err) {
    console.error("[GET /api/families] scan failed:", err);
    return Response.json(
      { error: "Scan failed", detail: String(err), table: Tables.families },
      { status: 500 },
    );
  }
}
