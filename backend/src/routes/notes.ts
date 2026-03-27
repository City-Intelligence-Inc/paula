import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireRoles } from "../middleware/roles";

const router = Router();

router.use(authMiddleware);

const createNoteSchema = z.object({
  type: z.enum(["INTERNAL", "CLIENT"]),
  content: z.string().min(1),
});

const updateNoteSchema = z.object({
  type: z.enum(["INTERNAL", "CLIENT"]).optional(),
  content: z.string().min(1).optional(),
});

// GET /api/sessions/:sessionId/notes
// CRITICAL: Parents ONLY see CLIENT type notes. NEVER return INTERNAL notes to parents.
router.get(
  "/sessions/:sessionId/notes",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const sessionId = req.params.sessionId as string;

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { id: true, studentId: true, tutorId: true },
      });

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      if (user.role === "TUTOR" && session.tutorId !== user.id) {
        res.status(403).json({ error: "Not authorized to view these notes" });
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
          res.status(403).json({ error: "Not authorized to view these notes" });
          return;
        }
      }

      // Build query filter
      const where: Record<string, unknown> = { sessionId };

      // PRIVACY ENFORCEMENT: Parents can ONLY see CLIENT notes
      if (user.role === "PARENT") {
        where.type = "CLIENT";
      }

      const notes = await prisma.sessionNote.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      res.json({ notes });
    } catch (error) {
      console.error("List notes error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/sessions/:sessionId/notes (admin/tutor only)
router.post(
  "/sessions/:sessionId/notes",
  requireRoles("ADMIN", "TUTOR"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const parsed = createNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { id: true, tutorId: true },
      });

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      if (req.user!.role === "TUTOR" && session.tutorId !== req.user!.id) {
        res.status(403).json({ error: "Not authorized to add notes to this session" });
        return;
      }

      const { type, content } = parsed.data;

      const note = await prisma.sessionNote.create({
        data: {
          sessionId,
          type,
          content,
        },
      });

      res.status(201).json({ note });
    } catch (error) {
      console.error("Create note error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/notes/:id (admin/tutor only)
router.put(
  "/notes/:id",
  requireRoles("ADMIN", "TUTOR"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const parsed = updateNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
      }

      const existing = await prisma.sessionNote.findUnique({
        where: { id },
        include: {
          session: { select: { tutorId: true } },
        },
      });

      if (!existing) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      if (req.user!.role === "TUTOR" && existing.session.tutorId !== req.user!.id) {
        res.status(403).json({ error: "Not authorized to update this note" });
        return;
      }

      const note = await prisma.sessionNote.update({
        where: { id },
        data: parsed.data,
      });

      res.json({ note });
    } catch (error) {
      console.error("Update note error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
