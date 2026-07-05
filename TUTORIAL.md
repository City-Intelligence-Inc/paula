# Mathitude Portal Tutorial — every tracker feature, step by step

Covers all rows shipped through 2026-07-04 (R-8, N-6, F-1/F-2, B-2/B-4/B-5/B-6,
D-2/D-3, C-1–C-4, C-6–C-10). Written for the team: Paula (super admin),
office staff, tutors, and for walking parents through their side.

**Live site:** https://website-sage-three-98.vercel.app
**Admin portal:** `/admin` · **Tutor portal:** `/tutor` · **Parent dashboard:** `/dashboard`

---

## One-time setup (super admin)

Three features wait on environment variables in Vercel (Settings → Environment
Variables on the `website` project). Everything else works with no setup.

| Variable | Turns on | Without it |
|---|---|---|
| `FILES_S3_BUCKET` | Drag-and-drop uploads to AWS (F-1) | Link-sharing still works; upload zone explains it's off |
| `MAILCHIMP_API_KEY` + `MAILCHIMP_AUDIENCE_ID` | Contact → Mailchimp sync (C-2) | Contacts still save; sync silently skips |
| `CRON_SECRET` | Aug-1 grade rollover cron auth (C-6) | Cron calls are rejected — **set before Aug 1** |

After adding a variable, redeploy (`npx vercel --prod --yes` from `website/`).

---

## 1. The lead-to-family pipeline (C-3 → C-4 → C-2 → C-1 → C-9 → B-5)

This is the full onboarding flow, end to end.

**A prospective family inquires (C-3).**
They visit `/contact`, fill in name, email, phone, student name(s) and
grade(s), and goals. The fine print tells them they're joining the mailing
list. Submitting does NOT create an account.

**You hear about it (C-4).**
Office staff + super admin get an email per submission. The inquiry also
appears in **Admin → Contacts** with the full form contents in the profile log,
and in **Admin → Consultations**.

**The contact record (C-2).**
**Admin → Contacts** is the master list of every lead and customer — inquiry
submissions, manual adds ("Add contact"), and completed registrations. Each
profile logs the inquiry plus every staff response you record ("Log response" —
use it for call summaries, emails sent, decisions). If Mailchimp is configured
you'll see "Mailchimp ✓" per contact. Tutors see only contacts for families
they serve, with emails/phones/logs hidden (R-5).

**Approve → invite (C-1).**
On the contact, click **Send invitation**. This emails the parent a personal
registration link that is:
- single-use — dies the moment the form is submitted
- 7-day expiry — after that the link shows an error page with a path to sign-in
- carries their name/phone/student info forward so they don't retype it

