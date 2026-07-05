#!/usr/bin/env node
// One-time auth capture for the demo recorder. Opens a real browser window;
// you sign in (Clerk) as the account you want demos recorded as, then press
// Enter in this terminal. The session is saved to scripts/demos/auth-<kind>.json
// (gitignored) and reused headlessly by record-demos.mjs.
//
//   npm run demos:auth              # saves auth-admin.json
//   npm run demos:auth -- parent    # saves auth-parent.json
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const kind = process.argv[2] === "parent" ? "parent" : "admin";
const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.DEMO_BASE || "https://website-sage-three-98.vercel.app";
// localhost sessions get their own file so they never clobber the prod one.
const suffix = /localhost|127\.0\.0\.1/.test(BASE) ? ".local" : "";
const dest = join(here, "demos", `auth-${kind}${suffix}.json`);

// Use the real installed Chrome when available — Clerk's bot-protection
// CAPTCHA often refuses to load in Playwright's bundled Chromium, which
// blocks sign-up/sign-in. Fall back to bundled Chromium if Chrome is absent.
const browser = await chromium
  .launch({ headless: false, channel: "chrome" })
  .catch(() => chromium.launch({ headless: false }));
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(`${BASE}/sign-in`);

console.log(`\nSign in as the ${kind.toUpperCase()} account in the browser window.`);
console.log("When you can see the portal, come back here and press Enter…");
await new Promise((resolve) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl.question("", () => {
    rl.close();
    resolve();
  });
});

await context.storageState({ path: dest });
await browser.close();
console.log(`Saved → ${dest}`);
console.log(`Now run: npm run demos`);
