# Mathitude v3.0 — DynamoDB Schema (Proposed)

**Status:** PROPOSED — validated against (a) Timmy Google-Sheet notes [21 sessions] and (b) Paula's master Excel `NEWEST_MATH_CLIENT_INFO` [~3 years, hundreds of sessions, dozens of students across 12+ schools]. Plus Paula's written "Mathitude Data Structure Notes."
**Owner:** Ari · **Reviewer:** Nikki · **Last revision:** 2026-05-02
**Deadline:** May 1, 2026 (Phase 2 / Week 3)

This document captures the target data model for the Mathitude v3.0 portal. It maps the entities in the v3.0 plan to concrete DynamoDB tables, partition/sort keys, and GSIs.

**Why DynamoDB:** low ops, pay-per-request, fits the access patterns (family lookup, tutor calendar, billing queue), and the existing site already uses it. The trade-off — no joins — is addressed below by over-fetching at entity boundaries instead of normalizing across tables.

---

## Entities (v3.0 plan)

| Entity | Purpose |
|---|---|
| `Family` | Billing + household unit. One Primary Payer per student. |
| `Parent` | Individual adult. Has a `stripeCustomerId`. Linked to one `Family`. |
| `Student` | Child. Linked to one `Family`. May have multiple assigned tutors. |
| `Tutor` | Paula, Sara, and contracted tutors. Keeps `assignedStudentIds[]`. |
| `Session` | A scheduled or completed tutoring session. Moves through a status workflow. |
| `User` | Clerk-authenticated principal. Maps Clerk `userId` → `role` + `linkedEntityId`. |

Sessions billed → Stripe charges; **never** stores PCI data in DynamoDB.

---

## Session status workflow

```
scheduled → completed → billed → paid
                    ↘ hold (skipped this cycle)
                    ↘ failed (charge failed; retry)
```

---

## Tables

### `mathitude-families`
Billing + household metadata.

| Attribute | Type | Notes |
|---|---|---|
| `id` (PK) | String | `fam_<uuid>` |
| `primaryPayerId` | String | Default `parentId`; can be overridden per-student via `Student.primaryPayerId` |
| `address` | Map | `{street, city, state, zip}` |
| `notes` | String | Free text, admin-only |
| `createdAt` / `updatedAt` | String (ISO) | — |

**No GSI needed** — families are looked up by parent/student back-references.

### `mathitude-parents`
One row per adult. `stripeCustomerId` is the **only** link to Stripe.

| Attribute | Type | Notes |
|---|---|---|
| `id` (PK) | String | `par_<uuid>` |
| `familyId` | String | FK → `families.id` |
| `firstName` / `lastName` | String | — |
| `email` | String | Also used to match existing Stripe customers |
| `phone` | String | — |
| `stripeCustomerId` | String | Set during Week 4 Stripe import |
| `clerkUserId` | String | Nullable — populated when parent signs in |

**GSI `by-family`** — `familyId` (hash) · `lastName` (range). Lists all parents in a family.
**GSI `by-email`** — `email` (hash). Dedup + Stripe customer mapping.
**GSI `by-stripe-customer`** — `stripeCustomerId` (hash). Webhook lookup.

### `mathitude-students` (extend existing table)
The current `students` table stays; we **add** new fields without breaking existing rows.

| Attribute | Type | Notes |
|---|---|---|
| `id` (PK) | String | Existing |
| `familyId` | String | **NEW** — FK → `families.id` |
| `firstName` / `lastName` | String | Existing |
| `grade` | String | Existing |
| `school` | String | **NEW** — one of the 12 Bay Area schools in `/admin/calendar` |
| `tutorIds` | String Set | **NEW** — supports multi-tutor assignments |
| `primaryPayerId` | String | **NEW** — nullable; overrides `Family.primaryPayerId` when set |
| `status` | String | Existing: `active \| waitlist \| inactive` |
| `notes` | String | Private admin-only notes |
| `stripeCustomerId` | String | **DEPRECATE** — belongs on `Parent` |

**GSI `by-status`** — existing. Keep.
**New GSI `by-family`** — `familyId` (hash) · `lastName` (range). Family-page rendering.
**New GSI `by-tutor`** — via scatter-gather on `tutorIds` set → see *Query patterns* below.

### `mathitude-tutors`
| Attribute | Type | Notes |
|---|---|---|
| `id` (PK) | String | `tut_<uuid>`. Paula is `tut_paula`. |
| `firstName` / `lastName` | String | — |
| `email` | String | — |
| `clerkUserId` | String | Links tutor login to tutor record |
| `assignedStudentIds` | String Set | Denormalized mirror of `Student.tutorIds` |
| `active` | Boolean | For admin removal without data loss |

**GSI `by-clerk-user`** — `clerkUserId` (hash). Login → tutor record.

