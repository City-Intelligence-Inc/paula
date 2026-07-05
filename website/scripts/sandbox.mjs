#!/usr/bin/env node
// Sandbox stack (Paula 7/2 "*Sandbox"; modeled on Stripe's sandboxes +
// dev-environments guidance): the full app running locally against an
// in-memory DynamoDB with seeded demo data and a Stripe SANDBOX key — a
// safe place to click through EVERYTHING, including the destructive flows
// (copy-week, live charges, card saves) that must never be demoed on prod.
//
//   1. cp .env.local from `npx vercel env pull .env.local` (one time), then
//      REPLACE STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY with
//      keys from a Stripe *sandbox* (Dashboard → account menu → Sandboxes).
//   2. npm run sandbox        → dynalite + tables + seed + next dev :3000
//   3. DEMO_BASE=http://localhost:3000 npm run demos:auth   (sign in once)
//   4. npm run demos -- --tasks --base http://localhost:3000
//
// Data lives under the `mathitude-sandbox` table prefix inside dynalite's
// memory — gone when this process exits. Nothing here can touch prod tables.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const here = dirname(fileURLToPath(import.meta.url));
const websiteDir = join(here, "..");

const envLocal = join(websiteDir, ".env.local");
if (!existsSync(envLocal)) {
  console.error(
    "Missing website/.env.local — run `npx vercel env pull .env.local` from website/ first,\n" +
      "then swap the Stripe keys for your Stripe SANDBOX keys (Dashboard → Sandboxes).",
  );
  process.exit(1);
}
const envText = readFileSync(envLocal, "utf8");
if (/STRIPE_SECRET_KEY=["']?sk_live_/.test(envText)) {
  console.error(
    "REFUSING to start: .env.local contains a LIVE Stripe secret key.\n" +
      "The sandbox must use keys from a Stripe sandbox (sk_test_…) so demo charges are never real.",
  );
  process.exit(1);
}

const SANDBOX_ENV = {
  ...process.env,
  AWS_ENDPOINT_URL_DYNAMODB: "http://localhost:8000",
  DYNAMODB_TABLE_PREFIX: "mathitude-sandbox",
  AWS_ACCESS_KEY_ID: "local",
  AWS_SECRET_ACCESS_KEY: "local",
  AWS_REQUEST_CHECKSUM_CALCULATION: "WHEN_REQUIRED",
  AWS_RESPONSE_CHECKSUM_VALIDATION: "WHEN_REQUIRED",
};

const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      cwd: websiteDir,
      env: SANDBOX_ENV,
      stdio: "inherit",
      ...opts,
    });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} → ${code}`))));
    p.on("error", reject);
  });

const portFree = (port) =>
  new Promise((resolve) => {
    const s = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => s.close(() => resolve(true)))
      .listen(port, "127.0.0.1");
  });

// 1. dynalite (skip if already running)
let dynalite = null;
if (await portFree(8000)) {
  dynalite = spawn("node", ["scripts/dynalite-server.mjs"], {
    cwd: websiteDir,
    env: SANDBOX_ENV,
    stdio: "inherit",
  });
  await new Promise((r) => setTimeout(r, 1200));
} else {
  console.log("[sandbox] port 8000 already serving — reusing that DynamoDB");
}

// 2. tables + seed
await run("node", ["scripts/create-local-tables.mjs"]);
await run("node", ["scripts/seed-local.mjs"]);

console.log("\n[sandbox] Demo data seeded under mathitude-sandbox-*.");
console.log("[sandbox] Starting next dev on :3000 — Ctrl-C stops everything.\n");

// 3. next dev
const dev = spawn("npx", ["next", "dev"], {
  cwd: websiteDir,
  env: SANDBOX_ENV,
  stdio: "inherit",
});
const stop = () => {
  dev.kill("SIGINT");
  dynalite?.kill("SIGINT");
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
dev.on("exit", stop);
