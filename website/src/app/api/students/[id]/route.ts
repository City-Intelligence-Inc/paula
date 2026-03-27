import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dynamodb, Tables } from "@/lib/dynamodb";
import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { Student } from "@/lib/types";

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
      new GetCommand({
        TableName: Tables.students,
        Key: { id },
      })
    );

    if (!result.Item) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ student: result.Item });
  } catch (error) {
    console.error("Failed to fetch student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    const student: Student = {
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.students,
        Item: student,
      })
    );

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Failed to update student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await dynamodb.send(
      new DeleteCommand({
        TableName: Tables.students,
        Key: { id },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete student:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