### `mathitude-sessions` (extend existing table)
Existing PK (`studentId`) + SK (`dateTime`) stays. Add fields to support the v3.0 billing workflow.

| Attribute | Type | Notes |
|---|---|---|
| `studentId` (PK) | String | Existing |
| `dateTime` (SK) | String (ISO) | Existing |
| `tutorId` | String | **NEW** — FK → `tutors.id` |
| `date` | String (YYYY-MM-DD) | Existing — used by GSI |
| `time` | String (HH:MM) | Existing |
| `duration` | Number (minutes) | Existing |
| `rate` | Number (cents) | **NEW** — snapshot rate at time of session (admin-editable pre-billing) |
| `type` | String | Existing: `individual \| group \| note` |
| `status` | String | **EXTEND** to: `scheduled \| completed \| billed \| paid \| hold \| failed \| cancelled` |
| `notes` | String | Existing — tutor-authored, visible to parents |
| `students` | String Set | Existing — for group sessions |
| `stripeChargeId` | String | **NEW** — set when `status = billed` |

**GSI `by-date`** — existing. Keep for calendar queries.
**New GSI `by-tutor-date`** — `tutorId` (hash) · `dateTime` (range). Tutor calendar.
**New GSI `by-status`** — `status` (hash) · `dateTime` (range). Billing queue (`status = completed`).

### `mathitude-users`
Maps Clerk principals to Mathitude roles + entity ownership.

| Attribute | Type | Notes |
|---|---|---|
| `clerkUserId` (PK) | String | From Clerk |
| `role` | String | `admin \| tutor \| parent` |
| `linkedEntityId` | String | `tutorId` for tutors, `parentId` for parents. Null for admins. |
| `createdAt` | String (ISO) | — |

**GSI `by-role`** — `role` (hash) · `createdAt` (range). Admin-facing user lists.

### Existing tables — keep unchanged
`mathitude-payments`, `mathitude-events`, `mathitude-resources`, `mathitude-content` stay as-is. Payments semantics migrate to Sessions+Stripe-as-source-of-truth but the payments table continues to hold the lightweight status mirror for fast dashboard reads.

---

## Query patterns → GSIs

| Pattern | Index used |
|---|---|
| Family page: all parents + students for a family | `parents.by-family` + `students.by-family` |
| Tutor calendar: sessions for a tutor in a date range | `sessions.by-tutor-date` |
| Billing queue: all `completed` sessions | `sessions.by-status` where `status=completed` |
| Admin lookup: find a parent by email | `parents.by-email` |
| Stripe webhook: which parent owns this customer | `parents.by-stripe-customer` |
| Sign-in: map Clerk user to tutor record | `tutors.by-clerk-user` |
| Sign-in: map Clerk user to role | `users` PK lookup |
| Shared student across tutors | `students.tutorIds` set + scatter query on `sessions.by-tutor-date` |

---

## Reconciliation against real data — what we learned 2026-05-02

Paula sent her "Mathitude Data Structure Notes" + the master Excel sessions tab. Major schema deltas:

### Two-tier notes (NEW REQUIREMENT)
Paula maintains TWO notes systems:
- **Google Sheet Col B (Session Activities)** — parent/student-facing. Mirrors Excel Col H (Work Summary).
- **Excel Col J (Focus Area)** — internal-only. Pre-session planning + post-session private observations. Never shown to families.

**Schema impact:** Add `Session.privateNotes` (admin-only, never returned by parent/student-facing endpoints). Keep `Session.notes` for parent-facing. Backend must enforce role-based field projection — a parent role MUST NOT receive `privateNotes`.

