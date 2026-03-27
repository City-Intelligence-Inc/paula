import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireRoles } from "../middleware/roles";

const router = Router();

router.use(authMiddleware);

// GET /api/dashboard/admin
router.get(
  "/admin",
  requireRoles("ADMIN"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Total counts
      const [
        totalStudents,
        totalFamilies,
        totalTutors,
        sessionsToday,
        upcomingSessions,
        recentPayments,
        totalRevenue,
        activePackages,
      ] = await Promise.all([
        prisma.student.count(),
        prisma.family.count(),
        prisma.user.count({ where: { role: "TUTOR" } }),
        prisma.session.count({
          where: {
            scheduledAt: { gte: startOfDay, lt: endOfDay },
            status: { not: "CANCELLED" },
          },
        }),
        prisma.session.findMany({
          where: {
            scheduledAt: { gte: now },
            status: "SCHEDULED",
          },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true },
            },
            tutor: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { scheduledAt: "asc" },
          take: 10,
        }),
        prisma.payment.findMany({
          where: { status: "SUCCEEDED" },
          orderBy: { paidAt: "desc" },
          take: 10,
          include: {
            family: { select: { id: true, name: true } },
          },
        }),
        prisma.payment.aggregate({
          where: { status: "SUCCEEDED" },
          _sum: { amountInCents: true },
        }),
        prisma.package.count({ where: { isActive: true } }),
      ]);

      res.json({
        stats: {
          totalStudents,
          totalFamilies,
          totalTutors,
          sessionsToday,
          activePackages,
          totalRevenueInCents: totalRevenue._sum.amountInCents || 0,
        },
        upcomingSessions,
        recentPayments,
      });
    } catch (error) {
      console.error("Admin dashboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/dashboard/parent
router.get(
  "/parent",
  requireRoles("PARENT"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      // Get this parent's families
      const familyMembers = await prisma.familyMember.findMany({
        where: { userId: user.id },
        include: {
          family: {
            include: {
              students: {
                include: {
                  student: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      gradeLevel: true,
                    },
                  },
                },
              },
              packages: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      if (familyMembers.length === 0) {
        res.json({
          students: [],
          upcomingSessions: [],
          recentNotes: [],
          packages: [],
        });
        return;
      }

      const studentIds = familyMembers.flatMap((fm) =>
        fm.family.students.map((fs) => fs.studentId)
      );

      const students = familyMembers.flatMap((fm) =>
        fm.family.students.map((fs) => fs.student)
      );

      const packages = familyMembers.flatMap((fm) => fm.family.packages);

      // Upcoming sessions for this parent's students
      const upcomingSessions = await prisma.session.findMany({
        where: {
          studentId: { in: studentIds },
          scheduledAt: { gte: new Date() },
          status: "SCHEDULED",
        },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
          tutor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { scheduledAt: "asc" },
        take: 10,
      });

      // Recent CLIENT notes (NEVER include INTERNAL notes for parents)
      const recentNotes = await prisma.sessionNote.findMany({
        where: {
          type: "CLIENT", // CRITICAL: Only CLIENT notes for parents
          session: {
            studentId: { in: studentIds },
          },
        },
        include: {
          session: {
            include: {
              student: {
                select: { id: true, firstName: true, lastName: true },
              },
              tutor: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      res.json({
        students,
        upcomingSessions,
        recentNotes,
        packages,
      });
    } catch (error) {
      console.error("Parent dashboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
