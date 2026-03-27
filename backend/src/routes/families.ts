import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireRoles } from "../middleware/roles";

const router = Router();

router.use(authMiddleware);
router.use(requireRoles("ADMIN"));

const createFamilySchema = z.object({
  name: z.string().min(1),
  billingEmail: z.string().email(),
  parentUserId: z.string().optional(),
});

const updateFamilySchema = z.object({
  name: z.string().min(1).optional(),
  billingEmail: z.string().email().optional(),
  stripeCustomerId: z.string().optional(),
});

// GET /api/families
router.get("/", async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const families = await prisma.family.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        students: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, gradeLevel: true },
            },
          },
        },
        packages: {
          where: { isActive: true },
        },
        _count: {
          select: { payments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({ families });
  } catch (error) {
    console.error("List families error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/families/:id
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const family = await prisma.family.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        students: {
          include: {
            student: true,
          },
        },
        packages: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!family) {
      res.status(404).json({ error: "Family not found" });
      return;
    }

    res.json({ family });
  } catch (error) {
    console.error("Get family error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/families
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createFamilySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { name, billingEmail, parentUserId } = parsed.data;

    const family = await prisma.family.create({
      data: {
        name,
        billingEmail,
      },
    });

    if (parentUserId) {
      const parentUser = await prisma.user.findUnique({
        where: { id: parentUserId },
      });
      if (parentUser && parentUser.role === "PARENT") {
        await prisma.familyMember.create({
          data: {
            userId: parentUserId,
            familyId: family.id,
          },
        });
      }
    }

    const fullFamily = await prisma.family.findUnique({
      where: { id: family.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        students: true,
      },
    });

    res.status(201).json({ family: fullFamily });
  } catch (error) {
    console.error("Create family error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/families/:id
router.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const parsed = updateFamilySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const existing = await prisma.family.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Family not found" });
      return;
    }

    const family = await prisma.family.update({
      where: { id },
      data: parsed.data,
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        students: {
          include: { student: true },
        },
      },
    });

    res.json({ family });
  } catch (error) {
    console.error("Update family error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
