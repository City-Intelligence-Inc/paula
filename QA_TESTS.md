# Mathitude Portal QA — 2026-05-24 (pass 2)

Test suite covering the 5/17 spec work shipped today: billing Save Changes,
master admin portal, multi-guardian model, post-session form, marketing copy
fixes, design system rollout, families/new fix, session lead, asterisks +
form validation, extended grade levels, landing video slot, consultation
admin view, dashboard ↔ admin cross-links. Run through in order; each
section is self-contained.

---

## 0. Test environment

- **URL:** https://website-sage-three-98.vercel.app
- **Test accounts:**
  - Admin: any of `phamilton@mathitude.com`, `ari@coframe.com`, `nljq16@stanford.edu` (bootstrap), or an email added via `/admin/admins`
  - Parent: any signed-in non-admin Clerk user
- **Stripe test card:** `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP
- **Decline card:** `4000 0000 0000 0002` (use to test invalid-card error path)
- **Browser:** Chrome latest. Spot-check Safari for the comparison board.

### Filing bugs

For each failure, capture:
1. Test ID (e.g. `T-BILL-03`)
2. Browser + URL where it broke
3. Steps to reproduce (copy from the test if exact match)
4. Expected vs actual
5. Screenshot
6. Network tab response if the failure was an API error (status code + body)

Severity:
- **P0** — blocks Paula's daily ops (can't bill, can't log session, can't add a family)
- **P1** — wrong data shown, wrong behavior on a happy-path action
- **P2** — visual/copy bug, edge case, polish

---

## 1. Marketing pages (smoke — should be unbroken)

### T-MKT-01 — `/tutoring/private` has no waitlist section
1. Open https://website-sage-three-98.vercel.app/tutoring/private (signed out is fine)
2. Scan the page top to bottom
3. **Expected:** No section titled "Waitlist" or any reference to a waitlist. The page goes Hero → In-person & virtual → Solo & small group → Pre-K through college → Enrichment & academic support → "Curious about small group classes?" → "Ready to get started?"

### T-MKT-02 — `/tutoring/private` "Enrichment" section has no 60-40 split
1. Open `/tutoring/private`, scroll to "Enrichment & academic support"
2. **Expected:** Body talks generally about blending enrichment with academic support. **No** "60%/40%", "60-40 split", or specific percentages.

### T-MKT-03 — `/tutoring/camps` title says "An Exciting Adventure"
1. Open `/tutoring/camps`
2. Scroll past the hero to the first feature card
3. **Expected:** Heading reads **"An Exciting Adventure"** (NOT "8 to 12 weeks"). Body still references 8–12 weeks in the prose.

### T-MKT-04 — `/tutoring/camps` school-break sentence is present
1. On the same page, scan the first card body
2. **Expected:** Body mentions "School breaks are reserved for development sprints and conference attendance" (or similar copy).

### T-MKT-05 — `/tutoring/camps` "Inquire" sentence at bottom
1. On the same page, scroll to the bottom of the feature cards section
2. **Expected:** A small-text sentence reading "Inquire as to any summer camp or school break experiences — Mathitude might have something to fit your needs."

### T-MKT-06 — `/tutoring/*` is publicly accessible
1. Open both `/tutoring/camps` and `/tutoring/private` in a private/incognito window
2. **Expected:** Both pages render normally. **Do NOT** redirect to `/sign-in`. (This was a recent middleware regression — confirm it's fixed.)

---

## 2. Parent dashboard — billing Save Changes flow

Sign in as a parent (non-admin). Visit `/dashboard/billing`.

### T-BILL-01 — Add card success
1. In the "Add a new card" section, enter `4242 4242 4242 4242`, future expiry, any CVC, any ZIP
2. Click **Add Card**
3. **Expected:** Button shows "Adding…" briefly, then a green-tinted (moss color, NOT generic emerald) message appears: "Card added. It's now in your saved cards…". The card form clears. The card appears in "Your saved cards" below.

### T-BILL-02 — Invalid card error copy
1. Click "Add Card" with the card field empty
2. **Expected:** Red-tinted (cranberry, NOT stoplight red) error: "Please enter your full card number." (NOT a raw Stripe error string.)
3. Now enter `4242 4242 4242 4242` but expiry empty; click Add Card
4. **Expected:** "Please enter the card's expiration date."
5. Now enter the decline card `4000 0000 0000 0002`, full expiry + CVC
6. **Expected:** "Your card was declined…" with a decline_code if Stripe surfaces one.

### T-BILL-03 — Add card does NOT auto-promote to default
1. Add a SECOND card via the form (e.g. `5555 5555 5555 4444` — Mastercard test)
2. **Expected:** New card appears in the list as a non-default card. The previously-default card still has the "Default" badge. (This is the change — old behavior auto-promoted; new behavior requires Save Changes.)

### T-BILL-04 — Stage default change behind Save Changes
1. With two+ cards on file, click "Set as default" on a non-default card
2. **Expected:** That card shows a "— pending default" caption beneath it. The "Default" badge stays on the previous default. The Save Changes button at the bottom is now enabled.
3. Click **Save Changes**
4. **Expected:** Button shows "Saving…". Then "Changes saved." appears (moss color). The Default badge moves to the newly-selected card. Verify in Stripe dashboard: customer.invoice_settings.default_payment_method is updated.

### T-BILL-05 — Stage remove behind Save Changes
1. With at least 2 cards, click the trash icon on a non-default card
2. **Expected:** The card row turns slightly pink-tinted, text strikes through, caption reads "— pending removal". An Undo button appears.
3. Click Undo
4. **Expected:** Card returns to normal state.
5. Click trash again, then click **Save Changes**
6. **Expected:** Card disappears from the list. Verify in Stripe dashboard: the PaymentMethod is detached from the customer.

### T-BILL-06 — Discard reverts staged changes
1. Stage a default change + a removal (don't save yet)
2. Click **Discard**
3. **Expected:** Both staged changes revert. Default badge is back on the original card. Removed card is restored.

### T-BILL-07 — "No default" guardrail
1. With exactly 2 cards on file (one is default), click trash on the default card
2. **Expected:** An amber-tinted (mustard, NOT generic amber) warning appears at the top of the panel: "You're removing the default card. Pick a new default from your remaining cards before saving."
3. Try to click Save Changes
4. **Expected:** Save Changes is disabled. Click on the warning still shows the message.
5. Click "Set as default" on the other (non-removed) card. Now Save Changes is enabled.
6. Click Save Changes.
7. **Expected:** Removed card is gone, the remaining card is the new default.

### T-BILL-08 — Removing all cards warning
1. With exactly 1 card on file, click trash on it
2. **Expected:** Amber-tinted warning: "You're about to remove all saved cards. Mathitude won't be able to charge you for future sessions until you add a new card."
3. Save Changes is enabled (it's allowed — just unusual).
4. Click Save Changes
5. **Expected:** "Changes saved. No cards on file." (moss color). The panel shows the empty state.

### T-BILL-09 — Stripe sync is real
1. After any T-BILL-04 / T-BILL-05 / T-BILL-07 / T-BILL-08 save, open the Stripe dashboard (test mode if test keys, live mode if live keys)
2. **Expected:** Customer's payment methods + default match what the UI shows. No drift.

---

## 3. Admin portal — landing + navigation

Sign in as an admin (one of the bootstrap emails).

### T-ADM-01 — Admin redirect
1. Visit `/dashboard` (the parent dashboard root) while signed in as admin
2. **Expected:** Server-side redirect to `/admin`. (Admins land on the operator portal, not the parent dashboard.)

### T-ADM-02 — Navbar shortcut
1. Sign out, then sign back in as an admin from the public site
2. Open the homepage `/`
3. **Expected:** Top-right navbar shows an "Admin" purple button (NOT "Dashboard"). Click it → goes to `/admin`.

### T-ADM-03 — Sidebar nav items present
1. Open `/admin`
2. **Expected:** Sidebar shows in this order: Weekly Schedule, Log session, Families, Students, Tutors, Resources, Billing queue, Payments, Financials, Admins, Notifications, Calendar, Newsletter, Import, Pages, Settings.

### T-ADM-04 — Cream surface is applied
1. While on `/admin`, inspect the page background
2. **Expected:** Background is a warm cream color (`#FBF7F0`), NOT pure white or gray. Sidebar is white sitting on the cream. Borders are cream-shifted (`#E8E3D9`), not pure gray.

---

## 4. Master admin portal — `/admin/settings`

### T-SET-01 — Settings hub renders all cards
1. Visit `/admin/settings`
2. **Expected:** 6 cards in a 2-column grid: Financials, Admins, Stripe, Notifications, Data import, Page content. Each card has a purple icon tile + title + description.

### T-SET-02 — Each card links to the right page
1. Click each of the 6 cards
2. **Expected:** Financials → `/admin/financials`, Admins → `/admin/admins`, Stripe → `/admin/settings/stripe`, Notifications → `/admin/notifications`, Data import → `/admin/import`, Page content → `/admin/pages`.

---

## 5. Admins page — `/admin/admins`

### T-ADMINS-01 — Bootstrap admins are protected
1. Visit `/admin/admins`
2. **Expected:** Three bootstrap admins shown with a purple "Protected" badge. NO trash icon next to them. The three are: `phamilton@mathitude.com`, `ari@coframe.com`, `nljq16@stanford.edu`.

### T-ADMINS-02 — Add a new admin
1. In the "Add an admin" card, type a valid email (e.g. `qatest@example.com`)
2. Click "Add admin"
3. **Expected:** Moss-tinted success message: "Added qatest@example.com as admin." The email appears in the list with caption "Added via portal" and a Remove button.

### T-ADMINS-03 — Add invalid email
1. Type `notanemail` (no `@`) and click Add admin
2. **Expected:** Cranberry-tinted error: "Invalid email". Email is NOT added.

### T-ADMINS-04 — Add duplicate is a no-op
1. Type an email already in the list (bootstrap or portal-added)
2. Click Add admin
3. **Expected:** No error. List unchanged. The success message may still show but the email is not duplicated.

### T-ADMINS-05 — Remove a portal-added admin
1. Click Remove next to a portal-added admin
2. Confirm the browser prompt
3. **Expected:** Moss-tinted success: "Removed [email]." Email disappears from the list.

### T-ADMINS-06 — Cannot remove bootstrap admin via API
1. Open browser devtools → Network tab
2. Try to send `DELETE /api/admin/admins?email=phamilton@mathitude.com` (use fetch from the console)
3. **Expected:** 400 response with error: "This admin is part of the bootstrap list and cannot be removed from the UI."

### T-ADMINS-07 — Newly-added admin can access the portal
1. Add `qatest@example.com` via the UI
2. Sign out, sign back in as that user
3. **Expected:** That user can access `/admin/*` and sees the Admin button in the navbar.

---

## 6. Financials dashboard — `/admin/financials`

### T-FIN-01 — All four summary cards render
1. Visit `/admin/financials`
2. **Expected:** Four cards across the top: Revenue (paid), Pending, Overdue + failed, Unbilled sessions. Each shows a dollar amount + a count below it.

### T-FIN-02 — Dollar amounts use tabular numerals (Geist)
1. Look at the four amount strings in the summary cards, the "Revenue by month" bars, the top-students list, and the recent-payments rows
2. **Expected:** All dollar amounts use the Geist font with tabular-nums spacing — numbers should align vertically in columns. Compare two amounts in the same column visually: digits should be the same width.

### T-FIN-03 — Status badges use warm palette
1. Scroll to the "Recent payments" section
2. **Expected:** Status badges are: paid = moss/teal (NOT generic emerald-600), pending = mustard (NOT amber-700), overdue/failed = cranberry (NOT red-600). The badges are filled (`badge-success` / `badge-warning` / `badge-error` utility classes).

### T-FIN-04 — Pending dollar color is mustard
1. Look at the "Pending" summary card's dollar amount
2. **Expected:** Amount text is mustard (`#B8851A`), not generic amber-700.

### T-FIN-05 — Overdue + failed dollar color is cranberry
1. Look at the "Overdue + failed" summary card's dollar amount
2. **Expected:** Amount text is cranberry (`#B0263C`), not generic red-600.

### T-FIN-06 — Revenue by month bar chart
1. If there's any paid payment data, scroll to "Revenue by month"
2. **Expected:** Last 6 months listed oldest→newest. Each row has a YYYY-MM label, a horizontal purple bar scaled to the month's revenue, and a dollar amount on the right.

### T-FIN-07 — Top students by paid revenue
1. **Expected:** Up to 10 students listed by total paid revenue. Names render correctly (not "stu_xyz" raw IDs unless the student record is missing first/last name).

### T-FIN-08 — Empty state
1. If no payments data exists, the recent-payments section should say "No payments yet."
2. **Expected:** No JavaScript errors in the console.

---

## 7. Post-session form — `/admin/sessions/new`

### T-SESS-01 — Form renders
1. Visit `/admin/sessions/new`
2. **Expected:** Four card sections in order: Session type, Who & when, Charges, Notes. A Cancel + "LOG SESSION" purple button row at the bottom.

### T-SESS-02 — Default session type is Tutoring
1. **Expected:** "Tutoring session" radio is pre-selected (purple-bordered card). The four other options (Group parent education, School STEM fair, Family / parental advising, Speaking engagement) are unselected.

### T-SESS-03 — Switching to Group reveals multi-select
1. Click the "Group" radio under Format
2. **Expected:** "Who & when" section now shows a checkbox list of students instead of a single dropdown.

### T-SESS-04 — Date defaults to today, time defaults to now
1. **Expected:** Date field shows today's date (YYYY-MM-DD). Time shows current HH:MM (24h).

### T-SESS-05 — Payer single (default)
1. Leave "Single payer" selected
2. **Expected:** No payer split UI appears.

### T-SESS-06 — Payer split UI
1. Click "Split across multiple payers"
2. **Expected:** A single payer row appears with: kind dropdown (Family / Specific parent / Other counterparty), the conditional second dropdown/input, a percentage field (default 100), and an expected dollar amount in parens like `($0.00)`. An "Add payer" button is visible.

### T-SESS-07 — Split validation
1. Enter `100` as total charge.
2. Add a second payer (now 2 rows, both at 0% by default, then you set them to 50 / 50)
3. Set Payer 1 to 50%, Payer 2 to 50%
4. **Expected:** Bottom-right shows "Total: 100.00%" in moss color. Expected $ in each row: $50.00.
5. Change Payer 2 to 40%
6. **Expected:** "Total: 90.00% — must equal 100%" in cranberry color.
7. Try to submit
8. **Expected:** Form shows cranberry error: "Payer split must total 100% (currently 90.00%)."

### T-SESS-08 — Other counterparty
1. In a payer row, change kind to "Other counterparty"
2. **Expected:** A text input appears (placeholder "e.g. Castro Elementary School"). Family/parent dropdown is hidden.

### T-SESS-09 — Submit happy path (single payer)
1. Pick a real student
2. Total charge $100
3. Single payer
4. Add notes "Worked on long division"
5. Click LOG SESSION
6. **Expected:** Button shows "Saving…", then moss success "Session logged." After ~800ms, navigates to `/admin`. The session should appear in the schedule (refresh `/admin` to see).

### T-SESS-10 — Submit with split
1. Total charge $200
2. Split 75% / 25% between two families
3. Submit
4. **Expected:** Same success behavior. Verify on the backend (DDB or via `/admin` schedule) that the session has the `payers` array stored.

### T-SESS-11 — Required field validation
1. Don't pick a student. Click LOG SESSION.
2. **Expected:** Cranberry error: "Pick a student (or add students for a group session)."
3. Pick a student but clear the date field. Click LOG SESSION.
4. **Expected:** Error from the API: "date and time are required."

### T-SESS-12 — Notes split visible vs private
1. Fill both notes fields (visible: "Practice 20 problems"; private: "Parent should not see this")
2. Submit
3. **Expected:** Both fields persist. Private notes should be admin-only (verify in DDB or in any parent-facing view).

---

## 8. Multi-guardian model — `/admin/families/[id]`

Use any existing family ID, or create a new student to spawn one.

### T-FAM-01 — "Add caregiver" button (NOT "Add parent")
1. Open `/admin/families/[some-family-id]`
2. **Expected:** Section heading is "Parents & caregivers". The button says "Add caregiver" (not "Add parent"). A description paragraph explains protected relationships.

### T-FAM-02 — Relationship picker on add
1. Click "Add caregiver"
2. **Expected:** Form shows First name, Last name, Email, Phone fields PLUS a "Relationship to child" dropdown with these options: Parent, Stepparent, Grandparent, Aunt, Uncle, Nanny, Legal guardian, Other.

### T-FAM-03 — Add a nanny
1. Fill the form: first "Jane", relationship "Nanny", click "Add caregiver"
2. **Expected:** Jane appears in the list with a "Nanny" badge. A trash icon appears next to her (because nanny is NOT protected).

### T-FAM-04 — Add a parent (protected)
1. Add a caregiver with relationship "Parent"
2. **Expected:** New parent appears with a "Parent" badge. NO trash icon next to them.

### T-FAM-05 — Cannot remove a parent
1. Inspect the page — the parent's row has no trash button.
2. Try to call the DELETE API directly with the parent's ID
3. **Expected:** 400 response with code `protected_relationship`: "A biological parent or stepparent cannot be removed from the UI."

### T-FAM-06 — Cannot remove a stepparent
1. Add a caregiver with relationship "Stepparent". Verify they have no trash button. Verify API DELETE returns the same 400 error.

### T-FAM-07 — Remove a nanny
1. Click trash on Jane (the nanny added in T-FAM-03)
2. Confirm the browser prompt
3. **Expected:** Jane disappears from the list.

### T-FAM-08 — Cannot remove primary payer
1. Set a non-parent caregiver (e.g. a grandparent) as primary payer via "Make primary payer"
2. Try to remove that grandparent via trash
3. **Expected:** Alert: "This caregiver is the family's primary payer. Assign a new primary payer first." The grandparent stays.

### T-FAM-09 — Sibling linking still works
1. In the same family, click "Add sibling"
2. Fill the form (first/last/grade/rate)
3. **Expected:** A new student is created under the same family. They appear in the Students section. The family's saved card on file applies to them (no need to re-enter payment info).

---

## 9. Design system rollout

### T-DS-01 — Cream surface on admin shell
1. Open any `/admin/*` page
2. **Expected:** Body background is `#FBF7F0` (warm cream). Use devtools color picker to verify. Sidebar is white (`#FFFFFF`).

### T-DS-02 — Marketing pages stay white
1. Open `/`, `/tutoring`, `/tutoring/private`, `/tutoring/camps`, `/contact`
2. **Expected:** All marketing pages keep `bg-white` background. The cream is admin-only.

### T-DS-03 — Geist tabular numerals on financials
1. Open `/admin/financials` in devtools
2. Pick any dollar amount and inspect computed font-family
3. **Expected:** Computed font-family includes `__Geist_*` (Next.js auto-named). `font-variant-numeric: tabular-nums` is applied.

### T-DS-04 — Brand mark uses Original Surfer
1. Look at the "Mathitude" wordmark in the admin sidebar top-left
2. **Expected:** Original Surfer font (rounded, hand-drawn feel). Color `#7030A0` purple.

### T-DS-05 — Original Surfer NOT used elsewhere on admin
1. Inspect headings on `/admin/financials`, `/admin/admins`, `/admin/sessions/new`
2. **Expected:** Headings use Avenir Next (or Nunito Sans fallback), NOT Original Surfer. Original Surfer is brand-mark-only on operator pages.

### T-DS-06 — Card radius is 8px
1. Inspect any Card component on an admin page
2. **Expected:** `border-radius: 0.5rem` (8px). Not the older sharp ~3.75px.

### T-DS-07 — No purple gradients anywhere
1. Visually scan every admin page
2. **Expected:** No gradient backgrounds. Solid colors only.

### T-DS-08 — No generic Tailwind red/amber/emerald on admin pages
1. Use devtools to grep for `color: rgb(220, 38, 38)` (red-600) or similar generic Tailwind palette values on `/admin/financials`, `/admin/admins`, `/admin/sessions/new`
2. **Expected:** None of those values applied to badge or alert text. All semantic colors use `var(--color-state-*)` resolving to moss/mustard/cranberry hex values.

---

## 10. Cross-cutting smoke

### T-X-01 — All admin pages load without console errors
1. Open devtools Console
2. Click through each sidebar item: Weekly Schedule, Log session, Families, Students, Tutors, Resources, Billing queue, Payments, Financials, Admins, Notifications, Calendar, Newsletter, Import, Pages, Settings
3. **Expected:** Each page renders. No red errors in console (warnings are OK).

### T-X-02 — All admin API endpoints respond
1. Open devtools Network tab
2. Click through the same sidebar items
3. **Expected:** Each API call (`/api/admin/*`, `/api/families`, `/api/sessions`, etc.) returns 200 (or 401 if not signed in, which it shouldn't be on these tests).

### T-X-03 — Parent dashboard still works
1. Sign out, sign back in as a non-admin parent
2. Visit `/dashboard`, `/dashboard/billing`, `/dashboard/schedule`, `/dashboard/courses`, `/dashboard/resources`, `/dashboard/events`
3. **Expected:** All render. Parent dashboard uses white background (NOT cream — that's admin-only).

### T-X-04 — Sign-in flow unchanged
1. Sign out, visit `/admin`
2. **Expected:** Redirect to `/sign-in?redirect_url=%2Fadmin`. Clerk sign-in page loads. Sign in → redirected to `/admin`.

### T-X-05 — Public marketing routes are all 200
1. Hit each in a private window: `/`, `/tutoring`, `/tutoring/camps`, `/tutoring/private`, `/contact`, `/events`, `/free-resources`, `/shop`, `/balloons`, `/pascals-triangle`, `/swamp-puzzles`, `/puzzles-and-activities`, `/math-engagement`
2. **Expected:** All return 200. (`/tutoring/*` was a recent middleware regression — confirm fixed.)

### T-X-06 — Notification fires on a card change
1. As a parent, change default card or remove a card, click Save Changes
2. As an admin, visit `/admin/notifications`
3. **Expected:** A new notification row appears with the action (e.g. "card.default_changed", "card.removed") and the parent's name + brand + last4.

### T-X-07 — Notification fires on session log
1. As admin, log a session via `/admin/sessions/new`
2. Visit `/admin/notifications`
3. **Expected:** "session.logged" notification with student ID, date, offering type, type, amount.

### T-X-08 — Notification fires on admin add/remove
1. Add and then remove a portal admin
2. Visit `/admin/notifications`
3. **Expected:** Two new notifications: "admin.added" and "admin.removed" with the email + actor email.

---

## 11. Mobile sanity (Chrome dev tools, iPhone 14 viewport)

### T-MOB-01 — Marketing pages reflow
1. Open `/`, `/tutoring/private`, `/tutoring/camps` at 390x844
2. **Expected:** No horizontal scroll. Hero text + CTA stack vertically. Photos resize.

### T-MOB-02 — Admin shell mobile menu
1. Open `/admin` at mobile width
2. **Expected:** Sidebar collapses behind a hamburger button (top-left). Tapping the hamburger opens a sheet with all nav items.

### T-MOB-03 — Billing page mobile
1. Open `/dashboard/billing` at mobile width
2. **Expected:** Form fields stack, card list stacks, Save Changes button remains accessible. No horizontal scroll.

### T-MOB-04 — Sessions/new form mobile
1. Open `/admin/sessions/new` at mobile width
2. Switch to Split payer mode, add a second payer
3. **Expected:** Payer rows wrap. Percent input + delete button still visible. No horizontal scroll.

---

## 12. Known limitations (not bugs)

- **Bootstrap admin set is hardcoded** in `website/src/lib/server/admins.ts` (3 emails). To rotate, edit the file + redeploy. This is intentional — the bootstrap list is the "if all else fails" recovery path.
- **Stripe single-card-per-customer enforcement removed.** Customers can now have multiple cards on file simultaneously. Old "auto-detach previous card" behavior is gone. This is the 5/17 spec change.
- **Public webhook URL** must still be registered in the Stripe dashboard for live webhooks to flow. Settings → Stripe in admin shows the URL to copy.
- **Real database** behind staging is the `mathitude-staging-*` DynamoDB tables in us-west-2. If Paula's real customer data should be tested instead, that's a separate environment promotion.

---

## 14. Pass-2 additions — 5/17 spec follow-ups

### T-FAM-NEW-01 — /admin/families/new no longer 404s
1. Open `/admin/families/new`
2. **Expected:** Page loads. Heading: "Add a new family". Two cards:
   "Primary caregiver" + "First student". NOT a "Family not found" error.

### T-FAM-NEW-02 — Required-field validation
1. Click "Create family" with all fields empty
2. **Expected:** Cranberry error listing every missing required field
   (Parent first name, Parent last name, Parent email, Student first name,
   Student last name). Form does NOT submit.

### T-FAM-NEW-03 — Happy path
1. Fill all required fields (parent first/last/email, student first/last).
   Pick a grade. Leave optional fields blank.
2. Click "Create family"
3. **Expected:** Button shows "Creating…", then redirect to
   `/admin/families/[the-new-id]`. New family appears on `/admin/families`.

### T-FAM-NEW-04 — Relationship selector
1. **Expected:** "Relationship to student" dropdown has 8 options: Parent
   (default), Stepparent, Grandparent, Aunt, Uncle, Nanny, Legal guardian,
   Other.

### T-GRADE-01 — Extended grades on family create
1. On `/admin/families/new`, click the Grade dropdown
2. **Expected:** Options: Pre-K, Kindergarten, Grades 1–12, Undergrad —
   First year / Sophomore / Junior / Senior, Graduate school, Other / gap
   year. Total 21 entries.

### T-GRADE-02 — Extended grades on student detail
1. Open any student via `/admin/students/[id]` and click Edit
2. **Expected:** Same 21 grade options visible in the Grade dropdown.

### T-GRADE-03 — Legacy 13–16 values still render correctly
1. Find any student whose grade was imported as `13`, `14`, `15`, or `16`
   (legacy college Years 1–4)
2. **Expected:** Renders as "Undergrad — First year" / "Sophomore" / etc.
   In the dense student list it shows "UG1" / "UG2" / etc.

### T-SESS-LEAD-01 — Session lead selector appears
1. Open `/admin/sessions/new`
2. Scroll to "Who & when"
3. **Expected:** When at least one tutor exists, you see TWO selects side
   by side: "Assigned tutor" + "Session lead (optional)". Helper text under
   session lead explains substitute/paired-tutor scenarios.

### T-SESS-LEAD-02 — Session lead defaults to assigned tutor
1. Pick an assigned tutor
2. **Expected:** Session lead select auto-fills with the same tutor.

### T-SESS-LEAD-03 — Session lead persists differently from tutor
1. Pick "Jane Doe" as assigned tutor
2. Change session lead to "Paula Hamilton" (or another tutor)
3. Fill the rest of the form, submit
4. **Expected:** Session saved. Inspect via DDB or `/admin/schedule` —
   `tutorId` is jane_doe's id; `sessionLeadId` is paula's id.

### T-CONTACT-AST-01 — Red asterisks on required fields
1. Open `/contact` in a private window
2. **Expected:** Asterisks appear after these labels in cranberry color:
   "Your name *", "Email *", "What are you interested in? *", "Student
   info *", "Tell us a little about what you're hoping for *". NO asterisk
   after "Phone (optional)".
3. Bottom of the form has a small line: "Fields marked * are required."

### T-CONTACT-VAL-01 — Submit with all blanks
1. Click "SEND TO MATHITUDE" with all fields empty
2. **Expected:** Cranberry error: "Please fill in: Your name, Email, What
   are you interested in, Student info, Tell us a little about what
   you're hoping for." (Lists every missing field, not just the first.)

### T-CONTACT-VAL-02 — Submit with phone blank only
1. Fill all other fields. Leave phone blank.
2. Submit
3. **Expected:** Form submits successfully (phone is optional).

### T-CONSULT-01 — /admin/consultations renders
1. As admin, visit `/admin/consultations`
2. **Expected:** Heading "Consultation requests". A search box. An "Export
   CSV" button. List of submissions sorted newest-first.

### T-CONSULT-02 — CSV export
1. Click "Export CSV"
2. **Expected:** Browser downloads `consultations-YYYY-MM-DD.csv`. Open
   it — columns: createdAt, parentName, email, phone, offering,
   studentInfo, notes, source, id.

### T-CONSULT-03 — Search filter
1. Type a name from one of the requests in the search box
2. **Expected:** List filters live. Clearing the search restores the full
   list.

### T-CONSULT-04 — Sidebar nav entry
1. **Expected:** "Consultations" appears in the admin sidebar between
   "Financials"/"Admins" and "Notifications" with a Mail icon.

### T-HERO-VIDEO-01 — Video slot in hero
1. Open `/` in a private window
2. Inspect the first photo tile (top-left of the 2x2 collage on desktop)
3. **Expected:** It's a `<video>` element with `src="/videos/bucky-ball-hero.mp4"`,
   `autoplay muted loop playsInline`, `poster="/photos/bucky_avni1.jpg"`.
   Until the .mp4 is uploaded, the poster image shows in its place.

### T-NAV-NAV-01 — Navbar Admin button is UPPERCASE
1. Sign in as admin. Look at the top-right of any public page.
2. **Expected:** "ADMIN" button (uppercase, tracking-wide). Not "Admin".

### T-NAV-CLERK-01 — Clerk sign-in button UPPERCASE
1. Sign out. Go to `/sign-in`.
2. **Expected:** Primary "Continue" / "Sign in" button is uppercase
   tracking-wide.

### T-CROSS-01 — Dashboard sidebar shows Admin button for admins
1. Sign in as admin. Visit `/dashboard` directly (no longer auto-redirected
   to /admin).
2. **Expected:** Top of the sidebar has a prominent purple "ADMIN PORTAL"
   button with a ShieldCheck icon. Below it: small helper text. The parent
   nav items follow.

### T-CROSS-02 — Dashboard does NOT show admin button for parents
1. Sign in as a non-admin parent. Visit `/dashboard`.
2. **Expected:** No "Admin Portal" button. No helper text about admin
   access. Just the parent navigation.

### T-CROSS-03 — Admin sidebar shows "View as parent" link
1. Sign in as admin. Open `/admin`.
2. Look at the sidebar footer (above the UserButton)
3. **Expected:** Small purple "View as parent →" link. Clicking it goes
   to `/dashboard`.

### T-FAQ-01 — Paula FAQ doc exists
1. Open `/PAULA_FAQ.md` in the repo
2. **Expected:** Doc covers consultation emails, DB access paths, pricing
   model, SOC2 path, env vars.

---

## 13. Bug-report template (copy into your tracker)

```
Test ID: T-XXX-NN
Severity: P0 / P1 / P2
Environment: https://website-sage-three-98.vercel.app
Browser: Chrome 130 (or whatever)
Account: admin / parent — which email

Steps to reproduce:
1.
2.
3.

Expected:

Actual:

Screenshot: (attach)
Network error if API failure: (paste status + body)
```
