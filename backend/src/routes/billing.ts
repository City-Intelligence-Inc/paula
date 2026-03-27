import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireRoles } from "../middleware/roles";
import {
  createCustomer,
  createSubscription,
  billingIntervalToStripeInterval,
} from "../services/stripe";

const router = Router();

router.use(authMiddleware);

const createPackageSchema = z.object({
  familyId: z.string().min(1),
  name: z.string().min(1),
  sessionCount: z.number().int().min(1),
  priceInCents: z.number().int().min(100),
  billingInterval: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
});

// GET /api/billing/payments
router.get("/payments", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let where: Record<string, unknown> = {};

    if (user.role === "PARENT") {
      // Get family IDs for this parent
      const familyMembers = await prisma.familyMember.findMany({
        where: { userId: user.id },
        select: { familyId: true },
      });

      const familyIds = familyMembers.map((fm) => fm.familyId);
      if (familyIds.length === 0) {
        res.json({ payments: [] });
        return;
      }

      where = { familyId: { in: familyIds } };
    } else if (user.role !== "ADMIN") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        family: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ payments });
  } catch (error) {
    console.error("List payments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/billing/packages
router.get("/packages", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let where: Record<string, unknown> = {};

    if (user.role === "PARENT") {
      const familyMembers = await prisma.familyMember.findMany({
        where: { userId: user.id },
        select: { familyId: true },
      });

      const familyIds = familyMembers.map((fm) => fm.familyId);
      if (familyIds.length === 0) {
        res.json({ packages: [] });
        return;
      }

      where = { familyId: { in: familyIds }, isActive: true };
    } else if (user.role === "ADMIN") {
      // Admin sees all packages; optionally filter by active
      const { active } = req.query;
      if (active === "true") {
        where = { isActive: true };
      }
    } else {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const packages = await prisma.package.findMany({
      where,
      include: {
        family: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ packages });
  } catch (error) {
    console.error("List packages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/billing/packages (admin only)
router.post(
  "/packages",
  requireRoles("ADMIN"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = createPackageSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
      }

      const { familyId, name, sessionCount, priceInCents, billingInterval } = parsed.data;

      // Verify family exists
      const family = await prisma.family.findUnique({ where: { id: familyId } });
      if (!family) {
        res.status(404).json({ error: "Family not found" });
        return;
      }

      let stripeSubscriptionId: string | null = null;

      // Attempt Stripe integration (gracefully handle if Stripe keys aren't configured)
      try {
        let customerId = family.stripeCustomerId;

        if (!customerId) {
          const customer = await createCustomer(family.billingEmail, family.name);
          customerId = customer.id;
          await prisma.family.update({
            where: { id: familyId },
            data: { stripeCustomerId: customerId },
          });
        }

        const interval = billingIntervalToStripeInterval(billingInterval);
        const subscription = await createSubscription(customerId, priceInCents, interval);
        stripeSubscriptionId = subscription.id;
      } catch (stripeError) {
        // Log but don't fail — Stripe might not be configured in dev
        console.warn("Stripe integration skipped:", (stripeError as Error).message);
      }

      const pkg = await prisma.package.create({
        data: {
          familyId,
          name,
          sessionCount,
          priceInCents,
          billingInterval,
          stripeSubscriptionId,
        },
        include: {
          family: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({ package: pkg });
    } catch (error) {
      console.error("Create package error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
