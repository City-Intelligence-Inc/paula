# Mathitude Portal QA — 2026-07-04 (tracker completion pass)

Rigorous manual test cases for every tracker row shipped 2026-07-04:
R-8, N-6, F-1/F-2, B-2/B-4/B-5/B-6, D-2/D-3, C-1–C-4, C-6–C-10.
Run top to bottom — later sections reuse data created earlier. Same bug-filing
rules and severity levels as `QA_TESTS.md`.

## 0. Environment

- **URL:** https://website-sage-three-98.vercel.app
- **Super admin:** `phamilton@mathitude.com` / `ari@coframe.com` / `nljq16@stanford.edu`
- **Stripe test card:** `4242 4242 4242 4242` · decline: `4000 0000 0000 0002`
- You'll need 2 throwaway email inboxes you can read (call them **P1-mail**
  for a parent, **CG-mail** for a second caregiver).
- Preconditions marked ⚙ need env vars set (see TUTORIAL.md § setup). If the
  var is unset, run the test anyway and confirm the documented fallback.

---

## 1. Inquiry → contact (C-3, C-4, C-2)

**T-INQ-01 — inquiry form captures the full lead.**
Signed out, open `/contact`. Verify fields: name, email, phone, interest,
student info (placeholder asks for *names and grades*), goals textarea, and
fine print mentioning the **mailing list**. Submit with P1-mail as email,
student info "Maya, 4th grade". Expect a success state; expect **no** account
creation (you cannot sign in with that email).

**T-INQ-02 — staff notification.** Check the admin inbox: one email with the
inquiry's name/email/phone/interest/student/message.

**T-INQ-03 — contact profile created with inquiry logged.** As admin →
`/admin/contacts`. The new contact shows source **Inquiry**, name, email,
phone. Expand it: the log contains the inquiry text (interest + student +
goals). ⚙ With Mailchimp configured, row shows "Mailchimp ✓" and the address
appears in the Mailchimp audience; without, no ✓ and no error blocking the
submission.

**T-INQ-04 — response log (C-4).** On the contact, type "Called mom,
scheduling trial session" → **Log response**. Reload: the entry persists with
your email and date, ordered after the inquiry.

**T-INQ-05 — manual contact.** "Add contact" with a made-up name/email.
Source shows **Manual**; log shows "Contact added manually."

**T-INQ-06 — validation.** Submit `/contact` with a bad email → inline error,
nothing saved. POST with a 6000-char message → rejected (400), no crash.

---

## 2. Approve → tokenized invite (C-1)

**T-INV-01 — send invitation from a contact.** On the T-INQ-01 contact click
**Send invitation** → confirm. Expect success message and a log entry
"Approved — portal invitation sent." P1-mail receives an email whose link
looks like `/register?token=…` (NOT a bare `/sign-up`).

**T-INV-02 — pending list.** `/admin/users` → Pending invitations shows
P1-mail as **Parent** with an expiry ~7 days out. **Copy link** puts the full
URL on the clipboard.

**T-INV-03 — revoke kills the link.** Send a second invite to a different
address, revoke it, then open its link → "Invitation not available" error
page with a **Go to sign in** button. (C-1: expired/used/revoked tokens land
on an error/login page.)

**T-INV-04 — token hygiene.** Open `/register?token=garbage` and `/register`
with no token → same error page, no stack trace, no information leak.

---

## 3. Hidden registration (C-9)

**T-REG-01 — email is locked.** Open the T-INV-01 link. The email field shows
P1-mail, is read-only/disabled, and the name/phone/student info from the
inquiry are prefilled. Try editing the email via browser devtools (remove
`disabled`, type another address), submit → the created records still use
P1-mail (server takes the email from the token only). **P0 if not.**

**T-REG-02 — children required for a new family.** Remove all children →
submit → clear error, and the invite is NOT burned (reload the link — the
form still works).

**T-REG-03 — full family registration.** Add two children (name, school,
grade, birthday) and one extra caregiver with CG-mail. Submit → success step
with a **Create your login** button pointing at sign-up. Verify in admin:
family exists with both students (school/grade/birthday saved), parent record
carries P1-mail + phone + relationship; CG-mail received its **own** invite
link.

**T-REG-04 — single-use, strictly.** Open the same link again → "already been
used." Replay the POST (devtools → resend) → 410, no duplicate family.
**P0 if a second family/child row appears.**

**T-REG-05 — caregiver joins the same family.** Complete CG-mail's link: no
children section (existing family); after submit the caregiver appears on the
same family's page, not a new family.

**T-REG-06 — role invites.** From `/admin/users`, invite a tutor and a
student (student invite requires picking a student). Complete both links:
tutor → tutor record active (no duplicate if one already existed with that
email); student → `studentEmail` set on exactly the chosen student.

---

## 4. Card gate (B-5)

**T-CARD-01 — no skip.** Sign up as P1-mail → onboarding payment step. There
is **no** "I'll add a card later" — only the save-card form and the
explainer line. Save `4242…` → advances to done.

