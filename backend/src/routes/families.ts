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
import type { Family } from "../lib/types";

const router = Router();

router.use(requireAuth());

// GET /api/families — list
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await dynamodb.send(
      new ScanCommand({ TableName: Tables.families })
    );
    res.json({ families: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch families:", error);
    res.status(500).json({ error: "Failed to fetch families" });
  }
});

// POST /api/families — create (admin)
router.post("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const now = new Date().toISOString();
    const family: Family = {
      id: `fam_${randomUUID()}`,
      primaryPayerId: body.primaryPayerId,
      address: body.address,
      notes: body.notes,
      createdAt: now,
      updatedAt: now,
    };

    await dynamodb.send(
      new PutCommand({ TableName: Tables.families, Item: family })
    );
    res.status(201).json({ family });
  } catch (error) {
    console.error("Failed to create family:", error);
    res.status(500).json({ error: "Failed to create family" });
  }
});

// GET /api/families/:id — single (with parents + students hydrated)
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [familyRes, parentsRes, studentsRes] = await Promise.all([
      dynamodb.send(new GetCommand({ TableName: Tables.families, Key: { id } })),
      dynamodb.send(
        new QueryCommand({
          TableName: Tables.parents,
          IndexName: "by-family",
          KeyConditionExpression: "familyId = :fid",
          ExpressionAttributeValues: { ":fid": id },
        })
      ),
      dynamodb.send(
        new QueryCommand({
          TableName: Tables.students,
          IndexName: "by-family",
          KeyConditionExpression: "familyId = :fid",
          ExpressionAttributeValues: { ":fid": id },
        })
      ),
    ]);

    if (!familyRes.Item) {
      res.status(404).json({ error: "Family not found" });
      return;
    }

    res.json({
      family: familyRes.Item,
      parents: parentsRes.Items || [],
      students: studentsRes.Items || [],
    });
  } catch (error) {
    console.error("Failed to fetch family:", error);
    res.status(500).json({ error: "Failed to fetch family" });
  }
});

// PUT /api/families/:id — update (admin)
router.put("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;
    const family: Family = {
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await dynamodb.send(
      new PutCommand({ TableName: Tables.families, Item: family })
    );
    res.json({ family });
  } catch (error) {
    console.error("Failed to update family:", error);
    res.status(500).json({ error: "Failed to update family" });
  }
});

// DELETE /api/families/:id (admin)
router.delete("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await dynamodb.send(
      new DeleteCommand({ TableName: Tables.families, Key: { id } })
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete family:", error);
    res.status(500).json({ error: "Failed to delete family" });
  }
});

export default router;
