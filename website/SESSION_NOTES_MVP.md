# Session Notes + Roles — MVP (first go)

Built by Nikki (with Lucien); **Ari reviews + wires live data**. Covers the
FEATURE_LIST `Roles` (R-1..R-7) and `Notes` (N-1..N-9) categories only.

## Preview it

```bash
cd website && npm run dev
# open http://localhost:3000/staff-log-session
```

Runs on **synthetic data** — no real student information (the bulk student
records in the STARDROP export were deliberately left untouched). The "Demo ·
view as" switcher shows every portal's visibility in one place; in production
the role comes from the signed-in user, not a dropdown.

## What's built

| File | What |
|---|---|
| `src/lib/session-notes.ts` | Schema contract + role→field visibility + synthetic seed. **The drop-in point for real data.** |
| `src/components/notes/rich-text.tsx` | Dependency-free rich text (N-4/N-7) + HTML sanitizer + the N-5 `@`-mention menu |
| `src/components/notes/session-notes-board.tsx` | The 4-field chart: input row + history, sticky headers, role-gated columns |
| `src/components/ui/switch.tsx` | The "In-session view" toggle (N-3) |
| `src/app/staff-log-session/page.tsx` | The page + demo role switcher |
| `src/app/api/students/[id]/session-notes/route.ts` | Real API: GET (role-gated) / POST / PUT (upsert, editable) |
| `src/app/api/note-resources/route.ts` | Real API: N-5 shortcut library (GET/POST) |
| `src/lib/server/access.ts` | `noteForActor` / `stripStaffOnlyNoteFields` — field gating |
| `src/lib/session-notes.test.ts` | 11 passing unit tests for the visibility logic |

## Spec coverage

- **R-1..R-7** — five roles; header role chip; field/billing visibility per role.
  Code keeps `master_admin/admin` internally and shows spec labels via an alias
  map (no risky `access.ts` rename).
- **N-1** four fields, left→right: Session Plan · Private Notes · Session
  Activities · Public Notes. **N-2/N-6** history stacked beneath each field,
  most-recent-first, sticky headers (recent 5 expanded). **N-3** In-session
  toggle hides Private Notes. **N-4/N-7** rich text. **N-5** `@`-mention resource
  library. **N-8** staff see all four; **N-9** parents/students see only
  Session Activities + Public Notes.

## Decisions locked (with Nikki)

1. **Group sessions** = shared Plan/Activities/Public across the group; **Private
   Notes per student**. Stored one item per student (sessions table is keyed by
   `studentId`), tied by `noteGroupId`. Each family only sees their own → siblings
   never cross over.
2. Notes are **editable** (one record per session), not append-only.
3. **Submit** saves + sets `readyToNotify`; Ari's notifier sends the email.
4. Office Staff **view** all four; only Tutors + Super Admin **author/edit**.
5. History window = most recent 5 (rest behind "Show older").
6. N-5: anyone adds a shortcut; only Super Admin deletes (delete not in MVP).

## Ari's hookup checklist (live data)

1. **No new table needed.** Session notes are `type:"session-note"` items on the
   existing `sessions` table; N-5 shortcuts live in `resources` under
   `category:"tutor-shortcut"`. No Terraform apply.
2. Point the page at the API: in `staff-log-session/page.tsx` swap the `DEMO_*`
   seeds for `GET /api/students/:id/session-notes` and `GET /api/note-resources`;
   `onSaveNote` → `POST/PUT`; `onCreateShortcut` → `POST /api/note-resources`.
3. **Parent/student read path** is intentionally *not* in this route (it denies
   non-staff to avoid cross-family leaks). Wire the family-facing read on the
   dashboard, resolving the student from the family link, then reuse
   `noteForActor` to strip staff-only fields.
4. Hook `readyToNotify` into the existing `session-notify` flow (173 tests).
5. Re-run RBAC integration tests — `access.ts` gained note-field gating.

## Not in this MVP

- Live auth wiring / parent-student dashboard read path (Ari).
- N-5 shortcut **delete** UI (Super-Admin-only).
- Production deploy — repo's deploy is Vercel, which is restricted; that path
  needs to move (flag for Ari).

## Verification

- **Unit** (`npm test`, no DB): pure-function rules — role visibility, scoping, group isolation, sanitizer. Notes suite 55 tests; full repo suite 228, all passing.
- **Integration** (`npm run db:local` then `npm run test:integration`): the real `session-notes-core` against a local dynalite DynamoDB — proves RBAC *behavior* + persistence (super admin writes & persists; office staff/parent/unassigned-tutor get 403; limited tutor sees only own notes). 9 tests, idempotent.
- `tsc --noEmit` clean · `eslint` clean · `next build` OK.

**Still needs Ari (not covered by either):** real Clerk auth resolution (the integration tests mock the actor), real AWS DynamoDB, and a browser/E2E smoke per role on staging. The route is now a thin shell over the integration-tested `lib/server/session-notes-core.ts`, so the live wiring is small.
