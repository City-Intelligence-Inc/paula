# Demo recorder — videos for the tracker's Visual/example column

One `.webm` screen recording per tracker row, recorded off the live site,
plus `manifest.csv` mapping row IDs to files.

## Three steps

```bash
# 1. One-time: capture a signed-in session (a browser window opens — sign in,
#    then press Enter here). Repeat with `-- parent` for parent-side demos.
npm run demos:auth
npm run demos:auth -- parent

# 2. Record everything (or a subset)
npm run demos
npm run demos -- --only B-4,D-2,R-8

# 3. Upload scripts/demos/out/ to Loom (drag the folder into loom.com/library)
#    or Google Drive, then paste the links into the sheet using manifest.csv.
```

Or let the agent do it: in Claude Code, ask the **demo-videos** agent
("record the demo videos and give me the sheet links") — it runs the
recorder, verifies output, uploads to Drive, and returns a paste-ready
row-ID → link table. It will still ask you to run step 1 once, since Clerk
sign-in needs a human.

## Guarantees

- **Read-only:** scenarios navigate, scroll, hover, and type into forms but
  never submit anything that mutates data. The runner auto-dismisses all
  confirm() dialogs as a backstop.
- `auth-*.json` (your session) and `out/` (recordings) are gitignored.
- Default target is production; `--base http://localhost:3000` records
  against a local dev server instead.

## Adding a scenario

Add an entry to `scenarios.mjs` with the tracker row `id`, a `title`,
`auth` (`"admin"`, `"parent"`, or `null` for public), and a `run(page, base)`
that shows the feature. Keep the read-only rule.
