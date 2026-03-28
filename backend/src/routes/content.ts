import { Router, Request, Response } from "express";
import { requireAuth } from "../lib/auth";
import { dynamodb, Tables } from "../lib/dynamodb";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const router = Router();

// GET /api/content/:pageId — get all content blocks for a page (public, no auth)
router.get(
  "/:pageId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.content,
          KeyConditionExpression: "pageId = :pid",
          ExpressionAttributeValues: { ":pid": req.params.pageId },
        })
      );

      // Convert to a map of blockId -> content for easy consumption
      const blocks: Record<string, string> = {};
      for (const item of result.Items || []) {
        blocks[item.blockId] = item.content;
      }

      res.json({ pageId: req.params.pageId, blocks });
    } catch (error) {
      console.error("Failed to fetch content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  }
);

// GET /api/content — get all pages (for admin listing, auth required)
// NOTE: This must be registered AFTER /:pageId to avoid conflict,
// but Express matches literal routes before params, so we use a
// dedicated path prefix.

// PUT /api/content/:pageId/:blockId — update a content block (auth required)
router.put(
  "/:pageId/:blockId",
  requireAuth(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { content } = req.body;
      await dynamodb.send(
        new PutCommand({
          TableName: Tables.content,
          Item: {
            pageId: req.params.pageId,
            blockId: req.params.blockId,
            content,
            type: req.body.type || "text",
            updatedAt: new Date().toISOString(),
            updatedBy: (req as any).auth?.userId || "unknown",
          },
        })
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update content:", error);
      res.status(500).json({ error: "Failed to update content" });
    }
  }
);

// DELETE /api/content/:pageId/:blockId — delete a content block (auth required)
router.delete(
  "/:pageId/:blockId",
  requireAuth(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await dynamodb.send(
        new DeleteCommand({
          TableName: Tables.content,
          Key: {
            pageId: req.params.pageId,
            blockId: req.params.blockId,
          },
        })
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete content:", error);
      res.status(500).json({ error: "Failed to delete content" });
    }
  }
);

export default router;

// Separate router for the listing endpoint (mounted at /api/content-admin)
export const contentAdminRouter = Router();

contentAdminRouter.get(
  "/",
  requireAuth(),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await dynamodb.send(
        new ScanCommand({
          TableName: Tables.content,
        })
      );

      // Group by pageId
      const pages: Record<string, any[]> = {};
      for (const item of result.Items || []) {
        if (!pages[item.pageId]) pages[item.pageId] = [];
        pages[item.pageId].push(item);
      }

      res.json({ pages });
    } catch (error) {
      console.error("Failed to fetch all content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  }
);
