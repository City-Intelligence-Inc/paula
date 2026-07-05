#!/usr/bin/env node
// Demo recorder — one screen-recording per tracker row, for the sheet's
// Visual/example column. Read-only against the live site (see scenarios.mjs
// for the no-mutation rules; confirm() dialogs are auto-DISMISSED here as a
// backstop so nothing destructive can fire even if a click goes wrong).
//
// Usage:
//   npm run demos:auth               # one-time: sign in as admin, saves auth-admin.json
//   npm run demos:auth -- parent     # optional: same for a parent account
//   npm run demos                    # record everything possible
//   npm run demos -- --only B-4,D-2  # record specific rows
//   npm run demos -- --base http://localhost:3000
//
// Output: scripts/demos/out/<ID>.webm + manifest.csv (row ID, title, file)
// ready to upload to Loom/Drive and paste into the sheet.
import { chromium } from "playwright";
import { existsSync, mkdirSync, renameSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SCENARIOS, TASK_SCENARIOS, SANDBOX_SCENARIOS } from "./demos/scenarios.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const demosDir = join(here, "demos");
const outDir = join(demosDir, "out");

const args = process.argv.slice(2);
const baseIdx = args.indexOf("--base");
const BASE = baseIdx >= 0 ? args[baseIdx + 1] : "https://website-sage-three-98.vercel.app";
const onlyIdx = args.indexOf("--only");
const ONLY = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(",").map((s) => s.trim())) : null;
// Full-task scenarios perform real (self-cleaning) workflows — opt-in only.
const WITH_TASKS = args.includes("--tasks");
const IS_LOCAL = /localhost|127\.0\.0\.1/.test(BASE);
const ALL_SCENARIOS = WITH_TASKS
  ? [...SCENARIOS, ...TASK_SCENARIOS, ...SANDBOX_SCENARIOS]
  : SCENARIOS;

// Sessions are cookie/domain scoped — localhost auth lives in its own file
// so sandbox runs never reuse (or clobber) the production session.
const authFile = (kind) => join(demosDir, IS_LOCAL ? `auth-${kind}.local.json` : `auth-${kind}.json`);

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
// Per-run notes (failures/skips). The manifest itself is rebuilt from disk at
// the end so partial --only runs never clobber earlier recordings' rows.
const notes = new Map();

for (const s of ALL_SCENARIOS) {
  if (ONLY && !ONLY.has(s.id)) continue;

  // Destructive flows are sandbox-only: hard refusal on any non-local base.
  if (s.sandboxOnly && !IS_LOCAL) {
    console.log(`SKIP ${s.id} — sandbox-only (run \`npm run sandbox\`, then pass --base http://localhost:3000)`);
    notes.set(s.id, "skipped: sandbox-only, refused on non-local base");
    continue;
  }

  if (s.auth && !existsSync(authFile(s.auth))) {
    console.log(`SKIP ${s.id} — needs ${s.auth} auth (run: npm run demos:auth${s.auth === "parent" ? " -- parent" : ""})`);
    notes.set(s.id, `skipped: no ${s.auth} auth`);
    continue;
  }

  const workDir = join(outDir, `.rec-${s.id}`);
  rmSync(workDir, { recursive: true, force: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: workDir, size: { width: 1440, height: 900 } },
    ...(s.auth ? { storageState: authFile(s.auth) } : {}),
  });
  const page = await context.newPage();
  // Read-only scenarios: never accept a confirm(). Task scenarios perform
  // the real workflow (self-cleaning), so their confirms are accepted.
  page.on("dialog", (d) => (s.task ? d.accept() : d.dismiss()).catch(() => {}));

  process.stdout.write(`REC  ${s.id} — ${s.title} … `);
  try {
    await s.run(page, BASE);
    await context.close(); // flushes the video
    const [video] = readdirSync(workDir).filter((f) => f.endsWith(".webm"));
    const dest = join(outDir, `${s.id}.webm`);
    renameSync(join(workDir, video), dest);
    rmSync(workDir, { recursive: true, force: true });
    console.log("ok");
  } catch (err) {
    await context.close().catch(() => {});
    rmSync(workDir, { recursive: true, force: true });
    console.log(`FAILED: ${String(err).split("\n")[0]}`);
    notes.set(s.id, `failed: ${String(err).split("\n")[0]}`);
  }
}

await browser.close();

const manifest = [["row_id", "title", "file", "status"]];
for (const s of [...SCENARIOS, ...TASK_SCENARIOS, ...SANDBOX_SCENARIOS]) {
  const onDisk = existsSync(join(outDir, `${s.id}.webm`));
  manifest.push([
    s.id,
    s.title,
    onDisk ? `${s.id}.webm` : "",
    onDisk ? "recorded" : notes.get(s.id) || "not recorded",
  ]);
}
writeFileSync(
  join(outDir, "manifest.csv"),
  manifest.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n") + "\n",
);
console.log(`\nDone → ${outDir}`);
console.log("Next: upload the .webm files (drag the folder into loom.com/library or Google Drive),");
console.log("then paste each link into the sheet's Visual/example column using manifest.csv as the map.");
