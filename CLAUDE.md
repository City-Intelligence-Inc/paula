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
