import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.sessionNote.deleteMany();
  await prisma.session.deleteMany();
  await prisma.tutorAssignment.deleteMany();
  await prisma.familyStudent.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.package.deleteMany();
  await prisma.student.deleteMany();
  await prisma.family.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: "paula@mathitude.com",
      passwordHash,
      role: "ADMIN",
      firstName: "Paula",
      lastName: "Admin",
      phone: "555-100-0001",
    },
  });
  console.log(`  Admin: ${admin.email}`);

  // Create tutor users
  const tutor1 = await prisma.user.create({
    data: {
      email: "sarah.t@mathitude.com",
      passwordHash,
      role: "TUTOR",
      firstName: "Sarah",
      lastName: "Thompson",
      phone: "555-200-0001",
    },
  });

  const tutor2 = await prisma.user.create({
    data: {
      email: "mike.r@mathitude.com",
      passwordHash,
      role: "TUTOR",
      firstName: "Mike",
      lastName: "Rodriguez",
      phone: "555-200-0002",
    },
  });
  console.log(`  Tutors: ${tutor1.email}, ${tutor2.email}`);

  // Create parent users
  const parent1 = await prisma.user.create({
    data: {
      email: "jennifer.chen@gmail.com",
      passwordHash,
      role: "PARENT",
      firstName: "Jennifer",
      lastName: "Chen",
      phone: "555-300-0001",
    },
  });

  const parent2 = await prisma.user.create({
    data: {
      email: "david.patel@gmail.com",
      passwordHash,
      role: "PARENT",
      firstName: "David",
      lastName: "Patel",
      phone: "555-300-0002",
    },
  });
  console.log(`  Parents: ${parent1.email}, ${parent2.email}`);

  // Create families
  const family1 = await prisma.family.create({
    data: {
      name: "Chen Family",
      billingEmail: "jennifer.chen@gmail.com",
    },
  });

  const family2 = await prisma.family.create({
    data: {
      name: "Patel Family",
      billingEmail: "david.patel@gmail.com",
    },
  });

  // Link parents to families
  await prisma.familyMember.create({
    data: { userId: parent1.id, familyId: family1.id },
  });
  await prisma.familyMember.create({
    data: { userId: parent2.id, familyId: family2.id },
  });

  // Create students
  const student1 = await prisma.student.create({
    data: {
      firstName: "Emily",
      lastName: "Chen",
      dateOfBirth: new Date("2014-03-15"),
      gradeLevel: "5th",
      notes: "Advanced in algebra, needs challenge problems. Parent prefers sessions after 4pm.",
    },
  });

  const student2 = await prisma.student.create({
    data: {
      firstName: "Kevin",
      lastName: "Chen",
      dateOfBirth: new Date("2016-09-22"),
      gradeLevel: "3rd",
      notes: "Working on multiplication tables. Gets frustrated easily - use positive reinforcement.",
    },
  });

  const student3 = await prisma.student.create({
    data: {
      firstName: "Priya",
      lastName: "Patel",
      dateOfBirth: new Date("2012-07-08"),
      gradeLevel: "7th",
      notes: "Preparing for pre-algebra. Very motivated, considering math competition track.",
    },
  });

  // Link students to families
  await prisma.familyStudent.create({
    data: { studentId: student1.id, familyId: family1.id },
  });
  await prisma.familyStudent.create({
    data: { studentId: student2.id, familyId: family1.id },
  });
  await prisma.familyStudent.create({
    data: { studentId: student3.id, familyId: family2.id },
  });
  console.log(`  Students: Emily Chen, Kevin Chen, Priya Patel`);

  // Create tutor assignments
  await prisma.tutorAssignment.create({
    data: { tutorId: tutor1.id, studentId: student1.id },
  });
  await prisma.tutorAssignment.create({
    data: { tutorId: tutor1.id, studentId: student2.id },
  });
  await prisma.tutorAssignment.create({
    data: { tutorId: tutor2.id, studentId: student3.id },
  });

  // Create packages
  await prisma.package.create({
    data: {
      familyId: family1.id,
      name: "Chen Family - 2x/week Plan",
      sessionCount: 8,
      priceInCents: 48000, // $480/month
      billingInterval: "MONTHLY",
      isActive: true,
    },
  });

  await prisma.package.create({
    data: {
      familyId: family2.id,
      name: "Patel Family - Weekly Plan",
      sessionCount: 4,
      priceInCents: 28000, // $280/month
      billingInterval: "MONTHLY",
      isActive: true,
    },
  });

  // Create sessions (mix of past and upcoming)
  const now = new Date();

  const session1 = await prisma.session.create({
    data: {
      studentId: student1.id,
      tutorId: tutor1.id,
      scheduledAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      duration: 60,
      status: "COMPLETED",
    },
  });

  const session2 = await prisma.session.create({
    data: {
      studentId: student2.id,
      tutorId: tutor1.id,
      scheduledAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      duration: 45,
      status: "COMPLETED",
    },
  });

  const session3 = await prisma.session.create({
    data: {
      studentId: student3.id,
      tutorId: tutor2.id,
      scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      duration: 60,
      status: "COMPLETED",
    },
  });

  // Upcoming sessions
  await prisma.session.create({
    data: {
      studentId: student1.id,
      tutorId: tutor1.id,
      scheduledAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // tomorrow
      duration: 60,
      status: "SCHEDULED",
    },
  });

  await prisma.session.create({
    data: {
      studentId: student2.id,
      tutorId: tutor1.id,
      scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      duration: 45,
      status: "SCHEDULED",
    },
  });

  await prisma.session.create({
    data: {
      studentId: student3.id,
      tutorId: tutor2.id,
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      duration: 60,
      status: "SCHEDULED",
    },
  });

  // A cancelled session
  await prisma.session.create({
    data: {
      studentId: student1.id,
      tutorId: tutor1.id,
      scheduledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      duration: 60,
      status: "CANCELLED",
    },
  });

  // Session notes - mix of INTERNAL and CLIENT types
  // Session 1: Emily Chen's completed session
  await prisma.sessionNote.create({
    data: {
      sessionId: session1.id,
      type: "CLIENT",
      content:
        "Emily worked on solving multi-step equations today. She completed 15 practice problems and showed strong understanding of isolating variables. We started introducing word problems that require setting up equations.",
    },
  });
  await prisma.sessionNote.create({
    data: {
      sessionId: session1.id,
      type: "INTERNAL",
      content:
        "Emily is ready to move to 6th grade level material. She gets bored with grade-level work. Consider recommending the advanced track to parents next month. Mom mentioned budget might be tight - do NOT bring up extra sessions.",
    },
  });

  // Session 2: Kevin Chen's completed session
  await prisma.sessionNote.create({
    data: {
      sessionId: session2.id,
      type: "CLIENT",
      content:
        "Kevin practiced his 6, 7, and 8 times tables today. He's making good progress! We used flashcards and a multiplication game to keep it fun. Homework: practice 7s and 8s for 10 minutes each night.",
    },
  });
  await prisma.sessionNote.create({
    data: {
      sessionId: session2.id,
      type: "INTERNAL",
      content:
        "Kevin had a meltdown when he got 7x8 wrong three times. Took a 5-minute break. He seems stressed about school tests. May need to talk to parents about reducing pressure at home. Also noticed he squints at the whiteboard - mention eye check to admin.",
    },
  });

  // Session 3: Priya Patel's completed session
  await prisma.sessionNote.create({
    data: {
      sessionId: session3.id,
      type: "CLIENT",
      content:
        "Priya completed her pre-algebra intro unit. She demonstrated excellent understanding of variable expressions and order of operations. Next session we'll start on solving simple equations.",
    },
  });
  await prisma.sessionNote.create({
    data: {
      sessionId: session3.id,
      type: "INTERNAL",
      content:
        "Priya is significantly ahead of grade level. She could potentially skip to algebra 1. Dad seems very pushy about acceleration - be careful not to over-promise competition results. She mentioned she also does Kumon - sessions might overlap.",
    },
  });

  console.log("  Sessions and notes created");

  // Create payments
  await prisma.payment.create({
    data: {
      familyId: family1.id,
      amountInCents: 48000,
      status: "SUCCEEDED",
      paidAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.payment.create({
    data: {
      familyId: family1.id,
      amountInCents: 48000,
      status: "SUCCEEDED",
      paidAt: new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.payment.create({
    data: {
      familyId: family2.id,
      amountInCents: 28000,
      status: "SUCCEEDED",
      paidAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("  Payments created");
  console.log("");
  console.log("Seed complete! Login credentials (all passwords: password123):");
  console.log(`  Admin:  ${admin.email}`);
  console.log(`  Tutor:  ${tutor1.email}`);
  console.log(`  Tutor:  ${tutor2.email}`);
  console.log(`  Parent: ${parent1.email}`);
  console.log(`  Parent: ${parent2.email}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