### Two kinds of "joint session" — distinct billing
1. **Same-family joint** (Thompson + Timmy, both Sunbin's kids) — one charge, one family, two `students[]` on the row.
2. **Cross-family joint** (Jeremy + Yuma, different families) — TWO families each charged HALF the session price for the SAME timeblock.

**Schema impact:** The current `students: string[]` field handles same-family fine. Cross-family needs distinct billing splits. Proposing `Session.familyBillingSplits: { familyId, amountCents }[]` so the same time-block creates one Session row per family but the `students[]` enumerates the full group across families. This keeps Stripe charge attribution clean.

### Per-student / per-family / per-tutor pricing
The Excel shows clearly distinct rates for the same student under different conditions ($125, $135, $150, $160, $175, $200, $300, etc.). Paula confirms rates can vary per family AND per student AND (eventually) per tutor.

**Schema impact:** `Session.rate` (snapshot, in cents) is the right field — it captures whatever was actually charged regardless of the source pricing rule. We can layer a `PricingRule` table on later if Paula wants drift-protection or auto-pricing.

### Stripe products = offerings
Paula wants flexibility to add Stripe charge products beyond tutoring: parent education, school STEM fairs, family/parental advising, speaking engagements, math festivals.

**Schema impact:** Add `Session.offering` enum aligned with the 6 categories on `/tutoring`:
`private-tutoring | small-group | parent-advisories | speaking | school-stem | math-festival | general`. Default: `private-tutoring`. Stripe webhook maps `offering → Stripe Product/Price`. Allows Sara to add new offerings without DB migration.

### School field is meaningful — it's coded
The Excel uses 2-3 letter school codes (WL=Woodland, MS=Menlo, PA=Pinewood, KH=Kehillah, SY=Synapse, PB=Phillips Brooks, MA=Menlo-Atherton, OK=Oakwood, LE=La Entrada, FL=Fletcher, CYS=Crystal, HH=Harker, AC=Alta Vista (?), SCU=Santa Clara University, NU=Nueva, GAP=Gap Year, BR=Brown, etc.).

**Schema impact:** `Student.school` is already in v3.0; it should store the **school code**, not free text. We need a small `schools` lookup (probably hard-coded enum) to resolve code → display name. ~12 schools cover 95%+ of rows; long tail goes to "OTHER".

### School login storage (NEW REQUIREMENT)
Paula stores student school logins to act as the "ghost student" — see assignments, communication, etc. **This is secret-grade data**, not a plain DB column.

**Schema impact:** Do NOT put logins in `Student` directly. Reference via:
- `Student.schoolLoginsRef: string` → ARN of an AWS Secrets Manager secret keyed by `studentId`.
- The portal calls the secrets manager only when admin (Paula) opens the credentials drawer — never bulk-loaded.
- Encrypted at rest by Secrets Manager, audit-logged on access.

### Steve as historical tutor — skip
Steve sessions in 2023-2024 (blue-highlighted in Excel, "SEE PRIV TUTORING NOTES" in Col H). Paula explicitly says don't bother capturing him historically.

**Import impact:** All historical rows get `tutorId = tut_paula`. Rows with notes containing "SEE PRIV TUTORING NOTES" get an additional `notes` flag noting "historic external tutor (Steve)" so Paula can find them later if needed.

### Excel columns to use vs ignore
Per Paula:
- **USE:** Col B (PAY_NOTE → rate), Col D (Date), Col E (Student), Col F (Grade), Col G (School), Col H (Work Summary → privateNotes part 1), Col J (Focus Area → privateNotes part 2).
- **IGNORE:** Col A (Check), Col C (MS — placeholder, mostly "O"), Col I (Strengths — empty), all columns past Col J.

### Time + duration STILL not tracked
Confirmed: Paula's Excel doesn't have time-of-day or duration columns either. The Wix mockups Sara built may have specified these. **For import, default `time = "16:00"` and `duration = 60`** and add a flag `timeIsDefaulted: true` so we know NOT to display these as authoritative scheduling info on the calendar.

### Historical scope: 2023-present only
Pre-2023 data is in a separate spreadsheet and Paula explicitly says don't migrate it.

---

## Schema additions to v3.0 from this round

| Field | Where | Type | Notes |
|---|---|---|---|
| `Session.privateNotes` | sessions table | String | admin/tutor only; backend MUST strip from parent endpoints |
| `Session.offering` | sessions table | String enum | `private-tutoring \| small-group \| parent-advisories \| speaking \| school-stem \| math-festival \| general` |
| `Session.familyBillingSplits` | sessions table | List<Map> | for cross-family joint sessions; ` [{familyId, amountCents}, ...]`; null for normal sessions |
| `Session.timeIsDefaulted` | sessions table | Boolean | true on import rows where time/duration are guesses |
| `Student.schoolLoginsRef` | students table | String | ARN of Secrets Manager secret; portal lazily fetches when admin opens credentials drawer |
| `Student.school` | students table | String | now treated as a coded value (`WL`, `MS`, ...), not free text |

No new GSIs needed. No tables added.

---

## Open requests for Paula / Sara

1. **Sara's Wix mockups** — Paula asks if I have access. I don't. Need Sara to share, or Paula to walk us through what they fleshed out.
2. **"Typical day" walkthrough** — Paula offered to show how she toggles between Excel / GSheet / Calendar / Stripe. I want to take her up on this — much faster than reverse-engineering. Schedule when she's back from the Nueva workshop.
3. **School-code dictionary** — confirm the ~12 codes and what "AC" / minor codes resolve to.
4. **Cross-family billing math** — for Jeremy+Yuma at $337.50, who pays what fraction? Equal split? Or is one family paying more because they invited the other?

---

## Reconciliation against Timmy data — earlier findings (2026-04-30)

The Timmy session-notes sheet (Google Sheets, 21 sessions May 30 → Dec 6) was imported into the staging tables via `backend/scripts/import-timmy.ts`. Every GSI returned the expected counts. Findings:

### Confirmed
- `Session.studentId` (PK) + `dateTime` (SK) holds up — one session per student per timestamp.
- Joint sessions ("THOMPSON & TIMMY JOINT SESSION") work as **two rows** with the same `dateTime` and `students = [stu_timmy, stu_thompson]` on each. Both `by-tutor-date` and `by-status` GSIs report once-per-student-per-session, which matches how the billing queue should behave (each student is billed independently even when sessions are shared).
- `tutors.by-clerk-user` GSI is the right shape for sign-in mapping (one row in, one tutor out).
- `parents.by-family` and `students.by-family` GSIs return the household correctly.

### Gaps to ask Sara about
1. **No time-of-day in session notes.** Sheet has DATE only (M/D/YY), no start time. Hard-coded `16:00` UTC on import. Where does Paula record actual session start time — in the master `NEWEST_MATH_CLIENT_INFO` spreadsheet, or is start time even tracked? If not, the `time` field on Session can be optional and the calendar UI defaults to "afternoon".
2. **No duration in session notes.** Hard-coded 60 min on import. Same question — where does duration live? Per-student, per-session, or implied by the session block?
3. **No rate in session notes.** Same. Likely in the Excel master file — confirms our assumption that `Student.defaultRate` + `Session.rate` (snapshot at billing time) is the right two-tier design.
4. **Activities are unstructured text.** Paula writes them as bulleted ALL CAPS lines like `*PRIME CLIMB`, `*SAFARI PARK, 1 - 32`, `*BA NUMBER PATHS, 6 - 8`. The import preserves them in `Session.notes` verbatim (with an `ACTIVITIES:` header). If we want a per-activity tag table later (e.g. "show me all sessions where Timmy played PRIME CLIMB") we'll need to parse these — proposing we DO NOT structure this until/unless Sara asks for activity-level reporting.
5. **Names embedded in notes ("Sunbin", "Andrew", "Yubin", "ALL 3 KG STUDENTS").** Free text. Won't be searchable by-name unless we add an extracted-mentions field. Probably a Phase 4 concern.
6. **Cross-references to "MATERIALS_FROM_PAULA" Drive folder.** Notes reference attachments stored in Google Drive. Schema has no `attachments[]`. Add later if needed.
7. **"FIRST DAY" tracking for joint sessions** is a real, named concept (per 9/9/25 note: *"WHEN IT IS YOUR FIRST DAY, YOU GET TO GO FIRST… IF WE CONTINUE WITH THIS JOINT ARRANGEMENT, THIS WILL BE TRACKED METICULOUSLY."*). Proposing a `Session.firstDayStudentId` optional field on group sessions. **Confirm with Sara.**
8. **The notes are all-caps and parent-facing** (Paula addresses "MOM" directly, asks questions, recommends purchases). The portal must render them faithfully — no auto-lowercasing, no Markdown stripping.

### Date format
Source uses `M/D/YY`. Importer normalizes to ISO `YYYY-MM-DD`. Two-digit years <50 → 20xx, ≥50 → 19xx. Documented in `import-timmy.ts:parseDate`.

### Joint-session encoding rule (de-facto)
For an N-student joint session: write N rows, all sharing `dateTime`, each with its own `studentId` as PK and `students = [studentId_1, ..., studentId_N]` enumerating the full group. Any per-student field (rate, primaryPayer override) attaches to that student's row. The tutor calendar GSI `by-tutor-date` will report N rows for one human-time-block — that's intentional.

---

## Open questions (for Sara — Week 3 meeting)

1. **Per-student primary payer** — do any families actually have Student A paying to Parent 1 and Student B paying to Parent 2? If no, we drop `Student.primaryPayerId` and always use `Family.primaryPayerId`.
2. **Rate source of truth** — is the rate a per-student value that rarely changes (store on `Student`), or does it vary per session (store on `Session`)? Current proposal: both — `Student.defaultRate` used as the default, `Session.rate` is the actual charge.
3. **Session notes** — are notes free text today, or does Paula track structured fields (topics covered, homework assigned)? Affects whether we keep a single `notes` string or add a `topics`/`homework` pair.
4. **Multi-student discounts / sliding scale** — surfaced in v3.0 plan Week 5 check-in. Not captured in this schema yet. Likely belongs on `Family` (`discountPct`) or `Session` (`adjustedRate`).
5. **School list** — confirm the 12 Bay Area schools are an enum we can hardcode, or should `Student.school` be free text?

---

## Provisioning plan

Terraform resources for `families`, `parents`, `tutors`, `users` and the new GSIs on `students` + `sessions` are drafted in `infra/dynamodb.tf` under the `# --- v3.0 additions ---` block. **Do not `terraform apply` until Sara signs off on this document** — adding a GSI to a live table is cheap but reverting a wrong partition key is not.

Staging first: run against a separate `table_prefix = "mathitude-staging"` environment. Validate the Week 4 import there before promoting.