Manage all invitations under **Admin → Users**: pending list shows expiry,
**Copy link** (if the email didn't land), and **Revoke**.

**The family registers (C-9).**
The link opens `/register`. Their **email is read-only** — locked to the
address you invited; nothing they do can change it. They add:
- their own details (phone, relationship)
- each child: name, school, grade, birthday
- other caregivers — each caregiver gets their own single-use invitation
  automatically when the form is submitted

**Card gate (B-5).**
After registering they create their login (Clerk sign-up with the same email)
and land on onboarding, where **saving a card is required — there is no
"skip" anymore**. Saving a new card later automatically detaches the old one
in Stripe, so there's never a duplicate-card or wrong-default problem.

---

## 2. Users & roles (R-8)

**Admin → Users** shows everyone, grouped: Admins & office staff, Tutors,
Parents & caregivers, Students. From here you can:

- **Invite anyone by email** — pick the role (Parent / Tutor / Office staff /
  Student) at invite time. Student invites are linked to an existing student
  record so their login only ever sees their own data.
- **Offboard safely:**
  - Tutor → **Deactivate** (history stays, access ends; reactivate anytime)
  - Student → **Mark inactive** (drops out of rosters and billing)
  - Office staff → **Remove** (master admin only)
  - Caregivers → removed from their family page (primary payers must be
    reassigned first — the system refuses otherwise)

---

## 3. Session notes: comments & files (N-6, F-1, F-2)

**Comments (N-6).** Under every *completed* session's note — on the staff
board and the parent view — there's a **Comments** toggle. Staff, tutors, and
the family share one thread per session; names and role colors are assigned
server-side. Scheduling doesn't happen here; it's discussion about the session.

**Attach a file to a comment.** Click the paperclip, pick a file. It uploads
(to S3 when configured), registers as a family-visible shared file, and drops
a clickable link into your comment. Parents can attach too — only for their
own child.

**Shared files (F-1).** On a student's admin or tutor page, the **Shared
files** panel now has a drag-and-drop zone: drop a file → it goes straight to
AWS storage → the team gets an automatic notification. You can still paste
Drive/Dropbox links. Audience per entry: **Family** (shows on the family's
`/notes` page) or **Staff only**.

**Viewing files (F-2).** Files stored in S3 are served *through the portal* —
PDFs open inline and the raw AWS URL never reaches the browser. Family-facing
links are rewritten automatically; access checks run on every request (staff
always, tutors only for assigned students, families only their own
family-audience files).

---

## 4. Billing (B-2, B-4, B-6)

**Fractional hours & splits (B-2).** Log a session with any duration — a
45-minute session bills 0.75 × the hourly rate. Group sessions split the
total evenly across attending families (pennies never lost). Divorced-parent
or school-share cases: set explicit payer percentages on the session; the
billing queue expands them into per-payer charges. Statement descriptor is
always MATHITUDE (B-3).

**Family ledger (B-4).** **Admin → Family Ledger** shows one row per family:
- **Deposit** — click to record (defaults to $500)
- **Deposit used / left** — drawn down against the year's first sessions, in
  order; click the row to see exactly which sessions the deposit covered
- **Banked** — cancelled-with-notice sessions still owed as makeups
- **Charges / Payments / Balance** for the academic year (from Aug 1)

**Billing history (B-6).** Parents: `/dashboard/billing`. Staff: Admin →
Payments (all), or any family page (per family, with card-on-file status).

---

## 5. Schedules (D-2, D-3)

**Copy last week (D-2).** On the tutor portal's "Next 7 days" card — and on
the admin Weekly Schedule — **Copy last week** duplicates last week's sessions
into this week as *scheduled*. Tutors copy only their own sessions; admins
copy everything. Safe to click twice: existing sessions are skipped, never
duplicated. Cancelled sessions and notes don't travel forward.

**Command deck (D-3).** The top of `/admin` answers "what needs me today":
today's session count, pending billing approvals, and recent payment-method
updates (with acknowledge). No menu-digging.

---

## 6. Profiles (C-7, C-8, C-5) and grade rollover (C-6)

**Student profile (C-7).** On any student page, the **Family** card has an
instant parent search — type a parent's name to link the student to that
family. Students and parents are separate records joined by IDs, so siblings
and multi-guardian households never duplicate anyone. Rate (hourly, C-5) and
primary payer are edited here too.

**Family/parent profile (C-8).** On any family page: instant **student
search** to attach an existing student (moves them; warns if they're already
in another family), card-on-file per parent with last-4 via the payment-methods
panel, and the family's full session history.

**Grade rollover (C-6).** Every August 1 a scheduled job advances every
*active* student one grade (PK→K→1…→12→UG1…→UG4→GRAD; GRAD/OTHER never move).
It can never double-run in a year. Admins can trigger it manually:
`POST /api/cron/advance-grades` (add `{"force": true}` to re-run after a fix).
The result is logged in Admin → Notifications.

**Contract (C-10).** On a family page, paste the signed contract's location
(S3 URL or share link) into **Signed contract**. Parents then get a
**Contract** tab on their dashboard that displays the PDF inside the portal.

---

## 7. Where things live (for Nikki)

| Feature | Key code |
|---|---|
| Invites (C-1) | `src/lib/server/invites.ts`, `/api/admin/invites`, `/api/register(/validate)` |
| Registration (C-9) | `src/app/register/page.tsx` |
| Users (R-8) | `/admin/users` + `/api/admin/users` |
| Contacts (C-2/C-4) | `src/lib/server/contacts.ts`, `/admin/contacts`, `/api/admin/contacts` |
| Ledger (B-4) | `/admin/ledger` + `/api/admin/ledger` (reuses `lib/billing.ts` splits) |
| Copy week (D-2) | `/api/sessions/copy-last-week` |
| Grade cron (C-6) | `website/vercel.json` + `/api/cron/advance-grades`, `advanceGrade()` in `lib/grades.ts` |
| Files (F-1/F-2) | `lib/server/s3.ts`, `/api/files/presign`, `/api/files/object`, `shared-files-panel.tsx` |
| Comments (N-6) | `lib/server/session-notes-core.ts`, `comment-thread.tsx` |
| Contract (C-10) | `/api/me/contract`, `/dashboard/contract` |

Tests: `npm test` (247 unit) · `npm run db:local` then `npm run test:integration`
(25 RBAC/persistence tests against local DynamoDB).
