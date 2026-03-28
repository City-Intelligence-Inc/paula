import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dynamodb, Tables } from "@/lib/dynamodb";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const result = await dynamodb.send(
      new QueryCommand({
        TableName: Tables.sessions,
        KeyConditionExpression: "studentId = :sid",
        FilterExpression: "#t = :note",
        ExpressionAttributeNames: { "#t": "type" },
        ExpressionAttributeValues: {
          ":sid": id,
          ":note": "note",
        },
      })
    );

    // Sort newest first
    const notes = (result.Items || []).sort(
      (a, b) => (b.dateTime as string).localeCompare(a.dateTime as string)
    );

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().slice(0, 5);

    const note = {
      studentId: id,
      dateTime: now.toISOString(),
      date,
      time,
      type: "note" as const,
      status: "completed" as const,
      duration: 0,
      content: body.content.trim(),
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.sessions,
        Item: note,
      })
    );

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Failed to create note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
