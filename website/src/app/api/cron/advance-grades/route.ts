import {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";
import { notifyAction } from "@/lib/server/notify";
import { advanceGrade } from "@/lib/grades";
import type { Student } from "@/lib/types";

// Automatic school-year progression (FEATURE_LIST C-6). Vercel Cron hits GET
// every August 1 (see website/vercel.json); an admin can also run it manually
// via POST (with { force: true } to re-run within the same year, e.g. after
// fixing a bad grade). Every ACTIVE student advances one grade — see
// advanceGrade() in lib/grades.ts for the exact ladder. A marker row in the
// secrets table records the last year it ran so a duplicate cron fire (or a
// redeploy retry) can never double-promote anyone.

const MARKER_ID = "grade-advancement";

async function run(force: boolean): Promise<Response> {
  const c = ddb();
  const year = new Date().getFullYear();

  const marker = await c.send(
    new GetCommand({ TableName: Tables.secrets, Key: { id: MARKER_ID } }),
  );
  if (!force && marker.Item?.lastRunYear === year) {
    return Response.json({
      skipped: true,
      reason: `Grades were already advanced for ${year} (${marker.Item?.lastRunAt || "unknown time"}).`,
    });
  }

  const r = await c.send(new ScanCommand({ TableName: Tables.students }));
  const students = (r.Items as Student[]) || [];

  const advanced: { id: string; name: string; from: string; to: string }[] = [];
  const unchanged: string[] = [];
  const now = new Date().toISOString();

  for (const s of students) {
    if (s.status !== "active") continue;
    const next = advanceGrade(s.grade);
    if (!next || next === s.grade) {
      unchanged.push(s.id);
      continue;
    }
    await c.send(
      new UpdateCommand({
        TableName: Tables.students,
        Key: { id: s.id },
        UpdateExpression: "SET grade = :g, updatedAt = :u",
        ExpressionAttributeValues: { ":g": next, ":u": now },
      }),
    );
    advanced.push({
      id: s.id,
      name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
      from: s.grade || "?",
      to: next,
    });
  }

  await c.send(
    new PutCommand({
      TableName: Tables.secrets,
      Item: { id: MARKER_ID, lastRunYear: year, lastRunAt: now, advancedCount: advanced.length },
    }),
  );

  notifyAction({
    kind: "students.grades-advanced",
    summary: `School-year rollover: ${advanced.length} active students advanced one grade (${unchanged.length} unchanged).`,
    details: {
      year,
      advanced: advanced.map((a) => `${a.name}: ${a.from} → ${a.to}`),
    },
  }).catch(() => {});

  return Response.json({ year, advancedCount: advanced.length, advanced, unchangedCount: unchanged.length });
}

// Vercel Cron invokes GET on Aug 1. No CRON_SECRET env var required: the
// GET path is safe unauthenticated because it can ONLY do the exact thing
// the schedule would do anyway — advance grades, in the first week of
// August, at most once per year (the marker row in the AWS secrets table is
// the once-per-year lock; `force` is never honored here). Outside that
// window, or after the year's run, the request is a no-op. If CRON_SECRET
// IS set someday, it's enforced as an extra belt.
export async function GET(request: Request) {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (secret) {
    const header = request.headers.get("authorization") || "";
    if (header !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return run(false);
  }

  // Schedule-window guard (UTC, matching the vercel.json schedule): the
  // rollover may only fire Aug 1–7, covering platform retries without
  // letting a stray request advance grades in, say, March.
  const now = new Date();
  const inWindow = now.getUTCMonth() === 7 && now.getUTCDate() <= 7;
  if (!inWindow) {
    return Response.json({
      skipped: true,
      reason: "Outside the Aug 1–7 rollover window — nothing to do.",
    });
  }
  return run(false);
}

// Manual admin trigger (Settings-level escape hatch).
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  let force = false;
  try {
    const body = await request.json();
    force = body?.force === true;
  } catch {
    // no body — fine
  }
  return run(force);
}
