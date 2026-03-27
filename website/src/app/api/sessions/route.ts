import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dynamodb, Tables } from "@/lib/dynamodb";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { Session } from "@/lib/types";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (date) {
      // Use the by-date GSI
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.sessions,
          IndexName: "by-date",
          KeyConditionExpression: "#d = :date",
          ExpressionAttributeNames: { "#d": "date" },
          ExpressionAttributeValues: { ":date": date },
        })
      );
      return NextResponse.json({ sessions: result.Items || [] });
    }

    // Full scan if no filter
    const result = await dynamodb.send(
      new ScanCommand({ TableName: Tables.sessions })
    );
    return NextResponse.json({ sessions: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const session: Session = {
      studentId: body.studentId,
      dateTime: body.dateTime,
      date: body.date,
      time: body.time,
      duration: body.duration,
      type: body.type || "individual",
      status: body.status || "scheduled",
      notes: body.notes,
      students: body.students,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.sessions,
        Item: session,
      })
    );

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
