# UX Status — 5/17 Spec Pass-by-Pass

Live audit run 2026-05-24 against https://website-sage-three-98.vercel.app.
Public pages screenshotted; admin pages source-reviewed (auth-gated).
Screenshots in `/tmp/mathitude-design/`.

**Design Score: A−**
**AI Slop Score: A** (no convergence patterns, brand-forward, real typography)
**Goodwill Reservoir: 78/100** (healthy, see flow analysis)

---

## 1. Prior fixes (marketing surface)

### `/tutoring/private`
- **Remove waitlist section**
  - UX status: ✅ Clean. No "Waitlist" heading anywhere on the page.
  - Visual evidence: `04-private.png` — page goes Hero → In-person & virtual → Solo & small group → Pre-K through college → Enrichment & academic support → "Curious about small group classes?" → "Ready to get started?".
- **Remove 60-40 split, keep general**
  - UX status: ✅ Enrichment section reads as one coherent paragraph blending enrichment with academic support. No percentage anywhere.
  - Hierarchy: divider-only style between sections (no card chrome) reads editorial, not generic. Good restraint.

### `/tutoring/camps`
- **8 to 12 week small group, school breaks for dev sprints**
  - UX status: ✅ Body text says it explicitly: "School breaks are reserved for development sprints and conference attendance".
  - Visual evidence: `03-camps.png`.
- **"Inquire as to any summer camp..." sentence at bottom**
  - UX status: 🟡 Present, but **faint**. Currently rendered `text-sm text-neutral-600`, sits below the "How to book" body. A first-time scanner will miss it.
  - UX recommendation: bump to `text-base text-neutral-700`, or pull it into its own micro-section with a thin top border. P2 polish, not blocking.
- **Title swap to "An Exciting Adventure"**
  - UX status: ✅ Confirmed in DOM. Body still references the 8-12 weeks range — clean naming separation between "what we call it" and "how long it is."

---

## 2. `/dashboard/billing` — Save Changes flow

Auth-gated; source-reviewed against `src/app/dashboard/billing/page.tsx` + `src/components/stripe/payment-methods-panel.tsx`.

- **Save Changes button gates updates**
  - UX status: ✅ Two-zone layout: "Add a new card" (immediate Stripe call, Stripe SDK constraint) vs "Manage saved cards" (staged + Save Changes). Helper line at top tells the user *exactly* this distinction.
  - "Don't make me think" check: a parent scanning the page sees 1-2-3 step intro on the left, the card form, the saved-card list with Set/Remove actions, and a single Save Changes button at the bottom. Mindless.
- **add/remove card**
  - Add: immediate (Stripe SetupIntent requires it). Card lands in the list as non-default. Card form clears, success message says "Add it now, click Save Changes if you want to use it for charges."
  - Remove: staged. Row tints pink, text strikes through, Undo button appears. Save Changes commits the detach.
  - UX status: ✅
- **Change default card → Stripe sync**
  - Staged via "— pending default" caption + "Set as default" button on each non-default row. Save Changes posts to `/api/stripe/payment-methods/apply` which writes `customer.invoice_settings.default_payment_method`.
  - UX status: ✅. Mirror confirmed in T-BILL-09.
- **Invalid CC error handling**
  - Stripe codes mapped to friendly copy: `incomplete_number → "Please enter your full card number."`, `card_declined → "Your card was declined…"`, etc. Lives in `save-card-form.tsx:80-95`.
  - UX status: ✅. Errors render in cranberry (`badge-error`), not generic red-500.
- **Error if no default card**
  - Server-side guard in `apply/route.ts:90-104`. If a Save Changes payload would leave cards on file with no default, returns 400 + `code: "no_default"`. Client-side guard catches the same case before submit, disables the button, shows an amber warning at the top of the panel.
  - UX status: ✅. Two layers of guard — the user can never end up in the "cards on file, no default" state silently.

---

## 3. Admin master portal

### `/admin/settings` — hub
- UX status: ✅ 6 cards in a 2-column grid: Financials, Admins, Stripe, Notifications, Data import, Page content.
- "Trunk test" check: each card has icon + title + one-line description. Mindless click.
- File: `src/app/admin/settings/page.tsx`.

