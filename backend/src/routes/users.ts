import { Router, Request, Response } from "express";
import { requireAuth } from "../lib/auth";
import { requireAdmin } from "../lib/roles";
import { dynamodb, Tables } from "../lib/dynamodb";
import {
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { getAuth } from "@clerk/express";
import type { User } from "../lib/types";

const router = Router();

router.use(requireAuth());

// GET /api/users/me — resolve current Clerk user → role + linked entity
router.get("/me", async (req: Request, res: Response): Promise<void> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await dynamodb.send(
      new GetCommand({
        TableName: Tables.users,
        Key: { clerkUserId: auth.userId },
      })
    );

    if (!result.Item) {
      res.json({
        user: {
          clerkUserId: auth.userId,
          role: "parent",
          linkedEntityId: null,
          createdAt: null,
          provisional: true,
        },
      });
      return;
    }

    res.json({ user: result.Item });
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    res.status(500).json({ error: "Failed to fetch current user" });
  }
});

// GET /api/users — list (admin)
router.get("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.query.role as string | undefined;
    if (!role) {
      res.status(400).json({ error: "role query param is required" });
      return;
    }
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: Tables.users,
        IndexName: "by-role",
        KeyConditionExpression: "#r = :r",
        ExpressionAttributeNames: { "#r": "role" },
        ExpressionAttributeValues: { ":r": role },
      })
    );
    res.json({ users: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PUT /api/users/:clerkUserId (admin) — assign role + linked entity
router.put("/:clerkUserId", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const clerkUserId = String(req.params.clerkUserId);
    const body = req.body;

    const validRoles = ["admin", "tutor", "parent"] as const;
    type Role = (typeof validRoles)[number];
    if (!validRoles.includes(body.role)) {
      res.status(400).json({ error: "role must be admin | tutor | parent" });
      return;
    }

    const user: User = {
      clerkUserId,
      role: body.role as Role,
      linkedEntityId: body.linkedEntityId,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    await dynamodb.send(
      new PutCommand({ TableName: Tables.users, Item: user })
    );

    res.json({ user });
  } catch (error) {
    console.error("Failed to upsert user:", error);
    res.status(500).json({ error: "Failed to upsert user" });
  }
});

// DELETE /api/users/:clerkUserId (admin)
router.delete("/:clerkUserId", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { clerkUserId } = req.params;
    await dynamodb.send(
      new DeleteCommand({ TableName: Tables.users, Key: { clerkUserId } })
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
