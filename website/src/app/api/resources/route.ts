import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dynamodb, Tables } from "@/lib/dynamodb";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import type { Resource } from "@/lib/types";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    if (category) {
      // Query by primary key (category)
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.resources,
          KeyConditionExpression: "category = :cat",
          ExpressionAttributeValues: { ":cat": category },
        })
      );
      return NextResponse.json({ resources: result.Items || [] });
    }

    // Full scan
    const result = await dynamodb.send(
      new ScanCommand({ TableName: Tables.resources })
    );
    return NextResponse.json({ resources: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
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

    const resource: Resource = {
      category: body.category,
      id: body.id || randomUUID(),
      title: body.title,
      description: body.description,
      linkText: body.linkText,
      href: body.href,
      tags: body.tags,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.resources,
        Item: resource,
      })
    );

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error("Failed to create resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
