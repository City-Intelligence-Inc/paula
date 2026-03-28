import { Router, Request, Response } from "express";
import { requireAuth } from "../lib/auth";
import { dynamodb, Tables } from "../lib/dynamodb";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { Payment } from "../lib/types";

const router = Router();

// All routes require authentication
router.use(requireAuth());

// GET /api/payments — list (with ?studentId= or ?status= filter)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.query.studentId as string | undefined;
    const status = req.query.status as string | undefined;

    if (studentId) {
      // Query by primary key (studentId)
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.payments,
          KeyConditionExpression: "studentId = :sid",
          ExpressionAttributeValues: { ":sid": studentId },
          ScanIndexForward: false, // newest first
        })
      );
      res.json({ payments: result.Items || [] });
      return;
    }

    if (status) {
      // Use the by-status GSI
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: Tables.payments,
          IndexName: "by-status",
          KeyConditionExpression: "paymentStatus = :status",
          ExpressionAttributeValues: { ":status": status },
        })
      );
      res.json({ payments: result.Items || [] });
      return;
    }

    // Full scan if no filter
    const result = await dynamodb.send(
      new ScanCommand({ TableName: Tables.payments })
    );
    res.json({ payments: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// POST /api/payments — create
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const now = new Date().toISOString();

    const payment: Payment = {
      studentId: body.studentId,
      createdAt: body.createdAt || now,
      amount: body.amount,
      paymentStatus: body.paymentStatus || "pending",
      description: body.description,
      stripePaymentIntentId: body.stripePaymentIntentId,
      stripeChargeId: body.stripeChargeId,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.payments,
        Item: payment,
      })
    );

    res.status(201).json({ payment });
  } catch (error) {
    console.error("Failed to create payment:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

export default router;