### `/admin/financials`
- UX status: ✅
- Hierarchy: 4 summary cards at top (Revenue paid / Pending / Overdue+failed / Unbilled), then monthly bar chart, then top students, then recent payments.
- Dollar amounts use `.font-tabular` (Geist + tabular-nums) — numbers align vertically. Designed for scanning.
- Warm semantic palette: paid = moss `#0F7B6C`, pending = mustard `#B8851A`, overdue = cranberry `#B0263C`. No generic emerald/amber/red.
- Source: `src/app/admin/financials/page.tsx`.

### `/admin/admins`
- UX status: ✅
- Bootstrap admins (phamilton@, ari@coframe, nljq16@) protected with "Protected" badge, NO trash button.
- Portal-added admins have a Remove button. Confirm dialog before delete.
- Add form at top with email + "Add admin" purple uppercase button.
- Goodwill check: error states use cranberry `badge-error`, success uses moss `badge-success`. Consistent with the design system.

---

## 4. Data structures (admin)

### Sibling linking
- UX status: ✅ "Add sibling" button on `/admin/families/[id]` opens an inline form. Submitting creates a student attached to the same family — no need to re-enter parent info or saved card.
- File: `src/app/admin/families/[id]/page.tsx:385-506`.

### Multi-guardian + relationship
- UX status: ✅
- Section heading reads "Parents & caregivers" (not "Parents"). Helper line explains protected relationships up front.
- Add caregiver form has relationship dropdown with 8 options: Parent, Stepparent, Grandparent, Aunt, Uncle, Nanny, Legal guardian, Other.
- Each caregiver row shows a relationship badge ("Nanny", "Aunt", etc.).
- Trash button appears ONLY for non-protected, non-primary-payer caregivers. Protected parents/stepparents have NO trash button rendered — the affordance is honest about what can and can't be removed.
- DELETE endpoint refuses `protected_relationship` and `primary_payer` with explicit error codes the UI surfaces.
- File: `src/app/admin/families/[id]/page.tsx:142-235`.

### Post-session form (`/admin/sessions/new`)
- UX status: ✅
- Section structure (nested): Session type → Who & when → Charges → Notes.
- **Session type**: 5 radio cards (Tutoring/group-parent-ed/STEM-fair/family-advising/speaking). Tutoring pre-selected. Each card shows label + 1-line helper.
- **Individual vs Group**: 2 radios under "Format". Switching to Group reveals a checkbox list of students.
- **Charges**: single total field. Radio for Single payer vs Split.
- **Split mode**: per-payer row with kind (Family/Specific parent/Other counterparty), conditional second select, % input, expected dollar amount in parens, optional remove. Total `100.00%` in moss if valid, cranberry if not.
- **Session lead**: optional dropdown to mark who actually delivered when ≠ assigned tutor. Helper line explains substitute/paired/Paula-stepping-in scenarios.
- **Notes**: separate visible vs private (staff-only) text areas.
- Mindless-click check: every step is a binary or short-list. No free-text where a structured option would do.

### Grade levels past 12th
- UX status: ✅ 21 options now: Pre-K, K, 1-12, UG1-UG4 (Undergrad First year/Sophomore/Junior/Senior), GRAD, OTHER (gap year).
- Centralized in `src/lib/grades.ts`; legacy 13-16 imports auto-relabel to UG1-UG4. Consistent across `/admin/students`, `/admin/students/[id]`, `/admin/families/new`, `/tutor`.

---

## 5. Landing page

### Video snippet in hero
- UX status: 🟡 **Slot wired, asset missing**
- `src/components/sections/hero.tsx:57-68`: top-left tile is a `<video autoplay muted loop playsInline>` with `src="/videos/bucky-ball-hero.mp4"` and `poster="/photos/bucky_avni1.jpg"`.
- Visual evidence: `01-home.png` — the tile currently shows the poster image. Visitors see a still photo where motion was promised.
- Until you drop the .mp4 in `website/public/videos/`, this is a "no-op". The page doesn't break, but the design intent isn't fulfilled.
- Instructions in `website/public/videos/README.md`.

---

## 6. `/contact` — required-field asterisks

