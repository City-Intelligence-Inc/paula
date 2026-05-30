# Mathitude v3.0 — Demo Checklist

**Live site:** https://website-sage-three-98.vercel.app
**Audience:** Paula (+ Sara)
**Last updated:** 2026-05-30

Sign in first as an admin (`ari@coframe.com` — already a bootstrap admin), then walk top to bottom.

---

## 0. Before the call (2 min)
- [ ] Sign in in your browser → confirm you land on `/admin` (operations dashboard)
- [ ] Open a second tab on the public site (`/`) so switching is fast

## 1. Public site — Paula's branding / content asks
- [ ] `/math-engagement` — 60/40 split removed, wording is general (Paula flagged this)
- [ ] `/tutoring/private` — no waitlist, no 60/40
- [ ] `/tutoring/camps` — "8–12 week small group classes"; purple box near bottom: *"Summer or school break? Inquire…"*
- [ ] `/contact` — new copy ("Tell us a little about your student…"), **770 Menlo Ave**, Student Info **required**, submit button is **ALL CAPS**

## 2. Admin portal — operational core
- [ ] `/admin` — today's sessions, pending billing, recent card updates
- [ ] `/admin/families` — open a family → parents + students + payment + session history in one view
- [ ] On the family page: **multi-parent** ("Parents & caregivers" + relationship), **Add sibling**, **Primary Payer** indicator
- [ ] `/admin/students/[a student]` — **multi-tutor assignment** (Paula's "one student, two tutors" question)
- [ ] `/admin/billing` — completed-sessions queue → edit rate/duration → "Approve for billing" (charges carry `MATHITUDE` descriptor; admin never types a name)
- [ ] `/admin/calendar` — weekly view, filter by tutor
- [ ] `/admin/tutors` — add/remove tutor, assign students
- [ ] `/admin/consultations` — contact-form submissions land here (Paula's "where does the form data go?")

## 3. ⭐ New feature — School-login vault (Paula's direct request)
- [ ] On any student page, **scroll to the very bottom** → **"School portal logins"** card (🔒 Admin only)
- [ ] "Add login" → fill portal / username / password → **eye to reveal, copy button** → Save changes
- [ ] Say: *"Only the master admin sees these — tutors and parents never will."* (the ghost-student access point)

## 4. Parent + tutor portals (shows role isolation)
- [ ] `/dashboard/billing` — parent card management (Stripe Elements, staged "Save Changes")
- [ ] `/tutor` — rolling 7-day schedule, only their own students (Paula's "tutors see only their own")
- [ ] Calendar invite → `.ics` download (the Yahoo-client point — works outside Google Calendar)

## 5. If Paula asks → where it lives
| Question | Answer / location |
|---|---|
| "How do I know a card was updated?" | Notifications inbox + admin email, with **last 4 digits** |
| "Shared session, two parents paying?" | Payer split on billing (the Jeremy & Yuma case) |
| "Group class enrollment + size cap?" | **Not built yet** — post-launch (when she offers classes) |
| "How do I pull all the data out?" | **CSV export** button on every admin list |

## 6. ⚠️ Heads-up (avoid / pre-empt)
- [ ] **Student names are fake** — sample data for now. Tell Paula real import comes later from her Excel.
- [ ] **Stripe is test mode** — Wix is still live and untouched.
- [ ] **Hero video missing** — waiting on the asset from Sara.
- [ ] **Roles are admin-by-default** — you can show the isolation *design*, but real parent/tutor logins get enforced before launch.

---

## Known launch gates (not blocking the demo, but track them)
1. **Clerk production keys** in Vercel env (site is on dev keys → console warning).
2. **Real data import** from Paula's Excel/Sheets → DynamoDB.
3. **RBAC enforcement** flip + assign role rows (currently every signed-in user is admin).
4. **Live Stripe keys** + DNS cutover (Phase 6).
