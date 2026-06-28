# Project: operations-and-client-management-platfrom-for-K-12

## Idea
> operations and client management platfrom for K-12 education @stardroplin

— @arichoudhary
[Original tweet](https://x.com/arichoudhary/status/2036554506079707475)

## Instructions
This project was created from a tweet idea. Your job is to turn this idea into a working project.

1. Read the tweet above carefully — it describes what to build
2. Create the appropriate project structure (choose the right language/framework for the idea)
3. Implement the core functionality described in the tweet
4. Add a proper README.md with setup instructions
5. Make sure the code runs and works

## Guidelines
- Keep it simple and focused on the core idea
- Choose modern, well-supported technologies
- Include a working setup (package.json, requirements.txt, etc.)
- Write clean, readable code

## Deploy workflow (non-negotiable)
After any code edit on this repo: **commit + push + `npx vercel --prod --yes`, in that order, without asking.**

**GitHub auto-deploy does not work on this project.** Confirmed Apr 17–18: four pushes to `main` produced zero automatic Vercel builds. The CDN kept serving a build from hours before my first commit and the user thought nothing was shipping. The fix is not "wait longer" or "re-push" — the fix is to run the CLI.

The correct sequence from inside `website/`:
```
git commit -m "…"
git push origin main
npx vercel --prod --yes
```

If something blocks (pre-commit hook, failing build, merge conflict, Vercel build error) figure it out — fix the underlying issue and retry. Push + CLI-deploy is the default, not the exception. Never report a change as "shipped" until the CLI deploy has returned `● Ready` and the canonical alias serves the new commit.

## Working style (learned 2026-06-13 with Paula & Sara)

Goal: idea → shipped in one shot. Fewer round-trips ("hiccups per minute"). These are settled, not suggestions.

- **Generalize, don't one-off.** When Paula points at one instance of a pattern (a lavender panel, a redundant CTA, a verbose label, a punctuation nit), grep the whole codebase for every instance and fix them in one commit. Do not wait to be shown each page.
- **Grasp the goal, not the literal edit.** For visual hierarchy / sizing feedback, reason about the relationship between elements and propose the whole hierarchy at once rather than nudging one element per round.
- **Less is more.** One CTA per section; headers are the links (no header + redundant "Learn more"); cut articles and arrows from link text; cut happy-talk. Applies to docs too — keep additions lean.
- **Visual preferences live in `website/DESIGN.md`** ("Marketing copy + visual rules"). Read it before touching marketing copy, color, or type. Highlights: no lavender (warm taupe `#EFEBE5`), hero = black text with brand word + key noun in `#7030A0`, no auto-popping tours.
- **Deploy then verify, don't ask.** Code edit → commit → push → `npx vercel --prod --yes` → confirm the canonical alias serves it. Batch related edits into one deploy when they arrive together.
- **Surface decisions, act on the obvious.** Only stop to ask when the choice is genuinely Paula's (taste, scope, external sends). Otherwise pick the sensible default and say what you did.
