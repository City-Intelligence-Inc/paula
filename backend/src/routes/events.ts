import { Router, Request, Response } from "express";
import { requireAuth } from "../lib/auth";
import { dynamodb, Tables } from "../lib/dynamodb";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import type { MathitudeEvent } from "../lib/types";

const router = Router();

// All routes require authentication
router.use(requireAuth());

// GET /api/events — list (with ?type= filter)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const type = req.query.type as string | undefined;

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
      res.json({ events: result.Items || [] });
      return;
    }

    // Full scan
    const result = await dynamodb.send(
      new ScanCommand({ TableName: Tables.events })
    );
    res.json({ events: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// POST /api/events — create
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;

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

    res.status(201).json({ event });
  } catch (error) {
    console.error("Failed to create event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

export default router;
