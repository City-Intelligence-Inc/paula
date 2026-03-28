import { Router, Request, Response } from "express";
import { requireAuth } from "../lib/auth";
import { dynamodb, Tables } from "../lib/dynamodb";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import type { Resource } from "../lib/types";

const router = Router();

// All routes require authentication
router.use(requireAuth());

// GET /api/resources — list (with ?category= filter)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;

    if (category) {
      // Query by primary key (category)
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.resources,
          KeyConditionExpression: "category = :cat",
          ExpressionAttributeValues: { ":cat": category },
        })
      );
      res.json({ resources: result.Items || [] });
      return;
    }

    // Full scan
    const result = await dynamodb.send(
      new ScanCommand({ TableName: Tables.resources })
    );
    res.json({ resources: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// POST /api/resources — create
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;

    const resource: Resource = {
      category: body.category,
      id: body.id || randomUUID(),
      title: body.title,
      description: body.description,
      linkText: body.linkText,
      href: body.href,
      tags: body.tags,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.resources,
        Item: resource,
      })
    );

    res.status(201).json({ resource });
  } catch (error) {
    console.error("Failed to create resource:", error);
    res.status(500).json({ error: "Failed to create resource" });
  }
});

export default router;
