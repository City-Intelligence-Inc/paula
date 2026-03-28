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

      // Seed content blocks
      const contentBlocks = [
        // Home page
        { pageId: "home", blockId: "hero-heading", content: "At Mathitude, it's all about the attitude.", type: "heading" },
        { pageId: "home", blockId: "hero-subtext", content: "K-12 math enrichment, tutoring, and engagement books that foster big mathematical thinking through fun, collaborative learning.", type: "text" },
        { pageId: "home", blockId: "cta-heading", content: "Ready to strengthen your student's math skills this fall?", type: "heading" },
        { pageId: "home", blockId: "about-heading", content: "Meet Paula Hamilton!", type: "heading" },
        { pageId: "home", blockId: "about-quote", content: "Paula's vision of lifetime math engagement for all is at the heart of everything we do.", type: "text" },

        // Math Engagement page
        { pageId: "math-engagement", blockId: "heading", content: "Math Engagement", type: "heading" },
        { pageId: "math-engagement", blockId: "books-heading", content: "Enrichment Books", type: "heading" },
        { pageId: "math-engagement", blockId: "books-description", content: "Paula's signature math engagement workbooks integrate deep math mastery with fun, collaborative problem-solving. Rather than drilling isolated skills, these workbooks combine exciting engagement with a spirit of collaboration.", type: "text" },
        { pageId: "math-engagement", blockId: "tutoring-heading", content: "Individual & Small Group Tutoring", type: "heading" },
        { pageId: "math-engagement", blockId: "tutoring-description", content: "Available in-person at our Menlo Park studio and virtually via Zoom. Solo sessions or small groups of 2-4 students. All ages from pre-K through college.", type: "text" },
        { pageId: "math-engagement", blockId: "puzzles-heading", content: "Puzzles & Activities", type: "heading" },
        { pageId: "math-engagement", blockId: "puzzles-description", content: "Downloadable swamp puzzles, Pascal's Triangle explorations, strategy videos, and hands-on activities that make math feel like a game.", type: "text" },

        // Tutoring page
        { pageId: "tutoring", blockId: "heading", content: "Private Math Tutoring in Menlo Park", type: "heading" },
        { pageId: "tutoring", blockId: "subtext", content: "Our goal is lifetime math engagement for all, and we love helping students develop their superpowers as mathematicians.", type: "text" },

        // Shop page
        { pageId: "shop", blockId: "heading", content: "Shop Books", type: "heading" },
        { pageId: "shop", blockId: "subtext", content: "Paula's signature math engagement workbooks and puzzle collections.", type: "text" },

        // Events page
        { pageId: "events", blockId: "heading", content: "Events & News", type: "heading" },

        // Contact page
        { pageId: "contact", blockId: "heading", content: "Get in Touch", type: "heading" },
        { pageId: "contact", blockId: "phone", content: "510.205.2633", type: "text" },
        { pageId: "contact", blockId: "email", content: "info@mathitude.com", type: "text" },
        { pageId: "contact", blockId: "location", content: "Menlo Park, CA — one block from Trader Joe's", type: "text" },
        { pageId: "contact", blockId: "hours", content: "Mon-Fri 9:00 AM - 7:00 PM, Sat 10:00 AM - 4:00 PM", type: "text" },
      ].map((block) => ({
        ...block,
        updatedAt: new Date().toISOString(),
        updatedBy: "seed",
      }));

      await batchWrite(
        Tables.content,
        contentBlocks as unknown as Record<string, unknown>[]
      );
      results.content = contentBlocks.length;

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
