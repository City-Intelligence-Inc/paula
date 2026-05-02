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
import type { ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import type { Student } from "../lib/types";

const router = Router();

// All routes require authentication
router.use(requireAuth());

// GET /api/students — list/search
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string | undefined;

    const params: ScanCommandInput = {
      TableName: Tables.students,
    };

    if (query) {
      params.FilterExpression =
        "contains(firstName, :q) OR contains(lastName, :q) OR contains(parentName, :q) OR contains(grade, :q)";
      params.ExpressionAttributeValues = { ":q": query };
    }

    const result = await dynamodb.send(new ScanCommand(params));
    res.json({ students: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// POST /api/students — create (admin only)
router.post("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
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

    res.status(201).json({ student });
  } catch (error) {
    console.error("Failed to create student:", error);
    res.status(500).json({ error: "Failed to create student" });
  }
});

// GET /api/students/:id — single
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await dynamodb.send(
      new GetCommand({
        TableName: Tables.students,
        Key: { id },
      })
    );

    if (!result.Item) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.json({ student: result.Item });
  } catch (error) {
    console.error("Failed to fetch student:", error);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

// PUT /api/students/:id — update (admin only)
router.put("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

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

    res.json({ student });
  } catch (error) {
    console.error("Failed to update student:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
});

// DELETE /api/students/:id — delete (admin only)
router.delete("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await dynamodb.send(
      new DeleteCommand({
        TableName: Tables.students,
        Key: { id },
      })
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete student:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

// GET /api/students/:id/sessions — full session history (newest first)
router.get("/:id/sessions", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await dynamodb.send(
      new QueryCommand({
        TableName: Tables.sessions,
        KeyConditionExpression: "studentId = :sid",
        ExpressionAttributeValues: { ":sid": id },
        ScanIndexForward: false, // newest first by dateTime SK
      })
    );

    res.json({ sessions: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch student sessions:", error);
    res.status(500).json({ error: "Failed to fetch student sessions" });
  }
});

// GET /api/students/:id/notes — list notes
router.get("/:id/notes", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await dynamodb.send(
      new QueryCommand({
        TableName: Tables.sessions,
        KeyConditionExpression: "studentId = :sid",
        FilterExpression: "#t = :note",
        ExpressionAttributeNames: { "#t": "type" },
        ExpressionAttributeValues: {
          ":sid": id,
          ":note": "note",
        },
      })
    );

    // Sort newest first
    const notes = (result.Items || []).sort(
      (a, b) => (b.dateTime as string).localeCompare(a.dateTime as string)
    );

    res.json({ notes });
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// POST /api/students/:id/notes — create note
router.post("/:id/notes", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!body.content || !body.content.trim()) {
      res.status(400).json({ error: "Content is required" });
      return;
    }

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().slice(0, 5);

    const note = {
      studentId: id,
      dateTime: now.toISOString(),
      date,
      time,
      type: "note" as const,
      status: "completed" as const,
      duration: 0,
      content: body.content.trim(),
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.sessions,
        Item: note,
      })
    );

    res.status(201).json({ note });
  } catch (error) {
    console.error("Failed to create note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

export default router;
