import { Router, Request, Response } from "express";
import { requireAuth } from "../lib/auth";
import { dynamodb, Tables } from "../lib/dynamodb";
import {
  ScanCommand,
  PutCommand,
  DeleteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const router = Router();

// POST /api/newsletter/subscribe — public, no auth required
router.post("/subscribe", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "A valid email is required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if already subscribed
    const existing = await dynamodb.send(
      new GetCommand({
        TableName: Tables.subscribers,
        Key: { email: normalizedEmail },
      })
    );

    if (existing.Item) {
      res.json({ message: "Already subscribed" });
      return;
    }

    const now = new Date().toISOString();

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.subscribers,
        Item: {
          email: normalizedEmail,
          subscribedAt: now,
        },
      })
    );

    res.status(201).json({ message: "Subscribed successfully" });
  } catch (error) {
    console.error("Failed to subscribe:", error);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// GET /api/newsletter/subscribers — admin only
router.get("/subscribers", requireAuth(), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: Tables.subscribers,
      })
    );

    const subscribers = (result.Items || []).sort(
      (a, b) => (b.subscribedAt as string).localeCompare(a.subscribedAt as string)
    );

    res.json({ subscribers, count: subscribers.length });
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
});

// DELETE /api/newsletter/subscribers/:email — unsubscribe
router.delete("/subscribers/:email", requireAuth(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail } = req.params;
    const email = decodeURIComponent(rawEmail as string).toLowerCase();

    await dynamodb.send(
      new DeleteCommand({
        TableName: Tables.subscribers,
        Key: { email },
      })
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to unsubscribe:", error);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

export default router;
