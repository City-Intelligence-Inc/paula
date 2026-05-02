import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await params;
  const result = await ddb().send(
    new QueryCommand({
      TableName: Tables.sessions,
      KeyConditionExpression: "studentId = :sid",
      FilterExpression: "#t = :note",
      ExpressionAttributeNames: { "#t": "type" },
      ExpressionAttributeValues: { ":sid": id, ":note": "note" },
    }),
  );
  const notes = (result.Items || []).sort((a, b) =>
    (b.dateTime as string).localeCompare(a.dateTime as string),
  );
  return Response.json({ notes });
}

interface NoteBody {
  content?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await params;
  let body: NoteBody;
  try {
    body = (await request.json()) as NoteBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.content || !body.content.trim()) {
    return Response.json({ error: "content required" }, { status: 400 });
  }

  const now = new Date();
  const dateTime = now.toISOString();
  const note = {
    studentId: id,
    dateTime,
    date: dateTime.slice(0, 10),
    time: dateTime.slice(11, 16),
    type: "note" as const,
    content: body.content.trim(),
    createdBy: auth.userId,
    createdAt: dateTime,
  };

  try {
    await ddb().send(
      new PutCommand({ TableName: Tables.sessions, Item: note }),
    );
    return Response.json({ note }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/students/[id]/notes] failed:", err);
    return Response.json(
      { error: "Create failed", detail: String(err) },
      { status: 500 },
    );
  }
}
