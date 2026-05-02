import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

interface ContentBlock {
  pageId: string;
  blockId: string;
  content?: string;
  type?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const result = await ddb().send(new ScanCommand({ TableName: Tables.content }));
  const items = (result.Items || []) as ContentBlock[];

  // Group by pageId
  const pages: Record<string, ContentBlock[]> = {};
  for (const item of items) {
    const pid = item.pageId;
    if (!pages[pid]) pages[pid] = [];
    pages[pid].push(item);
  }
  return Response.json({ pages });
}
