import { Router, Request, Response } from "express";
import { requireAuth } from "../lib/auth";
import { dynamodb, Tables } from "../lib/dynamodb";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { Session } from "../lib/types";

const router = Router();

// All routes require authentication
router.use(requireAuth());

// GET /api/sessions — list (with ?date= filter)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const date = req.query.date as string | undefined;

    if (date) {
      // Use the by-date GSI
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.sessions,
          IndexName: "by-date",
          KeyConditionExpression: "#d = :date",
          ExpressionAttributeNames: { "#d": "date" },
          ExpressionAttributeValues: { ":date": date },
        })
      );
      res.json({ sessions: result.Items || [] });
      return;
    }

    // Full scan if no filter
    const result = await dynamodb.send(
      new ScanCommand({ TableName: Tables.sessions })
    );
    res.json({ sessions: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// POST /api/sessions — create
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;

    const session: Session = {
      studentId: body.studentId,
      dateTime: body.dateTime,
      date: body.date,
      time: body.time,
      duration: body.duration,
      type: body.type || "individual",
      status: body.status || "scheduled",
      notes: body.notes,
      students: body.students,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.sessions,
        Item: session,
      })
    );

    res.status(201).json({ session });
  } catch (error) {
    console.error("Failed to create session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

export default router;