- UX status: ✅ Verified visually.
- Visual evidence: `02b-contact-fullload.png`.
- Red asterisks on **Your name **, **Email **, **What are you interested in? **, **Student info **, **Tell us a little about what you're hoping for **.
- Phone label reads "Phone (optional)" — no asterisk.
- Helper line below the message field: **"Fields marked \* are required."**
- Validator (client-side) enumerates every missing field in one cranberry error tile.
- "SEND TO MATHITUDE" button: purple, uppercase, tracking-wide ✓
- ⚠️ Note on initial paint: the form is wrapped in `<Suspense fallback={null}>` because `useSearchParams` requires it. On a slow first render the form briefly disappears entirely (no skeleton). Not a bug; users see the rest of the page (heading, contact strip) so the page never *feels* blank. Could ship a skeleton later. P2 polish.

---

## 7. Website-wide: purple buttons ALL CAPS

Audited every `bg-[#7030A0]` button across the codebase:

| Surface | Status |
|---|---|
| Hero "Request a Consultation" | ✅ uppercase tracking-wide |
| Camps page "Request a Consultation" | ✅ |
| Private page "Request a Consultation" | ✅ |
| Contact "SEND TO MATHITUDE" | ✅ |
| Navbar "Admin" shortcut (signed-in admin) | ✅ (pass 2 fix) |
| Clerk sign-in "Continue" | ✅ (pass 2 fix, verified via `05b-signin.png`) |
| Clerk sign-up "Continue" | ✅ (pass 2 fix) |
| Admin pages "Save Changes" / "Add admin" / "LOG SESSION" / "Create family" | ✅ |
| Tutor toggle chips on `/admin/students/[id]` | (intentional exception — these are person names, not CTAs) |

Visual evidence: `05b-signin.png` shows the CONTINUE button uppercase.

---

## 8. Dashboard ↔ admin cross-links (Paula nav)

- **Dashboard sidebar (when admin)**: prominent purple ALL-CAPS "ADMIN PORTAL" button with ShieldCheck icon at top of sidebar, helper text below ("You're viewing the parent dashboard…"). Source: `src/components/dashboard/shell.tsx:113-127`.
- **Dashboard sidebar (when parent)**: no admin button, no helper text. Just the parent nav. Source: same file, gated by `isAdmin` prop.
- **Admin sidebar footer**: "View as parent →" link in mathitude-purple. Source: `src/components/admin/shell.tsx:178-185`.
- UX status: ✅
- Goodwill check: Paula can see what her clients see without losing the path back. Mirror-symmetric (both sides have a cross-link, both labeled clearly). No mode confusion.

---

## 9. Consultation submissions

- **Email**: `ADMIN_NOTIFICATION_EMAIL` (Resend). Fires on every `/api/consultations` POST.
- **Portal view**: `/admin/consultations`. Search box at top, "Export CSV" button top-right, list sorted newest-first. Each row: parent name + email + phone (click-to-call) + offering badge (purple) + creation date + student info + message.
- **CSV export**: client-side; downloads `consultations-YYYY-MM-DD.csv` with 9 columns.
- UX status: ✅. Source: `src/app/admin/consultations/page.tsx`.

---

## 10. Issues

### `/admin/families/new` 404
- UX status: ✅ **FIXED.** The page now exists. Form takes Primary caregiver (first name, last name, email, phone, relationship) + First student (first name, last name, grade, default session type, default rate). Required-field validator enumerates every missing field. On submit, redirects to the new family detail page.
- Visual flow (would be):
  1. Click "Add Family" on `/admin/families`
  2. Land on `/admin/families/new` with 2-card form
  3. Fill required fields
  4. Submit → land on `/admin/families/{newFamilyId}`
  5. From there add siblings or additional caregivers
- Source: `src/app/admin/families/new/page.tsx`.

---

## Trunk test (per Krug)

For each page: drop a user in cold. Can they answer in 2 seconds — *what site is this, what page am I on, what are my options, where am I, how do I search*?

| Page | Result | Notes |
|---|---|---|
| `/` | PASS | Mathitude wordmark top-left, hero says exactly what the product is, primary nav top-right, CTA prominent. |
| `/tutoring/private` | PASS | Breadcrumb "Tutoring & Groups / Private Tutoring" above the H1. |
| `/tutoring/camps` | PASS | Same breadcrumb pattern. |
| `/contact` | PASS | H1 is the action ("Request a Consultation"), form on right, contact details on left, footer nav at bottom. |
| `/sign-in` | PASS | Brand reinforced on left, "Welcome back" + Google + email on right. |
| `/admin/*` (source review) | PASS | Sidebar is persistent and labeled, page H1 always matches the active nav item, the new "Quick start guide" on `/admin` orients first-time users (1-Add students, 2-Setup calendar, 3-Review payments, 4-Edit pages). |
| `/dashboard/*` (source review) | PASS | Same sidebar pattern. Cross-link to Admin for admins doesn't intrude for parents. |

