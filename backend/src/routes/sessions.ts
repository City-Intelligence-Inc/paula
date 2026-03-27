import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireRoles } from "../middleware/roles";

const router = Router();

router.use(authMiddleware);

const createSessionSchema = z.object({
  studentId: z.string().min(1),
  tutorId: z.string().min(1),
  scheduledAt: z.string().min(1),
  duration: z.number().int().min(15).max(480),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
});

const updateSessionSchema = z.object({
  scheduledAt: z.string().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  tutorId: z.string().optional(),
});

// GET /api/sessions
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let where: Record<string, unknown> = {};

    if (user.role === "TUTOR") {
      where = { tutorId: user.id };
    } else if (user.role === "PARENT") {
      const familyMembers = await prisma.familyMember.findMany({
        where: { userId: user.id },
        include: {
          family: {
            include: {
              students: { select: { studentId: true } },
            },
          },
        },
      });

      const studentIds = familyMembers.flatMap((fm) =>
        fm.family.students.map((fs) => fs.studentId)
      );

      if (studentIds.length === 0) {
        res.json({ sessions: [] });
        return;
      }

      where = { studentId: { in: studentIds } };
    }

    const { status, studentId, tutorId } = req.query;
    if (status && typeof status === "string") {
      where.status = status;
    }
    if (studentId && typeof studentId === "string" && user.role !== "PARENT") {
      where.studentId = studentId;
    }
    if (tutorId && typeof tutorId === "string" && user.role === "ADMIN") {
      where.tutorId = tutorId;
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, gradeLevel: true },
        },
        tutor: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: { select: { notes: true } },
      },
      orderBy: { scheduledAt: "desc" },
    });

    res.json({ sessions });
  } catch (error) {
    console.error("List sessions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sessions/:id
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const id = req.params.id as string;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, gradeLevel: true },
        },
        tutor: {
          select: { id: true, firstName: true, lastName: true },
        },
        notes: true,
      },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (user.role === "TUTOR" && session.tutorId !== user.id) {
      res.status(403).json({ error: "Not authorized to view this session" });
      return;
    }

    if (user.role === "PARENT") {
      const familyMembers = await prisma.familyMember.findMany({
        where: { userId: user.id },
        include: {
          family: {
            include: {
              students: { select: { studentId: true } },
            },
          },
        },
      });

      const studentIds = familyMembers.flatMap((fm) =>
        fm.family.students.map((fs) => fs.studentId)
      );

      if (!studentIds.includes(session.studentId)) {
        res.status(403).json({ error: "Not authorized to view this session" });
        return;
      }

      // CRITICAL: Filter out INTERNAL notes for parents
      const filteredNotes = session.notes.filter((note: { type: string }) => note.type === "CLIENT");
      res.json({ session: { ...session, notes: filteredNotes } });
      return;
    }

    res.json({ session });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions (admin/tutor)
router.post(
  "/",
  requireRoles("ADMIN", "TUTOR"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = createSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
      }

      const { studentId, tutorId, scheduledAt, duration, status } = parsed.data;

      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }

      const tutor = await prisma.user.findUnique({ where: { id: tutorId } });
      if (!tutor || tutor.role !== "TUTOR") {
        res.status(400).json({ error: "Invalid tutor" });
        return;
      }

      if (req.user!.role === "TUTOR" && tutorId !== req.user!.id) {
        res.status(403).json({ error: "Tutors can only create sessions for themselves" });
        return;
      }

      const session = await prisma.session.create({
        data: {
          studentId,
          tutorId,
          scheduledAt: new Date(scheduledAt),
          duration,
          status,
        },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, gradeLevel: true },
          },
          tutor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      res.status(201).json({ session });
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/sessions/:id (admin/tutor)
router.put(
  "/:id",
  requireRoles("ADMIN", "TUTOR"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const parsed = updateSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
      }

      const existing = await prisma.session.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      if (req.user!.role === "TUTOR" && existing.tutorId !== req.user!.id) {
        res.status(403).json({ error: "Not authorized to update this session" });
        return;
      }

      const data: Record<string, unknown> = { ...parsed.data };
      if (data.scheduledAt && typeof data.scheduledAt === "string") {
        data.scheduledAt = new Date(data.scheduledAt as string);
      }

      const session = await prisma.session.update({
        where: { id },
        data,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, gradeLevel: true },
          },
          tutor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      res.json({ session });
    } catch (error) {
      console.error("Update session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
