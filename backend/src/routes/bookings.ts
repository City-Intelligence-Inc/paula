import { Router, Request, Response } from "express";
import { requireAuth } from "../lib/auth";
import { dynamodb, Tables } from "../lib/dynamodb";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const router = Router();

router.use(requireAuth());

interface Booking {
  bookingId: string;
  userId: string;
  parentName: string;
  studentName: string;
  studentGrade?: string;
  date: string;
  time: string;
  durationMinutes: number;
  format: "virtual" | "in-person";
  notes?: string;
  status: "requested" | "confirmed" | "declined" | "completed" | "cancelled";
  createdAt: string;
}

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { auth?: { userId?: string } }).auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { parentName, studentName, studentGrade, date, time, format, notes } = req.body;

    if (!parentName || !studentName || !date || !time || !format) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const booking: Booking = {
      bookingId: randomUUID(),
      userId,
      parentName,
      studentName,
      studentGrade,
      date,
      time,
      durationMinutes: 30,
      format,
      notes,
      status: "requested",
      createdAt: new Date().toISOString(),
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.bookings,
        Item: booking,
      })
    );

    res.status(201).json({ booking });
  } catch (error) {
    console.error("Failed to create booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

router.get("/mine", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { auth?: { userId?: string } }).auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await dynamodb.send(
      new ScanCommand({
        TableName: Tables.bookings,
        FilterExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    );
    res.json({ bookings: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await dynamodb.send(
      new ScanCommand({ TableName: Tables.bookings })
    );
    res.json({ bookings: result.Items || [] });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

export default router;