**T-CARD-02 — decline path.** With a fresh parent, try `4000 0000 0000 0002`
→ inline Stripe error, still gated (no advance).

**T-CARD-03 — new card replaces old.** As the parent (or admin on the family
page), add a second card `5555 5555 5555 4444`. The payment-methods panel
shows exactly ONE card (the new last-4); Stripe dashboard shows the old one
detached. **P0 if two cards remain.**

---

## 5. Users & offboarding (R-8)

**T-USR-01 — categorization.** `/admin/users` groups: Admins & office staff
(super admin badge vs office staff), Tutors (with student counts), Parents &
caregivers (relationship badges, "no login yet" where applicable), Students
(grade chips). Counts match the underlying pages.

**T-USR-02 — tutor offboard/reactivate.** Deactivate a test tutor → badge
flips to Deactivated; their tutor-portal access stops showing students.
Reactivate → restored.

**T-USR-03 — student offboard.** Mark a test student inactive → they drop
from active rosters and the billing queue; history remains on their page.

**T-USR-04 — office staff removal is master-only.** As a non-master admin,
the Remove button is absent. As master admin, Remove works; bootstrap admins
cannot be removed.

**T-USR-05 — office staff sees no billing (R-4 regression).** As an
office-staff account, `/api/billing/queue` → 403; billing nav pages blocked.

---

## 6. Comments & files (N-6, F-1, F-2)

**T-CMT-01 — thread per completed session.** As tutor on an assigned
student's notes: each past session has its own **Comments**; posting appends
with your name and tutor color. A different session's thread stays empty.
Comments only appear under completed/past sessions — never on the input row
for a future one.

**T-CMT-02 — parent participates, scoped.** As the T-REG parent on `/notes`:
comment on your child's session → appears for staff too (integration-tested;
verify visually). Parents see no Session Plan / Private Notes anywhere
(N-5 regression).

**T-CMT-03 — RBAC negatives (spot-check the itest results live).** Unassigned
tutor → no access to the student's notes at all. Parent POSTing a comment to
another student's session via devtools → 403.

**T-CMT-04 — attachment. ⚙** Paperclip → pick a small PDF → link appears in
the comment text; clicking it renders the PDF **inside the browser via
`/api/files/object?…`** — the URL must not contain `amazonaws.com`. Without
`FILES_S3_BUCKET`: clear "uploads not configured" message, comment still
postable.

**T-FILE-01 — drag-and-drop upload. ⚙** Student page → Shared files → drag a
PDF onto the drop zone. Entry appears; team notification email/log fires
(Admin → Notifications shows "shared a file"). Audience **Family** entries
appear on the family's `/notes`; **Staff only** entries don't. **P1 if a
family sees a staff-only file.**

**T-FILE-02 — no raw AWS URLs (F-2).** For an uploaded file, inspect the
family-side link href and the network tab: everything goes through
`/api/files/object`; response renders inline (PDF viewer, not forced
download). Signed-out request to the same URL → 401/redirect. A parent from a
*different* family requesting it → 403.

**T-FILE-03 — tutor scope.** A tutor not assigned to the student calls
`/api/files/object?...` for that student's file → 403.

---

## 7. Billing math & ledger (B-2, B-4, B-6)

**T-BIL-01 — fractional hours.** Student rate $100/h. Log a completed
45-minute session with no explicit amount → billing queue row = **$75.00**.

**T-BIL-02 — group split.** Group session, 60 min, two students from two
families, total $120 → queue shows two $60 rows, one per family. Odd total
($121.01) → rows differ by exactly one cent and sum exactly.

**T-BIL-03 — payer split.** Session with payers 60/40 across two parents →
two rows at 60%/40% of the total; percentages that don't sum to 100 are
rejected at save time.

**T-LED-01 — deposit drawdown.** `/admin/ledger` → on the T-REG family click
**Record deposit** → 500. Log three completed $200 sessions. Expand the row:
first two sessions (and only those) flagged "covered by deposit"; Deposit
used $500 / left $0; balance = charges − 500 − payments.

**T-LED-02 — banked sessions.** Cancel a scheduled session with 30+ days
notice → ledger Banked count +1 with the session listed. Schedule its makeup
→ count returns to previous.

**T-LED-03 — year boundary.** A session dated before Aug 1 of the current
academic year must not appear in ledger charges.

**T-BIL-04 — history both sides (B-6).** After charging a queue row: parent
sees it on `/dashboard/billing`; staff see it in Admin → Payments and on the
family page. Statement descriptor in Stripe = MATHITUDE (B-3 regression).

---

## 8. Schedules (D-2, D-3)

**T-SCH-01 — tutor copies own week only.** Seed: tutor A has 2 sessions last
week, tutor B has 1. As tutor A → **Copy last week** → confirm → "2 copied".
This week now has A's two sessions as *scheduled*; B's session did NOT copy.

