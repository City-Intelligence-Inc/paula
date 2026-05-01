# Mathitude v3.0 — DynamoDB Schema (Proposed)

**Status:** PROPOSED — partially validated against real data (Timmy session-notes sheet, 21 sessions imported to staging on 2026-04-30). Still need the Excel `NEWEST_MATH_CLIENT_INFO` file before this is final.
**Owner:** Ari · **Reviewer:** Nikki · **Last revision:** 2026-04-30
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

## Reconciliation against real data — what we learned 2026-04-30

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