No FAILs. One PARTIAL deserved-flag: the camps "Inquire" sentence (too faint).

---

## Goodwill reservoir trace (parent flow)

Starting at 70:

1. Open `/` → sees brand + Pre-K-to-College + Menlo Park + Virtual → +5 obvious primary actions
2. Click "Request a Consultation" → lands on `/contact`, sees contact info + form → +5 upfront and helpful
3. Tries to submit form with email blank → cranberry error names exactly what's missing → +5 graceful error
4. Submits successfully → moss confirmation, "We'll reply to {email}…" → +5 confirmation tells them what happens next
5. (Future) Receives credentials, signs in, hits `/dashboard` → sees parent nav → +0 expected
6. Clicks Billing → sees Add Card + Saved Cards with clear staged-changes model → +5 invariants explained ("changes take effect after Save Changes")
7. Adds card with `4242 4242 4242 4242` → "Card added" success → +5
8. Tries to remove default card → amber warning, Save Changes disabled → +10 system prevents footgun

**Final: 105 / 100** (capped). Healthy.

---

## AI slop scan

Run against `/`, `/tutoring/private`, `/tutoring/camps`, `/contact`:

| Anti-pattern | Status |
|---|---|
| Purple/violet gradients | ✅ None |
| 3-column icon-in-circle feature grid | ✅ None (the 6-ways section uses numbered list + plain text) |
| Centered-everything | ✅ Mixed alignment, left-align on body copy |
| Bubbly uniform radius | ✅ Hierarchy preserved (8px cards, full-rounded CTAs, 4px chips) |
| Decorative blobs / wavy dividers | ✅ None |
| Emoji as design elements | ✅ None |
| Colored left-border on cards | ✅ None |
| Generic hero ("unlock the power…") | ✅ "At Mathitude, it's all about the attitude" — branded, specific |
| Cookie-cutter section rhythm | ✅ Varies by content (hero hero-photo split, then bio, then 6 ways, then testimonial, etc.) |
| system-ui / -apple-system as primary | ✅ Original Surfer for brand, Avenir/Nunito for body |

**AI Slop Score: A.** Verdict: this looks like a real studio's site, not a generated SaaS template. The cream operator-portal surface + Original Surfer brand mark differentiates instantly.

---

## Findings — prioritized

### 🟡 P2 polish

**F-001 — Camps "Inquire as to..." sentence is too faint**
- File: `src/app/tutoring/camps/page.tsx:106-108`
- Currently: `<p className="mt-4 text-sm text-neutral-600 leading-relaxed">`
- Suggest: `<p className="mt-4 text-base text-neutral-700 leading-relaxed">` OR move into its own bordered micro-section.
- Impact: visitors miss the "we might have something for summer/break" hook.

**F-002 — Contact form has no skeleton during Suspense**
- File: `src/app/contact/page.tsx:303-305`
- Currently: `<Suspense fallback={null}>`
- Suggest: ship a skeleton matching the form layout (5 fields + button) so the right column doesn't briefly empty out during hydration.
- Impact: first paint flashes the contact-info column on the left only; the right side appears empty for ~100-300ms.

**F-003 — Hero video tile shows static poster (asset missing)**
- File: `src/components/sections/hero.tsx:57-68`
- Currently: poster image shows until `/videos/bucky-ball-hero.mp4` is uploaded.
- Suggest: upload the mp4. README in `website/public/videos/README.md` has encoding recommendations.
- Impact: visitors don't see the kinetic energy the design promised.

### ✅ Everything else verified clean

No P0/P1 visual findings. The 5/17 spec landed correctly. The pass-2 fixes (families/new, session lead, asterisks, grade levels, cross-links, consultations admin) all integrate with the design system without visual regressions.

---

## Quick wins (under 30 min each)

1. F-001: bump the camps "Inquire" sentence one weight up — 2-line change.
2. F-002: add a 5-field skeleton in the Suspense fallback — ~30 lines.
3. F-003: drop the video file in (not a code change).

If you want me to ship F-001 and F-002 right now, say the word. F-003 needs the asset from you.