**T-SCH-02 — idempotent.** Click again → "0 copied, 2 already on the books";
no duplicates anywhere. **P0 if duplicates appear.**

**T-SCH-03 — exclusions.** A cancelled session and a session-note row from
last week never copy forward.

**T-SCH-04 — admin copies all.** As admin on `/admin` → Copy last week →
both tutors' sessions copy (minus already-existing ones).

**T-DSH-01 — command deck (D-3).** `/admin` top cards show: today's session
count (log one today and watch it increment), pending billing approvals
(matches queue length), and recent payment-method updates — save a new card
on a family (T-CARD-03) and see it logged; acknowledge clears it.

---

## 9. Profiles & rollover (C-7, C-8, C-6, C-10)

**T-PRO-01 — link student to family by parent search (C-7).** On an orphan
student's page → Family card → type 2 letters of a parent's name → pick →
"Linked" message; family page now lists the student. Rate + primary payer
editable on the same page (C-5/B-1 regression).

**T-PRO-02 — attach student by search (C-8).** On a family page → "Attach an
existing student…" → search a student who's in another family → warning
prompt → confirm → student moves (no duplicate row, old family loses them).

**T-PRO-03 — card info on family page (C-8).** Family page shows per-parent
"Card on file ✓" / last-4 via the payment panel, and the family's session
history table.

**T-ROLL-01 — grade rollover (C-6).** As admin:
`fetch("/api/cron/advance-grades", {method:"POST"})` from the console.
Response lists advanced students; spot-check: active 4 → 5, 12 → UG1,
UG4 → GRAD, GRAD/OTHER unchanged, **inactive students unchanged**.

**T-ROLL-02 — cannot double-run.** POST again without force → `skipped:true`
and no grades moved. With `{"force":true}` → runs again (grades +1 more —
use test data!). Unauthenticated GET without the cron secret → 401.

**T-CON-01 — contract (C-10).** On a family page paste a PDF URL (S3 form
`s3://…` ⚙, or any https PDF) into Signed contract → Save. As that family's
parent: **Contract** tab renders the PDF in-page. As a parent of a
*different* family: their tab shows "No contract on file" — never someone
else's contract. **P0 if cross-family.**

---

## 10. Contacts scope (C-2 × R-5)

**T-SCP-01 — tutor contact scoping.** As a tutor assigned to family X (and
not Y): `/api/admin/contacts` returns only X's contacts, and those rows have
**empty email/phone and an empty log**. Admin sees everything. **P0 if a
tutor receives any parent email/phone.**

---

## Automated coverage (run before the manual pass)

```
cd website
npm test                      # 247 unit tests — billing splits, grade ladder,
                              # S3 URL parsing, notes visibility, makeup rules
npm run db:local              # separate shell
npm run test:integration      # 25 RBAC/persistence tests: note writes, N-5
                              # replies, N-6 comments — real DynamoDB (dynalite)
```

Both suites green as of commit this file ships in.

---

## 11. Added 7/5 — hard offboarding, self-hosted mailing list, contact removal

**T-DEL-01 — hard-delete student (R-8, super admin only).** Create a throwaway
student with a few sessions. As a non-master admin, `DELETE /api/students/<id>`
→ 403. As master admin → 200 with `deletedSessions` count; student gone,
their session rows gone, **payment rows retained**. **P0 if payments vanish.**

**T-DEL-02 — hard-delete family refuses while students attached.** On a family
with a student, `DELETE /api/families/<id>` → 409 with a clear message. Move
or delete the student, retry → 200; caregiver rows removed; Stripe customer
still exists in Stripe (financial record).

**T-DEL-03 — contact removal.** Add a contact, then
`DELETE /api/admin/contacts?email=…` → 200; row gone from `/admin/contacts`
and from future broadcasts. Non-admin → 403. Unknown email → 404.

**T-MAIL-01 — self-hosted mailing list (replaces Mailchimp).** Submit the
inquiry form → contact appears with an unsubscribe token **that never appears
in any API response** (inspect the GET payload — `unsubToken` must be absent;
**P0 if present**). Send a broadcast from the admin mailing-list UI → contact
receives it with a working one-click unsubscribe link; after unsubscribing
they're excluded from the next broadcast.

**T-MAIL-02 — Aug-1 cron without CRON_SECRET.** The grade-advance cron no
longer requires `CRON_SECRET`; confirm the route still refuses plain
unauthenticated browser GETs (check its current auth guard) and that a manual
admin POST works as in T-ROLL-01/02.

**T-E2E — full-task demo recordings double as end-to-end tests.**
`npm run demos -- --tasks` runs four self-verifying workflows against the
live site (R-8-full invite lifecycle, C-1-C-9-full invite→register→offboard,
B-4-full deposit drawdown, C-2-full contact lifecycle). Each asserts every
step and cleans up its own demo data; a FAILED row in `manifest.csv` is a
real regression.
