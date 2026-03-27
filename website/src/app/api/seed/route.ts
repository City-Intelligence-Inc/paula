import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dynamodb, Tables } from "@/lib/dynamodb";
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import {
  sampleStudents,
  sampleSessions,
  samplePayments,
  sampleEvents,
  sampleResources,
} from "@/lib/seed-data";

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function batchWrite(
  tableName: string,
  items: Record<string, unknown>[]
) {
  // DynamoDB BatchWrite supports max 25 items per request
  const chunks = chunkArray(items, 25);

  for (const chunk of chunks) {
    await dynamodb.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: chunk.map((item) => ({
            PutRequest: { Item: item },
          })),
        },
      })
    );
  }
}

export async function POST(req: Request) {
  // Only allow in development or with a special header
  const isDev = process.env.NODE_ENV === "development";
  const hasHeader = req.headers.get("x-seed-secret") === "mathitude-seed-2026";

  if (!isDev && !hasHeader) {
    return NextResponse.json(
      { error: "Seeding is only allowed in development or with the correct seed header" },
      { status: 403 }
    );
  }

  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const results: Record<string, number> = {};

    // Seed students
    await batchWrite(Tables.students, sampleStudents as unknown as Record<string, unknown>[]);
    results.students = sampleStudents.length;

    // Seed sessions
    await batchWrite(Tables.sessions, sampleSessions as unknown as Record<string, unknown>[]);
    results.sessions = sampleSessions.length;

    // Seed payments
    await batchWrite(Tables.payments, samplePayments as unknown as Record<string, unknown>[]);
    results.payments = samplePayments.length;

    // Seed events
    await batchWrite(Tables.events, sampleEvents as unknown as Record<string, unknown>[]);
    results.events = sampleEvents.length;

    // Seed resources
    await batchWrite(Tables.resources, sampleResources as unknown as Record<string, unknown>[]);
    results.resources = sampleResources.length;

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      counts: results,
    });
  } catch (error) {
    console.error("Failed to seed database:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
