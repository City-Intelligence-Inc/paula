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
import type { Parent } from "../lib/types";

const router = Router();

router.use(requireAuth());

// GET /api/parents — list / lookup-by-email / lookup-by-stripe
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.query.email as string | undefined;
    const stripeCustomerId = req.query.stripeCustomerId as string | undefined;

    if (email) {
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.parents,
          IndexName: "by-email",
          KeyConditionExpression: "email = :e",
          ExpressionAttributeValues: { ":e": email },
        })
      );
      res.json({ parents: result.Items || [] });
      return;
    }

    if (stripeCustomerId) {
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.parents,
          IndexName: "by-stripe-customer",
          KeyConditionExpression: "stripeCustomerId = :s",
          ExpressionAttributeValues: { ":s": stripeCustomerId },
        })
      );
      res.json({ parents: result.Items || [] });
      return;
    }

    const result = await dynamodb.send(
      new ScanCommand({ TableName: Tables.parents })
    );
    res.json({ parents: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch parents:", error);
    res.status(500).json({ error: "Failed to fetch parents" });
  }
});

// POST /api/parents — create (admin)
router.post("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    if (!body.familyId || !body.email) {
      res.status(400).json({ error: "familyId and email are required" });
      return;
    }
    const now = new Date().toISOString();
    const parent: Parent = {
      id: `par_${randomUUID()}`,
      familyId: body.familyId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      stripeCustomerId: body.stripeCustomerId,
      clerkUserId: body.clerkUserId,
      createdAt: now,
      updatedAt: now,
    };

    await dynamodb.send(
      new PutCommand({ TableName: Tables.parents, Item: parent })
    );
    res.status(201).json({ parent });
  } catch (error) {
    console.error("Failed to create parent:", error);
    res.status(500).json({ error: "Failed to create parent" });
  }
});

// GET /api/parents/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await dynamodb.send(
      new GetCommand({ TableName: Tables.parents, Key: { id } })
    );
    if (!result.Item) {
      res.status(404).json({ error: "Parent not found" });
      return;
    }
    res.json({ parent: result.Item });
  } catch (error) {
    console.error("Failed to fetch parent:", error);
    res.status(500).json({ error: "Failed to fetch parent" });
  }
});

// PUT /api/parents/:id (admin)
router.put("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;
    const parent: Parent = {
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    await dynamodb.send(
      new PutCommand({ TableName: Tables.parents, Item: parent })
    );
    res.json({ parent });
  } catch (error) {
    console.error("Failed to update parent:", error);
    res.status(500).json({ error: "Failed to update parent" });
  }
});

// DELETE /api/parents/:id (admin)
router.delete("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await dynamodb.send(
      new DeleteCommand({ TableName: Tables.parents, Key: { id } })
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete parent:", error);
    res.status(500).json({ error: "Failed to delete parent" });
  }
});

export default router;
