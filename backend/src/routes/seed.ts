import { Router, Request, Response } from "express";
import { requireAuth } from "../lib/auth";
import { requireAdmin } from "../lib/roles";
import { dynamodb, Tables } from "../lib/dynamodb";
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import {
  sampleStudents,
  sampleSessions,
  samplePayments,
  sampleEvents,
  sampleResources,
} from "../lib/seed-data";

const router = Router();

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

// POST /api/seed (admin only)
router.post(
  "/",
  requireAuth(),
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    // Only allow in development or with a special header
    const isDev = process.env.NODE_ENV === "development";
    const hasHeader =
      req.headers["x-seed-secret"] === "mathitude-seed-2026";

    if (!isDev && !hasHeader) {
      res.status(403).json({
        error:
          "Seeding is only allowed in development or with the correct seed header",
      });
      return;
    }

    try {
      const results: Record<string, number> = {};

      // Seed students
      await batchWrite(
        Tables.students,
        sampleStudents as unknown as Record<string, unknown>[]
      );
      results.students = sampleStudents.length;

      // Seed sessions
      await batchWrite(
        Tables.sessions,
        sampleSessions as unknown as Record<string, unknown>[]
      );
      results.sessions = sampleSessions.length;

      // Seed payments
      await batchWrite(
        Tables.payments,
        samplePayments as unknown as Record<string, unknown>[]
      );
      results.payments = samplePayments.length;

      // Seed events
      await batchWrite(
        Tables.events,
        sampleEvents as unknown as Record<string, unknown>[]
      );
      results.events = sampleEvents.length;

      // Seed resources
      await batchWrite(
        Tables.resources,
        sampleResources as unknown as Record<string, unknown>[]
      );
      results.resources = sampleResources.length;

      res.json({
        success: true,
        message: "Database seeded successfully",
        counts: results,
      });
    } catch (error) {
      console.error("Failed to seed database:", error);
      res.status(500).json({ error: "Failed to seed database" });
    }
  }
);

export default router;
