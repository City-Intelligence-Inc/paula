/* eslint-disable no-console */
//
// Bulk import: load Paula's full master Excel (CLIENT_LOG sheet, 2023→present)
// into the staging DynamoDB tables.
//
// What this writes (PREFIX = mathitude-staging-):
//   - 1 family per distinct student          (fam_<slug>)
//   - 1 parent per distinct student          (par_<slug>, placeholder email)
//   - 1 student per distinct name+school     (stu_<slug>)
//   - 1 tutor                                (tut_paula)  — already exists, idempotent
//   - 1 user mapping                         (user_clerk_paula → admin)
//   - N session rows                         (one per parsed row, joint
//                                             sessions are exploded)
//
// Joint-family sessions: same family is fine, the multiple students share
// dateTime + students[]. Cross-family joint sessions get familyBillingSplits
// populated with equal halves of the rate (placeholder until Paula confirms
// the actual billing math).
//
// Time / duration are defaulted (16:00 UTC, 60 min) and `timeIsDefaulted`
// flag is set to true so the calendar UI knows not to display these as
// authoritative scheduling info.
//
// Run:
//   set -a && . ./.env.local && set +a
//   npx tsx scripts/import-master.ts
//

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { resolve } from "path";

const REGION = process.env.AWS_REGION || "us-west-2";
const PREFIX = process.env.DYNAMODB_TABLE_PREFIX || "mathitude-staging";

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("AWS credentials not in env. Source backend/.env.local first.");
  process.exit(1);
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});

interface ParsedRow {
  date: string;
  studentName: string;
  grade: string;
  school: string;
  rateCents: number | null;
  status: "completed" | "cancelled";
  isJoint: boolean;
  isCrossFamily: boolean;
  groupSize: number;
  groupStudents: string[];
  workSummary: string;
  focusArea: string;
}

const PAULA_ID = "tut_paula";
const CLERK_PAULA = "user_clerk_paula";
const NOW = new Date().toISOString();

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

async function batchPut(table: string, items: Record<string, unknown>[]) {
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [`${PREFIX}-${table}`]: chunk.map((Item) => ({ PutRequest: { Item } })),
        },
      }),
    );
  }
}

async function main() {
  const file = resolve(__dirname, "../data/master-sessions-parsed.json");
  const rows: ParsedRow[] = JSON.parse(readFileSync(file, "utf8"));
  console.log(`Loaded ${rows.length} parsed session-rows from ${file}`);

  // -------- Discover distinct students --------
  // Key by (slug, school) to allow same-named students at different schools
  // to be distinct. Track grade history (last-seen wins for current grade).
  const studentMap = new Map<string, {
    id: string;
    slug: string;
    name: string;
    school: string;
    latestDate: string;
    latestGrade: string;
  }>();

  for (const r of rows) {
    if (!r.studentName) continue;
    const sl = slug(r.studentName);
    const cur = studentMap.get(sl);
    if (!cur || r.date > cur.latestDate) {
      studentMap.set(sl, {
        id: `stu_${sl}`,
        slug: sl,
        name: r.studentName,
        school: r.school,
        latestDate: r.date,
        latestGrade: r.grade,
      });
    }
  }
  console.log(`Distinct students: ${studentMap.size}`);

  // -------- Build entity items --------
  const families: Record<string, unknown>[] = [];
  const parents: Record<string, unknown>[] = [];
  const students: Record<string, unknown>[] = [];

  for (const stu of studentMap.values()) {
    const familyId = `fam_${stu.slug}`;
    const parentId = `par_${stu.slug}`;
    families.push({
      id: familyId,
      primaryPayerId: parentId,
      notes: "Auto-created from master-sessions import — needs Paula review for sibling/spouse merging",
      createdAt: NOW,
      updatedAt: NOW,
    });
    parents.push({
      id: parentId,
      familyId,
      firstName: "(unknown)",
      lastName: stu.name,
      email: `${stu.slug}@example.invalid`,
      createdAt: NOW,
      updatedAt: NOW,
    });
    // Naive split: "PAXTON T" -> firstName "PAXTON", lastName "T"
    // GSI requires lastName be non-empty, so fall back to slug.
    const parts = stu.name.split(/\s+/);
    const firstName = parts[0] || stu.name;
    const lastName = parts.slice(1).join(" ") || stu.slug;
    students.push({
      id: stu.id,
      familyId,
      firstName,
      lastName,
      grade: stu.latestGrade,
      school: stu.school,
      status: "active",
      parentName: stu.name,
      parentEmail: `${stu.slug}@example.invalid`,
      parentPhone: "",
      sessionType: "individual",
      rate: 0,
      tutorIds: [PAULA_ID],
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  // Tutor + user (idempotent — overwrites existing)
  const tutors = [{
    id: PAULA_ID,
    firstName: "Paula",
    lastName: "Hamilton",
    email: "phamilton@mathitude.com",
    clerkUserId: CLERK_PAULA,
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  }];
  const users = [{
    clerkUserId: CLERK_PAULA,
    role: "admin",
    linkedEntityId: PAULA_ID,
    createdAt: NOW,
  }];

  // -------- Build session items --------
  // Dedup on (studentId, dateTime). Two sessions on the same day for the same
  // student get a fractional minute bump to keep them distinct.
  const sessions: Record<string, unknown>[] = [];
  const seenKey = new Map<string, number>();
  for (const r of rows) {
    if (!r.studentName) continue;
    const sl = slug(r.studentName);
    const studentId = `stu_${sl}`;
    const baseKey = `${studentId}|${r.date}`;
    const collisionN = seenKey.get(baseKey) ?? 0;
    seenKey.set(baseKey, collisionN + 1);
    // Pad minute by collision count: 16:00, 16:01, 16:02...
    const minutes = String(collisionN).padStart(2, "0");
    const time = `16:${minutes}`;
    const dateTime = `${r.date}T${time}:00Z`;

    const groupSlugs = r.groupStudents.map(slug);
    const groupStudentIds = groupSlugs.map((g) => `stu_${g}`);

    let familyBillingSplits: { familyId: string; amountCents: number }[] | undefined;
    if (r.isCrossFamily && r.rateCents != null && groupSlugs.length > 1) {
      const split = Math.floor(r.rateCents / groupSlugs.length);
      familyBillingSplits = groupSlugs.map((g) => ({
        familyId: `fam_${g}`,
        amountCents: split,
      }));
    }

    const noteParts = [r.workSummary, r.focusArea].filter(Boolean);
    sessions.push({
      studentId,
      dateTime,
      date: r.date,
      time,
      tutorId: PAULA_ID,
      duration: 60,
      type: r.isJoint ? "group" : "individual",
      status: r.status,
      rate: r.rateCents ?? 0,
      offering: "private-tutoring",
      timeIsDefaulted: true,
      notes: r.workSummary || undefined,
      privateNotes: r.focusArea || undefined,
      students: r.isJoint ? groupStudentIds : undefined,
      familyBillingSplits,
      _importedAt: NOW,
      _importSource: "master-excel-2023-present",
    });
  }

  console.log(
    `Writing: ${families.length} families, ${parents.length} parents, ${students.length} students, ${sessions.length} sessions`,
  );

  // -------- Write everything --------
  await batchPut("families", families);
  console.log("✓ families");
  await batchPut("parents", parents);
  console.log("✓ parents");
  await batchPut("students", students);
  console.log("✓ students");
  await batchPut("tutors", tutors);
  console.log("✓ tutors");
  await batchPut("users", users);
  console.log("✓ users");
  await batchPut("sessions", sessions);
  console.log(`✓ sessions (${sessions.length} rows)`);

  console.log("Done.");
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
