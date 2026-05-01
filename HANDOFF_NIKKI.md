# Mathitude v3.0 — Handoff for Nikki

**Last updated:** 2026-04-30
**Author:** Ari
**Status:** Phase 2 Week 3 — schema live in staging, ready to QA

---

## TL;DR

Everything in `infra/SCHEMA.md` is provisioned in a **staging** AWS environment. You can:

1. Read the schema and tell me what's wrong before Sara reviews it.
2. Hit the live DynamoDB tables with read/write fixtures (creds below).
3. Browse the deployed website at https://website-sage-three-98.vercel.app — public pages work, admin pages render after sign-in, but the admin pages don't have live data yet because the App Runner backend isn't fully provisioned (still missing Clerk + Stripe production keys).

What I'd like from you this week:
- ✅ Sanity-check the schema (`infra/SCHEMA.md`) against the v3.0 plan
- ✅ Run the smoke test in §3 below (~10 min) and tell me anything looks off
- ✅ Try to break the GSI access patterns in §4 — find a query Paula needs that the current indexes can't answer cheaply

---

## 1. What's live

### AWS (account `050451400186`, region `us-west-2`, prefix `mathitude-staging-`)

12 DynamoDB tables, all `ACTIVE`:

| Table | Purpose | GSIs |
|---|---|---|
| `mathitude-staging-families` | Household / billing unit | (none — looked up via FKs) |
| `mathitude-staging-parents` | Adults | `by-family`, `by-email`, `by-stripe-customer` |
| `mathitude-staging-students` | Children | `by-family`, `by-status` |
| `mathitude-staging-tutors` | Paula + contracted tutors | `by-clerk-user` |
| `mathitude-staging-sessions` | Tutoring sessions | `by-date`, `by-tutor-date`, `by-status` |
| `mathitude-staging-users` | Clerk userId → role mapping | `by-role` |
| `mathitude-staging-payments` | Stripe payment mirror | `by-status` |
| `mathitude-staging-events`, `-resources`, `-content`, `-subscribers`, `-bookings` | Existing tables, kept as-is | various |

ECR repo: `050451400186.dkr.ecr.us-west-2.amazonaws.com/mathitude-staging-backend:latest` (image already pushed)

IAM: `mathitude-staging-apprunner-instance` role has scoped read/write on `mathitude-staging-*` only.

### Frontend
- **Live:** https://website-sage-three-98.vercel.app
- New routes added: `/admin/families`, `/admin/families/:id`
- Existing admin pages (`/admin/students`, `/admin/payments`, etc.) had a pre-existing compile error (`useApi()` hoisted above its import in 6 pages). Fixed in this round — those pages now load.

### Backend (App Runner — NOT YET PROVISIONED)
The container image is in ECR. App Runner service is in Terraform but not applied yet because we still need real Clerk + Stripe + Vercel API keys. When those are in:
```
cd infra
terraform apply -target=aws_apprunner_service.backend
```

---

## 2. Read the schema

Start here: **[`infra/SCHEMA.md`](infra/SCHEMA.md)**

Then look at the test fixtures already loaded in DynamoDB (created during smoke test):

| Table | Fixture |
|---|---|
| families | `fam_smoke` (Sara is primary payer) |
| parents | `par_smoke_1` Sara Smoke (has Stripe `cus_SMOKE`), `par_smoke_2` Andrew Smoke |
| students | `stu_smoke_1` Timmy K, `stu_smoke_2` Thompson K |
| tutors | `tut_paula` Paula Hamilton (linked to Clerk user `user_clerk_paula`) |
| sessions | One completed session for Timmy w/ Paula on 2026-04-30 16:00 |
| users | `user_clerk_paula` → role `admin` |

These are stand-ins for the kind of records the Week 4 import will produce.

---

## 3. Smoke test — run this and report results

### Setup (one time)
```bash
# AWS creds — Ari will share via Slack/1Password, do not paste in chat.
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-west-2
```

### Read existing fixtures
```bash
# A. Show me everyone in the Smoke family (uses parents.by-family GSI)
aws dynamodb query --table-name mathitude-staging-parents --index-name by-family \
  --key-condition-expression "familyId = :f" \
  --expression-attribute-values '{":f":{"S":"fam_smoke"}}' \
  --query 'Items[].{first:firstName.S,last:lastName.S,email:email.S}'

# Expect: Sara + Andrew Smoke

# B. Show me all completed sessions across all students (billing queue)
aws dynamodb query --table-name mathitude-staging-sessions --index-name by-status \
  --key-condition-expression "#s = :v" \
  --expression-attribute-names '{"#s":"status"}' \
  --expression-attribute-values '{":v":{"S":"completed"}}'

# Expect: 1 session — Timmy w/ Paula 2026-04-30 16:00

# C. Stripe webhook lookup: which parent owns customer cus_SMOKE?
aws dynamodb query --table-name mathitude-staging-parents --index-name by-stripe-customer \
  --key-condition-expression "stripeCustomerId = :s" \
  --expression-attribute-values '{":s":{"S":"cus_SMOKE"}}'

# Expect: Sara Smoke
```

