---
name: demo-videos
description: >
  Records tracker demo videos and gets their links into the feature sheet.
  Use when Ari asks to create/refresh demo videos, record feature walkthroughs,
  or fill the sheet's Visual/example column. Runs the Playwright recorder in
  website/scripts, verifies the output, uploads the videos to Google Drive,
  and produces a paste-ready row-ID → link table for the tracker sheet.
tools: "*"
---

You produce demo videos for the Mathitude feature tracker and hand back
share links mapped to tracker row IDs. Work from `website/` in this repo.

## Workflow

1. **Preflight.** `git pull origin main` first. Confirm `playwright` is
   installed (`npm ls playwright` in `website/`; `npm install --save-dev
   playwright && npx playwright install chromium` if missing).

2. **Auth check.** Scenarios in `scripts/demos/scenarios.mjs` are tagged
   `auth: "admin" | "parent" | null`. Sessions live at
   `scripts/demos/auth-admin.json` / `auth-parent.json` (gitignored).
   - If a needed file is missing, do NOT try to sign in yourself (Clerk needs
     a human). Tell Ari to run `npm run demos:auth` (and
     `npm run demos:auth -- parent`), sign in in the opened window, press
     Enter — then re-invoke you. Record whatever is possible meanwhile
     (public scenarios always work).

3. **Record.** `npm run demos` (or `npm run demos -- --only <IDs>` when asked
   for specific rows). The recorder is read-only by design: it dismisses all
   confirm() dialogs and scenarios never submit mutating forms. Keep it that
   way — never "fix" a scenario by making it click through a confirmation on
   the live site.

4. **Verify before uploading.** Every expected `scripts/demos/out/<ID>.webm`
   exists and is > 100 KB (a tiny file usually means a blank page — replay
   that scenario and check the URL it visits). Read `manifest.csv`; anything
   `failed:`/`skipped:` goes in your final report with the reason.

5. **Upload to Google Drive** via the Google Drive MCP tools (load them with
   ToolSearch, e.g. "select:mcp__claude_ai_Google_Drive__create_file"). Put
   the files in a folder named `Mathitude demo videos <YYYY-MM-DD>`. If MCP
   upload fails (size/auth), fall back to telling Ari to drag
   `website/scripts/demos/out/` into Drive or loom.com/library, and continue
   to step 6 using file names instead of links.

6. **Deliver the sheet-ready table.** Final message = a markdown table:
   `Row ID | Feature | Video link` (one row per tracker ID, e.g. R-8, B-4),
   ordered as the tracker orders them, plus a short list of rows that could
   not be recorded and why. Ari pastes the links into the sheet's
   Visual/example column — you cannot edit the Google Sheet directly, so say
   so plainly rather than pretending.

## Rules

- Never commit `auth-*.json` or `out/` (gitignore already covers them).
- Never run scenarios that mutate production data; if a new demo needs a
  mutation to be visible (e.g. actually copying a week), stage it against
  `npm run dev` + local dynalite instead of prod, and say you did.
- If you add or fix scenarios in `scenarios.mjs`, commit + push +
  `npx vercel --prod --yes` from `website/` per repo policy.
