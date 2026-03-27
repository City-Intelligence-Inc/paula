import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dynamodb, Tables } from "@/lib/dynamodb";
import {
  ScanCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Payment } from "@/lib/types";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");

    if (studentId) {
      // Query by primary key (studentId)
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.payments,
          KeyConditionExpression: "studentId = :sid",
          ExpressionAttributeValues: { ":sid": studentId },
          ScanIndexForward: false, // newest first
        })
      );
      return NextResponse.json({ payments: result.Items || [] });
    }

    if (status) {
      // Use the by-status GSI
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.payments,
          IndexName: "by-status",
          KeyConditionExpression: "paymentStatus = :status",
          ExpressionAttributeValues: { ":status": status },
        })
      );
      return NextResponse.json({ payments: result.Items || [] });
    }

    // Full scan if no filter
    const result = await dynamodb.send(
      new ScanCommand({ TableName: Tables.payments })
    );
    return NextResponse.json({ payments: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
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

    const payment: Payment = {
      studentId: body.studentId,
      createdAt: body.createdAt || now,
      amount: body.amount,
      paymentStatus: body.paymentStatus || "pending",
      description: body.description,
      stripePaymentIntentId: body.stripePaymentIntentId,
      stripeChargeId: body.stripeChargeId,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.payments,
        Item: payment,
      })
    );

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
