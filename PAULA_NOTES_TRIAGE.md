# Paula 5/9 Notes — Meticulous Triage

Status as of 2026-05-09. Every ask in Paula's 5/9 notes (and the embedded 5/2 sub-section), mapped to current code state, with exact deltas and dependencies. Items already covered by `infra/SCHEMA.md` are flagged so we don't double-count.

Legend:
- ✅ shipped — already in main + production
- 🟡 partial — code/schema exists, but not fully wired or productized
- 🟢 quick win — small surface-level change, < 1 hr
- 🔵 schema-ready — covered in SCHEMA.md, awaiting implementation
- ⚫ greenfield — no prior plan, needs design
- ❓ blocked — needs Paula/Sara input or external asset

---

## A. Random thoughts (resource library + whiteboard + product picks)

### A1 — Library of resources (links, no copy/paste)
Status: ⚫ greenfield. The site has `/free-resources` (parent-facing) but no internal admin-tutor-shared library.
Proposal:
- New entity `Resource` already exists (`backend/src/lib/types.ts:52`, `Tables.resources`) — currently used for the public free-resources page. Promote to internal use:
  - Add `audience: "tutor" | "parent" | "both"` field
  - Add `gradeMin`, `gradeMax` (numbers 0–13 where 13=college)
  - Add `progression?: { topic: string, order: number }` for future progression paths
- New admin page `/admin/library` — list, search, filter by grade/topic, "copy link" button
- Link rendering on tutor session-notes UI: clickable inline link insert
Effort: M (UI page + 2 schema fields + API).
Dependencies: needs Paula's seed list of links + which textbooks/resources qualify as "standard."

