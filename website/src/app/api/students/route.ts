import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dynamodb, Tables } from "@/lib/dynamodb";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import type { Student } from "@/lib/types";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    const params: ScanCommandInput = {
      TableName: Tables.students,
    };

    if (query) {
      params.FilterExpression =
        "contains(firstName, :q) OR contains(lastName, :q) OR contains(parentName, :q) OR contains(grade, :q)";
      params.ExpressionAttributeValues = { ":q": query };
    }

    const result = await dynamodb.send(new ScanCommand(params));
    return NextResponse.json({ students: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
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
    const now = new Date().toISOString();

    const student: Student = {
      id: randomUUID(),
      firstName: body.firstName,
      lastName: body.lastName,
      grade: body.grade,
      status: body.status || "active",
      parentName: body.parentName,
      parentEmail: body.parentEmail,
      parentPhone: body.parentPhone,
      sessionType: body.sessionType || "individual",
      rate: body.rate,
      notes: body.notes,
      stripeCustomerId: body.stripeCustomerId,
      createdAt: now,
      updatedAt: now,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.students,
        Item: student,
      })
    );

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error("Failed to create student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
