/* eslint-disable no-console */
//
// One-time import: load Paula's session-notes for Timmy (and joint sessions
// with Thompson) into the staging DynamoDB tables. The source file is
// data/timmy-sessions.json — pasted from the real Mathitude Google Sheet.
//
// What this writes (PREFIX = mathitude-staging-):
//   - 1 Family   (Sunbin + Andrew's household)
//   - 2 Parents  (Sunbin = primary payer, Andrew)
//   - 2 Students (Timmy = K, Thompson = K — joint-session evidence)
//   - 1 Tutor    (Paula, tut_paula)
//   - 1 User     (clerk_paula → admin role)
//   - N Sessions (one row PER STUDENT for joint sessions, with `students[]`
//                 enumerating the full group; tutorId = tut_paula on each)
//
// Run: npx tsx scripts/import-timmy.ts
//

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { resolve } from "path";

const REGION = process.env.AWS_REGION || "us-west-2";
const PREFIX = process.env.DYNAMODB_TABLE_PREFIX || "mathitude-staging";

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("AWS credentials not set in env. Source backend/.env.local first.");
  process.exit(1);
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});

interface SessionRecord {
  date: string;
  activities: string[];
  notes: string;
  joint?: boolean;
  groupStudents?: string[];
}

interface SourceData {
  studentName: string;
  tutorName: string;
  sourceSheet: string;
  sessions: SessionRecord[];
}

// Parse "12/6/25" → "2025-12-06" (M/D/YY, US format, 2-digit year ≥50 = 19xx)
function parseDate(mdy: string): string {
  const [m, d, y] = mdy.split("/").map((s) => s.trim());
  const year = Number(y) >= 50 ? `19${y}` : `20${y.padStart(2, "0")}`;
  return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

const TIMMY_ID = "stu_timmy";
const THOMPSON_ID = "stu_thompson";
const FAMILY_ID = "fam_sunbin";
const PAULA_ID = "tut_paula";
const PARENT_SUNBIN = "par_sunbin";
const PARENT_ANDREW = "par_andrew";
const CLERK_PAULA = "user_clerk_paula";

async function put(table: string, item: unknown) {
  await ddb.send(
    new PutCommand({ TableName: `${PREFIX}-${table}`, Item: item as Record<string, unknown> }),
  );
}

async function main() {
  const file = resolve(__dirname, "../data/timmy-sessions.json");
  const raw = JSON.parse(readFileSync(file, "utf8")) as SourceData;
  console.log(`Loaded ${raw.sessions.length} sessions from ${file}`);

  const now = new Date().toISOString();

  // -------- Family + parents --------
  await put("families", {
    id: FAMILY_ID,
    primaryPayerId: PARENT_SUNBIN,
    notes: "Imported from Paula's Timmy session-notes sheet, 2026-04-30",
    createdAt: now,
    updatedAt: now,
  });

  await put("parents", {
    id: PARENT_SUNBIN,
    familyId: FAMILY_ID,
    firstName: "Sunbin",
    lastName: "(parent of Timmy & Thompson)",
    email: "sunbin@example.invalid",
    createdAt: now,
    updatedAt: now,
  });

  await put("parents", {
    id: PARENT_ANDREW,
    familyId: FAMILY_ID,
    firstName: "Andrew",
    lastName: "(parent of Timmy & Thompson)",
    email: "andrew@example.invalid",
    createdAt: now,
    updatedAt: now,
  });

  // -------- Students --------
  await put("students", {
    id: TIMMY_ID,
    familyId: FAMILY_ID,
    firstName: "Timmy",
    lastName: "(Sunbin)",
    grade: "K",
    status: "active",
    parentName: "Sunbin",
    parentEmail: "sunbin@example.invalid",
    parentPhone: "",
    sessionType: "individual",
    rate: 0,
    tutorIds: [PAULA_ID],
    createdAt: now,
    updatedAt: now,
  });

  await put("students", {
    id: THOMPSON_ID,
    familyId: FAMILY_ID,
    firstName: "Thompson",
    lastName: "(Sunbin)",
    grade: "K",
    status: "active",
    parentName: "Sunbin",
    parentEmail: "sunbin@example.invalid",
    parentPhone: "",
    sessionType: "individual",
    rate: 0,
    tutorIds: [PAULA_ID],
    createdAt: now,
    updatedAt: now,
  });

  // -------- Tutor + user mapping --------
  await put("tutors", {
    id: PAULA_ID,
    firstName: "Paula",
    lastName: "Hamilton",
    email: "phamilton@mathitude.com",
    clerkUserId: CLERK_PAULA,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  await put("users", {
    clerkUserId: CLERK_PAULA,
    role: "admin",
    linkedEntityId: PAULA_ID,
    createdAt: now,
  });

  // -------- Sessions --------
  // Convention: 1 row per (student, dateTime). Joint sessions become 2 rows
  // (one per student) with `students` listing the full group on each row,
  // so the by-tutor-date / by-status GSIs report once-per-pairing.
  let written = 0;
  for (const s of raw.sessions) {
    const date = parseDate(s.date);
    // No time of day in source; default to 16:00 (after-school) UTC
    const time = "16:00";
    const dateTime = `${date}T${time}:00Z`;

    const studentIds = s.joint ? [TIMMY_ID, THOMPSON_ID] : [TIMMY_ID];

    for (const studentId of studentIds) {
      await put("sessions", {
        studentId,
        dateTime,
        date,
        time,
        tutorId: PAULA_ID,
        duration: 60,
        type: s.joint ? "group" : "individual",
        status: "completed",
        notes: `ACTIVITIES:\n${s.activities.map((a) => `* ${a}`).join("\n")}\n\nNOTES:\n${s.notes}`,
        students: s.joint ? studentIds : undefined,
      });
      written++;
    }
  }

  console.log(`✓ Imported family + 2 parents + 2 students + 1 tutor + 1 user`);
  console.log(`✓ Wrote ${written} session rows from ${raw.sessions.length} dates`);
  console.log(`  (${raw.sessions.filter((s) => s.joint).length} joint sessions × 2 students)`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
