import { Router, Request, Response } from "express";
import { requireAuth } from "../lib/auth";
import { requireAdmin } from "../lib/roles";
import { dynamodb, Tables } from "../lib/dynamodb";
import {
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import type { Tutor } from "../lib/types";

const router = Router();

router.use(requireAuth());

// GET /api/tutors — list / lookup-by-clerk
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.query.clerkUserId as string | undefined;

    if (clerkUserId) {
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.tutors,
          IndexName: "by-clerk-user",
          KeyConditionExpression: "clerkUserId = :c",
          ExpressionAttributeValues: { ":c": clerkUserId },
        })
      );
      res.json({ tutors: result.Items || [] });
      return;
    }

    const result = await dynamodb.send(
      new ScanCommand({ TableName: Tables.tutors })
    );
    res.json({ tutors: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch tutors:", error);
    res.status(500).json({ error: "Failed to fetch tutors" });
  }
});

// POST /api/tutors — create (admin)
router.post("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const now = new Date().toISOString();
    const tutor: Tutor = {
      id: body.id || `tut_${randomUUID()}`,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      clerkUserId: body.clerkUserId,
      assignedStudentIds: body.assignedStudentIds || [],
      active: body.active !== false,
      createdAt: now,
      updatedAt: now,
    };

    await dynamodb.send(
      new PutCommand({ TableName: Tables.tutors, Item: tutor })
    );
    res.status(201).json({ tutor });
  } catch (error) {
    console.error("Failed to create tutor:", error);
    res.status(500).json({ error: "Failed to create tutor" });
  }
});

// GET /api/tutors/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await dynamodb.send(
      new GetCommand({ TableName: Tables.tutors, Key: { id } })
    );
    if (!result.Item) {
      res.status(404).json({ error: "Tutor not found" });
      return;
    }
    res.json({ tutor: result.Item });
  } catch (error) {
    console.error("Failed to fetch tutor:", error);
    res.status(500).json({ error: "Failed to fetch tutor" });
  }
});

// GET /api/tutors/:id/sessions — sessions for a tutor in date range
router.get("/:id/sessions", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const from = (req.query.from as string | undefined) || "0000";
    const to = (req.query.to as string | undefined) || "9999";

    const result = await dynamodb.send(
      new QueryCommand({
        TableName: Tables.sessions,
        IndexName: "by-tutor-date",
        KeyConditionExpression: "tutorId = :t AND dateTime BETWEEN :from AND :to",
        ExpressionAttributeValues: {
          ":t": id,
          ":from": from,
          ":to": to,
        },
      })
    );
    res.json({ sessions: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch tutor sessions:", error);
    res.status(500).json({ error: "Failed to fetch tutor sessions" });
  }
});

// PUT /api/tutors/:id (admin)
router.put("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;
    const tutor: Tutor = {
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    await dynamodb.send(
      new PutCommand({ TableName: Tables.tutors, Item: tutor })
    );
    res.json({ tutor });
  } catch (error) {
    console.error("Failed to update tutor:", error);
    res.status(500).json({ error: "Failed to update tutor" });
  }
});

// DELETE /api/tutors/:id (admin)
router.delete("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await dynamodb.send(
      new DeleteCommand({ TableName: Tables.tutors, Key: { id } })
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tutor:", error);
    res.status(500).json({ error: "Failed to delete tutor" });
  }
});

export default router;
