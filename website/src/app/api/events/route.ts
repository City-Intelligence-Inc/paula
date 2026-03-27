import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dynamodb, Tables } from "@/lib/dynamodb";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import type { MathitudeEvent } from "@/lib/types";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type) {
      // Use the by-type GSI
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.events,
          IndexName: "by-type",
          KeyConditionExpression: "#t = :type",
          ExpressionAttributeNames: { "#t": "type" },
          ExpressionAttributeValues: { ":type": type },
        })
      );
      return NextResponse.json({ events: result.Items || [] });
    }

    // Full scan
    const result = await dynamodb.send(
      new ScanCommand({ TableName: Tables.events })
    );
    return NextResponse.json({ events: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
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

    const event: MathitudeEvent = {
      id: body.id || randomUUID(),
      date: body.date,
      title: body.title,
      time: body.time,
      location: body.location,
      description: body.description,
      type: body.type,
      featured: body.featured ?? false,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.events,
        Item: event,
      })
    );

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