### A2 — Custom shared whiteboard (replace Miro)
Status: ⚫ greenfield. Big build.
Proposal: defer. Recommend continuing Miro for now and revisiting in Phase 5 once core ops platform is stable. If we DO build it, the realistic shape is: one whiteboard URL per session, auto-stamped into the session notes Col B equivalent. Stack: tldraw (Apache-2.0) self-hosted in the Vercel app; persist canvas JSON in `Session.whiteboardSnapshot` (DDB JSON column).
Effort: L (~2-3 weeks for an MVP that matches Miro's basics).
Dependencies: budget decision; Paula's "must-haves" for the whiteboard (multi-color pens? math-grid background? shape stamps?).

### A3 — Standard notes/instructions in the resource library
Status: ⚫ greenfield (subset of A1).
Implementation: just rows in the same `Resource` table with `audience="tutor"` + a `category="instructions"` tag. Big Ideas textbook access lives here.
Effort: trivial once A1 ships.

### A4 — Method to add resources + grade ranges + progression paths
Status: ⚫ greenfield (subset of A1).
Add UI: `/admin/library/new`. Schema covered in A1.
Progression-path UI: phase 2 of the library. Could be a Kanban-style or sequential list per topic. Defer.

### A5 — Recommended home products (Amazon links)
Status: ⚫ greenfield. Distinct from A1 (different audience, different metadata).
Proposal: new entity `Product`:
- `id, title, description, amazonUrl, vendor, gradeMin, gradeMax, productCategory, status: "trying" | "recommended" | "rejected", notes, addedAt`
- Admin page `/admin/products` — list, filter, "share link" button that surfaces the Amazon URL
- Parent-facing read-only page `/dashboard/recommended-supplies` (gated to enrolled families)
Effort: M.
Dependencies: 3-student remote family is enrolling next fall — confirm timeline so we know hard deadline. Get Paula's current Amazon order history (or screenshots) for seed data.

---

## B. Landing-page asset + copy changes

### B1 — Swap Emma photo for Raife/Cara jumping pic
Status: 🟢 quick win.
File: `website/src/components/sections/hero.tsx:69`
Current: `src="/photos/bucky_emma2.jpg"`
Change: `src="/photos/bucky_raife_cara3.jpg"` (asset already in `public/photos/`).
Effort: 1 line.

### B2 — Replace Yuma pic with Avni pic
Status: 🟢 quick win.
File: `website/src/components/sections/hero.tsx:59`
Current: `src="/photos/bucky_yuma1.jpg"`
Change: `src="/photos/bucky_avni1.jpg"` (asset already in `public/photos/`).
Effort: 1 line.

### B3 — Add video snippet from BUCKY_BALL_PHOTOS folder
Status: ❓ blocked. Asset isn't in repo (`public/photos/` has no .mp4/.webm).
Action: get the source from Paula's Drive `BUCKY_BALL_PHOTOS` folder. Once received, transcode to web-optimized MP4 + WebM, drop in `public/photos/`, render via `<video autoPlay muted loop playsInline>` in a new `Hero` slot.
Effort: M once the asset arrives.

### B4 — Lower-left bullet list + 2 CTA buttons (Request a Consultation + Learn More)
Status: 🟡 partial. Two CTAs exist but the "Learn More" one currently reads "See all offerings →" and there's no bullet list to the left of the photos.
Files:
- `website/src/components/sections/hero.tsx:38-51`
Changes:
1. Add a new bullets block above the CTA row, listing the items shown on the follow-up page (`/tutoring`). Source the list from `tutoring/page.tsx` to keep them in sync.
2. Rename CTA button text:
   - "Request a consultation" → "Request a Consultation"
   - "See all offerings →" → "Learn More"
3. Apply ALL CAPS to the purple primary CTA per B5.
Effort: 30 min.
Dependencies: confirm with Paula which of the 6 offerings she wants bulleted (likely all 6).

### B5 — All purple buttons across the website should be ALL CAPS
Status: 🟡 partial — purple buttons exist but aren't uppercased.
Audit (locations using `bg-[#7030A0]`):
- `website/src/components/sections/hero.tsx:41` — "Request a consultation"
- `website/src/app/contact/page.tsx:222` — "Send to Mathitude"
- `website/src/components/sections/cta-banner.tsx` — primary CTA (need to check)
- `website/src/components/sections/services.tsx` — service-card CTAs (need to check)
- `website/src/app/admin/billing/page.tsx:209` — "Approve & charge" (admin, but still purple)
- `website/src/app/admin/settings/stripe/page.tsx:280` — "Save"
Change: add `uppercase tracking-wide` Tailwind utility to each.
Effort: 15 min global pass with a grep + edit.
Note: per-memory rule (`feedback_styling_kit.md`), this is now durable — any future purple button must be ALL CAPS.

---

## C. Consultation page copy + form changes

### C1 — Replace first sentence
Status: 🟢 quick win.
File: `website/src/app/contact/page.tsx:243-247`
Current: "Tell us a little about your student and what you're hoping for. Mathitude reads every note and will reach out to schedule a free conversation about the right next step."
Change: split into the two sentences Paula provided:
1. "Tell us a little about your student and your math engagement objectives."
2. "Mathitude will reach out to schedule a free consultation."
Effort: 2 lines.

### C2 — Address: 770 Menlo Ave
Status: 🟢 quick win.
File: `website/src/app/contact/page.tsx:292-294`
Current:
```
770 Menlove Suite 200A
Menlo Park, CA
Professional building, one block from Trader Joe's
```
Change: "770 Menlo Ave" — but Paula didn't say drop suite/city. Recommend keeping suite + city for clarity:
```
770 Menlo Ave, Suite 200A
Menlo Park, CA
```
Effort: 1 line.
Dependencies: confirm with Paula whether to keep "Suite 200A" + "one block from Trader Joe's" footnote.

### C3 — Make Student Info section required
Status: 🟢 quick win.
File: `website/src/app/contact/page.tsx:178-191`
Current: `placeholder="Grade, school, or anything else useful"`, label says "Student info (optional)", input has no `required` attr.
Change:
- Label: drop `(optional)` → "Student info"
- Add `required` to the `<input>`.
- Update API validator at `website/src/app/api/consultations/route.ts` to reject empty `studentInfo`.
Effort: 5 lines.

### C4 — Email Paula when consultation form is submitted
Status: 🟡 partial. Form writes to DDB but does NOT send a notification email.
Inspection needed: read `website/src/app/api/consultations/route.ts` to confirm.
Proposal: integrate Resend or AWS SES (the latter aligns with existing AWS account):
- New env var `MATHITUDE_NOTIFICATION_EMAIL` (Paula's preferred address)
- After DDB write, fire-and-forget `ses.sendEmail` w/ the form fields rendered as a simple HTML table
- Subject: `New consultation request — {studentName or name}`
Effort: S (~1 hr) once we pick the provider.
Dependencies: ask Paula which email to send to + confirm SES domain identity ownership.

### C5 — Database access (GUI? SQL? Agentic?)
Status: ⚫ greenfield (architectural decision).
Recommendation: three layers:
1. **Admin portal** (already exists) — primary GUI for non-technical day-to-day data work (Students, Families, Sessions, Payments, Consultations).
2. **Export-to-CSV** buttons on each admin list page — single-click extracts. Add to `/admin/students`, `/admin/families`, etc. Effort: S per page.
3. **Agentic query** — a `/admin/ask` page that takes natural-language questions ("show all overdue families this month") and uses Claude + a constrained DDB query layer to answer. Phase-4 work; defer until we see what queries Paula actually asks repeatedly.
DynamoDB itself doesn't have SQL; we should NOT expose raw DDB. AWS Athena can query DDB exports if she ever wants ad-hoc SQL — flag as future option.

---

## D. 5/2 schema items — already in SCHEMA.md

These were Paula's 5/2 reflections re-pasted into the 5/9 doc. Status against `infra/SCHEMA.md`:

### D1 — Two-tier notes (Excel Col J private + Col B GSheet client-facing)
Status: 🔵 schema-ready (`SCHEMA.md:160-165`). `Session.privateNotes` is in the schema. **Not yet enforced in API:** the parent-facing endpoints currently return the full row including `notes` — we need to strip `privateNotes` for non-admin callers.
Action item: middleware/projection function in the sessions route. Effort: S.

### D2 — Cross-family + same-family joint sessions
Status: 🔵 schema-ready (`SCHEMA.md:167-171`).
- Same-family (Thompson + Timmy): supported via `students[]` array. ✅
- Cross-family (Jeremy + Yuma): proposed `Session.familyBillingSplits[]` — NOT yet implemented in routes.
Action items:
1. Add `familyBillingSplits` field to `Session` type (`website/src/lib/types.ts`)
2. In `/api/billing/approve` (Phase 3 route), respect splits when creating PaymentIntents — issue one charge per family at the split amount
3. In `/admin/billing`, render the split as two queue rows linked by `sessionGroupId`
Effort: M.

### D3 — Pricing differs per family / per student / per tutor
Status: 🔵 schema-ready (`SCHEMA.md:173-176`). `Session.rate` is the snapshot at billing time. ✅ for the "actual charged amount" path.
**Missing:** the rule for resolving the rate at session-creation time. Today, the rate is whatever Paula types in the session row.
Action item: optional `PricingRule` table — `{familyId?, studentId?, tutorId?, offering?, rateCents}` with priority resolution. Defer until Paula asks for "set it once and forget it."
Effort: M (deferred).

### D4 — Add new "products" to Stripe (parent ed, STEM fairs, family advising, speaking)
Status: 🔵 schema-ready (`SCHEMA.md:178-183`). `Session.offering` enum exists; the Phase 3 charge code respects it.
**Missing:** UI to create non-tutoring sessions (e.g. a "Speaking engagement" charge that isn't tied to a student).
Action items:
1. New `Engagement` admin page or `/admin/billing/new` form for one-off, non-session charges (target: family OR a custom counterparty name + email)
2. Stripe products mapping — currently we send `metadata.offering` but don't use Stripe's Products feature; could add Product/Price IDs per offering for clean dashboard reporting. Defer.
Effort: S for the one-off charge form, M for full Stripe Products integration.

### D5 — Wix pages Sara was developing
Status: ❓ blocked. We don't have access. Per `SCHEMA.md:231` this is an open ask.
Action: Paula or Sara to share the Wix workspace URL or PDFs of the pages.

### D6 — Walk-through of a typical day
Status: ❓ blocked. Schedule a working session with Paula. This is the highest-leverage discovery item left.
Owner: Ari to schedule.

### D7 — Ignore Excel cols A, C, I and past J
Status: ✅ already encoded in import script (`SCHEMA.md:202-205`, `backend/scripts/import-master.ts`). Confirm next time we run a fresh import.

### D8 — Secure store for student school login details (ghost-student tracking)
Status: 🔵 schema-ready (`SCHEMA.md:189-196`). `Student.schoolLoginsRef` proposed → AWS Secrets Manager.
**Missing:** implementation. Currently no UI, no Secrets Manager wiring.
Action items:
1. Add `Student.schoolLoginsRef` write path
2. New IAM policy permissions for SecretsManager get/put on a per-student secret
3. Admin-only UI drawer on `/admin/students/[id]` — "School logins" with reveal-on-click, audit logged
Effort: M (~1 day). High importance — this is sensitive data.
Note: now that we've shipped the `mathitude-secrets` DDB table for portal-managed Stripe keys, we have a working pattern. We can either reuse the same table (with `id=student-logins-<studentId>`) or, better, use Secrets Manager as originally planned for actual credentials. **Strong recommendation: Secrets Manager**, because (a) school passwords change more often than API keys and SM has rotation primitives, (b) per-secret IAM lets us audit exactly which admin viewed which student's password.

### D9 — Don't capture Steve as historical tutor
Status: ✅ already in import (`SCHEMA.md:198-200`). Sessions get `tutorId = tut_paula` with a flag note.

---

## E. Phase 3 follow-ups (in-flight, not yet polished)

### E1 — Provision `mathitude-staging-secrets` table
Status: ✅ shipped today (created + SSE + PITR enabled).

### E2 — `requireAdmin()` is currently permissive
Status: ✅ intentional, today's change. Tighten before parents/external tutors sign up.
Action item: revisit when Phase 4 (parent portal) starts. At that point: switch back to role-checking + ADMIN_CLERK_USER_IDS allowlist.

### E3 — Stripe webhook needs the live URL registered in Stripe dashboard
Status: 🟡 partial. The `/api/stripe/webhook` route exists but Paula needs to register the URL in her Stripe dashboard once she logs in. The Settings → Stripe page already auto-fills the URL string for her to copy.

### E4 — Approval queue needs sample data
Status: 🟡 the queue route works, but right now the staging DDB has zero `status=completed` sessions. To demo, we either:
1. Run the import script against real Excel data and mark a handful as completed, OR
2. Manually `PutCommand` 2-3 fake completed sessions before the meeting.
Recommend option 1 if the import is ready; option 2 if not.

---

## F. Open questions for the next Paula meeting

Numbered for easy reference:

1. **Resource library seed** — can you send 10-20 of the most-reused links / textbook URLs / standard instructions you'd want pre-loaded?
2. **Whiteboard** — is replacing Miro a hard requirement, or a nice-to-have? If the current $X/mo isn't painful, defer until Phase 5.
3. **Recommended-supplies hard deadline** — when does the 3-student remote family start? That sets the deadline for E2/A5.
4. **Notification email** — which address should consultation submissions go to? Same as `info@mathitude.com` or your personal?
5. **Address line** — keep "Suite 200A", drop it, or change entirely to "770 Menlo Ave"?
6. **Wix mockups** — share access or walk us through them. Without these, every UI decision is guesswork.
7. **Cross-family billing math** — for Jeremy + Yuma at $337.50, who pays what fraction? Equal split, or one family invited the other and pays more?
8. **Tutor onboarding** — which tutor are you onboarding next, and at what rate? Determines when D3 (per-tutor rate rule) becomes urgent.

---

## G. Priority for the next 1-2 weeks

Recommended order, given Paula's meeting today gave us the Stripe key:

1. **Today/this week**: B1, B2, B5, C1, C2, C3 — quick wins. Visible polish for Paula's next look.
2. **This week**: C4 (consultation email notification) — closes a real operational gap.
3. **Next week**: D8 (school-login Secrets Manager) — high security value, blocking expansion.
4. **Next week**: D2 (cross-family billing splits) — closes a known billing edge case.
5. **Next 2 weeks**: D1 (private-notes projection) — privacy guardrail before parents log in.
6. **Schedule before Phase 4**: D6 (typical-day walkthrough). Highest discovery leverage.

Items A1–A5 (resource library + products) are bigger and should land after the operational platform is fully reliable. Items A2 (whiteboard) and B3 (video) are blocked or large enough to defer.
