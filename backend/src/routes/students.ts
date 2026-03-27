import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireRoles } from "../middleware/roles";

const router = Router();

router.use(authMiddleware);
router.use(requireRoles("ADMIN", "TUTOR"));

const createStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gradeLevel: z.string().min(1),
  notes: z.string().optional(),
  familyId: z.string().optional(),
});

const updateStudentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  gradeLevel: z.string().min(1).optional(),
  notes: z.string().optional(),
});

// GET /api/students
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    if (user.role === "ADMIN") {
      const students = await prisma.student.findMany({
        include: {
          families: {
            include: {
              family: { select: { id: true, name: true } },
            },
          },
          tutorAssignments: {
            include: {
              tutor: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { lastName: "asc" },
      });

      res.json({ students });
    } else {
      const assignments = await prisma.tutorAssignment.findMany({
        where: { tutorId: user.id },
        include: {
          student: {
            include: {
              families: {
                include: {
                  family: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });

      const students = assignments.map((a) => a.student);
      res.json({ students });
    }
  } catch (error) {
    console.error("List students error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/students/:id
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const id = req.params.id as string;

    if (user.role === "TUTOR") {
      const assignment = await prisma.tutorAssignment.findUnique({
        where: {
          tutorId_studentId: { tutorId: user.id, studentId: id },
        },
      });
      if (!assignment) {
        res.status(403).json({ error: "Not assigned to this student" });
        return;
      }
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        families: {
          include: {
            family: { select: { id: true, name: true } },
          },
        },
        sessions: {
          include: {
            tutor: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { scheduledAt: "desc" },
          take: 10,
        },
        tutorAssignments: {
          include: {
            tutor: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.json({ student });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/students (admin only)
router.post(
  "/",
  requireRoles("ADMIN"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = createStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
      }

      const { firstName, lastName, dateOfBirth, gradeLevel, notes, familyId } = parsed.data;

      const student = await prisma.student.create({
        data: {
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gradeLevel,
          notes,
        },
      });

      if (familyId) {
        const family = await prisma.family.findUnique({ where: { id: familyId } });
        if (family) {
          await prisma.familyStudent.create({
            data: { studentId: student.id, familyId },
          });
        }
      }

      const fullStudent = await prisma.student.findUnique({
        where: { id: student.id },
        include: {
          families: {
            include: {
              family: { select: { id: true, name: true } },
            },
          },
        },
      });

      res.status(201).json({ student: fullStudent });
    } catch (error) {
      console.error("Create student error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/students/:id (admin only)
router.put(
  "/:id",
  requireRoles("ADMIN"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const parsed = updateStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
      }

      const existing = await prisma.student.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: "Student not found" });
        return;
      }

      const data: Record<string, unknown> = { ...parsed.data };
      if (data.dateOfBirth && typeof data.dateOfBirth === "string") {
        data.dateOfBirth = new Date(data.dateOfBirth as string);
      }

      const student = await prisma.student.update({
        where: { id },
        data,
        include: {
          families: {
            include: {
              family: { select: { id: true, name: true } },
            },
          },
        },
      });

      res.json({ student });
    } catch (error) {
      console.error("Update student error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
