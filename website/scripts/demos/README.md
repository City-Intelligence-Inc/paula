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

## Full-action videos

Two tiers beyond the read-only tours:

**Task videos (prod-safe):** `npm run demos -- --tasks` performs real
workflows on the live site using only demo data it creates and hard-deletes
before the recording ends (invite lifecycle, invite→registration→offboard,
deposit drawdown, contact lifecycle). Every step is asserted — a FAILED row
in `manifest.csv` is a genuine regression (this caught a real prod bug in
the student hard-delete on 2026-07-05).

**Sandbox videos (everything else):** the destructive flows — actually
copying a week, actually charging a card, running the grade rollover — are
`sandboxOnly` and the runner refuses them on any non-localhost base. Film
them against the sandbox stack (modeled on Stripe's sandbox guidance):

```bash
# one time: real env, then swap in Stripe SANDBOX keys (Dashboard → Sandboxes)
cd website && npx vercel env pull .env.local   # then edit the two Stripe keys

npm run sandbox                                # dynalite + seeded data + next dev :3000
DEMO_BASE=http://localhost:3000 npm run demos:auth      # sign in once (saved separately)
npm run demos -- --tasks --base http://localhost:3000   # records EVERYTHING incl. sandbox-only
```

`sandbox.mjs` refuses to start if `.env.local` still holds a live Stripe
key, and all data lives in-memory under a `mathitude-sandbox` prefix — gone
on Ctrl-C, no way to touch production tables.

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