### Write your own fixture
```bash
# Add a second tutor and an upcoming session for them.
# This exercises the by-tutor-date GSI which drives the tutor-calendar view.
aws dynamodb put-item --table-name mathitude-staging-tutors --item '{
  "id":{"S":"tut_nikki_test"},
  "firstName":{"S":"Nikki"},"lastName":{"S":"Test"},
  "email":{"S":"nikki@test.com"},
  "active":{"BOOL":true},
  "createdAt":{"S":"2026-04-30T20:00:00Z"},
  "updatedAt":{"S":"2026-04-30T20:00:00Z"}
}'

aws dynamodb put-item --table-name mathitude-staging-sessions --item '{
  "studentId":{"S":"stu_smoke_2"},
  "dateTime":{"S":"2026-05-07T15:00:00Z"},
  "date":{"S":"2026-05-07"},"time":{"S":"15:00"},
  "tutorId":{"S":"tut_nikki_test"},
  "duration":{"N":"45"},"type":{"S":"individual"},
  "status":{"S":"scheduled"}
}'

# Now query the calendar for that tutor
aws dynamodb query --table-name mathitude-staging-sessions --index-name by-tutor-date \
  --key-condition-expression "tutorId = :t" \
  --expression-attribute-values '{":t":{"S":"tut_nikki_test"}}'
# Expect: the session you just wrote
```

If anything above doesn't return the expected result, ping Ari with the command + output.

---

## 4. Try to break the schema

These are the queries the v3.0 plan promises we can serve. For each, confirm the GSI structure can answer it cheaply (single Query, not a Scan).

| Use case | Query Nikki should mentally walk through | Index used |
|---|---|---|
| Family page | "Show me the Smoke family with all their parents and students" | `parents.by-family` + `students.by-family` (parallel queries) |
| Tutor's weekly calendar | "All sessions Paula has Apr 27 – May 4" | `sessions.by-tutor-date` w/ range key `BETWEEN` |
| Billing queue | "All sessions marked `completed`, oldest first" | `sessions.by-status` |
| Stripe webhook | "Which parent owns customer `cus_xyz`?" | `parents.by-stripe-customer` |
| Sign-in flow | "Clerk says user X just logged in — what role are they, and do they own a tutor record?" | `users` PK lookup + `tutors.by-clerk-user` if tutor |
| Import dedup | "Is there already a parent with email `foo@bar.com`?" | `parents.by-email` |
| Student picker for new session | "All active students sorted by last name" | `students.by-status` w/ hash `active` |

**Find me a query Paula or Sara will need that NONE of the current indexes can serve in O(1) Query.** That's the signal we need to add a GSI before Sara signs off. Common gotchas:
- Per-school student lists?
- Sessions for a specific student in a date range? (currently uses base table — works fine)
- "Find this family by parent's phone number"? (currently scan-only)

---

## 5. Frontend QA

Public pages (no auth needed):
- https://website-sage-three-98.vercel.app/ → home, should look the same
- https://website-sage-three-98.vercel.app/balloons → working interactive
- https://website-sage-three-98.vercel.app/tutoring → tutoring page
- https://website-sage-three-98.vercel.app/free-resources

Admin pages (sign in first at `/sign-in`):
- `/admin` → weekly schedule (currently empty in prod — this prod site uses a different DynamoDB account)
- `/admin/families` → **NEW**, will be empty until backend is wired
- `/admin/families/[id]` → **NEW**
- `/admin/students` → was broken before this week, now compiles & renders

⚠️ **The frontend currently points at the old production backend, NOT staging.** Once we provision App Runner with real Clerk keys, I'll flip `NEXT_PUBLIC_API_URL` and the admin pages will start showing the staging fixtures from §2.

---

## 6. Open questions for Sara (Friday meeting)

These come from `infra/SCHEMA.md` §"Open questions". Worth pre-thinking before Friday:

1. **Per-student primary payer** — does Sara know any family where Student A is paid for by Parent 1 and Student B by Parent 2?
2. **Rate** — is it on the student or per-session?
3. **Session notes** — pure free text, or does Paula track structured fields (topics, homework)?
4. **Multi-student discount / sliding scale** — yes/no/how much?
5. **School list** — enum of 12 Bay Area schools, or free text?

---

## 7. What I still need to finish (waiting on inputs)

- Clerk test keys (`pk_test_...`, `sk_test_...`) → provisions App Runner
- Stripe test keys → enables the charge endpoint in staging
- Vercel API token → flips `NEXT_PUBLIC_API_URL` to point at App Runner

Once I have those, the staging environment is reachable end-to-end from a browser and you can QA the full flow in 30 min.

---

## 8. Where things live (file paths)

| What | Path |
|---|---|
| Terraform infra | `infra/` |
| DynamoDB schema doc | `infra/SCHEMA.md` |
| Backend Express app | `backend/src/` |
| New v3.0 routes | `backend/src/routes/{families,parents,tutors,users}.ts` |
| Frontend (Next.js) | `website/src/app/` |
| New admin/families pages | `website/src/app/admin/families/` |
| Typed API client | `website/src/lib/api.ts` (`client(fetchApi)`) |
| Admin students fix | `website/src/app/admin/students/page.tsx` |
