# Billing & Payments — Live-Card Test Plan
**For:** the live session with Paula & Ari, following up on manual QA session 2 (2026-07-05).
**Why this session exists:** `website-sage-three-98.vercel.app` is wired to **live** Stripe keys, not test keys. Every fake test card (`4242 4242 4242 4242`, `4000 0000 0000 0002`, etc.) fails immediately with `Your card was declined (live_mode_test_card)`. Stripe is correctly refusing to treat a test card as real — this environment genuinely needs a real card to exercise any billing flow. See **Q3** in `QA_BUGS_2026-07-05.md` for the open question of whether this should change going forward; for this session, treat it as given and test with a real card.

---

## Ground rules before starting

- **Use a real card one of you controls** (Paula did this in a past session). Keep amounts small.
- **Never paste the card number anywhere outside the Stripe-hosted field on the actual site.** Not into Slack, not into a Claude session, not into this doc.
- **Refund every real charge immediately after confirming it landed** — check the Stripe dashboard (test... no, live mode, so the real Dashboard) right after each charge, then issue the refund from there before moving to the next test.
- Keep the **Stripe Dashboard** open in a second tab the whole time — several of these checks are really "did Stripe do the right thing," not "did the app show a nice message."
- Do these roughly in order — later ones assume the card from step 1 is already on file.

---

## 1. Card gate (finish test 1.1)
Already partially confirmed in session 2 (no "skip"/"add later" link exists on the payment step — only a card form, with copy stating a card is required to complete registration).
- **Remaining:** enter the real card, confirm it goes through and unlocks the portal (step 3 of onboarding, "All set").

## 2. Card swap (test 1.3)
- Add a **second** real card to the same family (either as the parent, or via the family's admin page).
- Check the app's payment panel: should show **one** card only (the new one).
- Check Stripe Dashboard: the old card's payment method should be **removed/detached**, not just hidden.
- **Fail condition:** two cards remain on the Stripe customer — this is a double-charge risk.

## 3. Statement descriptor (test 1.4)
- Charge one queued session (see "Billing queue" or "Flat-rate charge" on `/admin/billing`).
- Confirm the statement descriptor on the real charge reads **`MATHITUDE`** in the Stripe Dashboard.
- Note: the Billing queue page already displays a banner claiming this is locked/enforced — this test just confirms it holds true against a real charge, not just the UI copy.

## 4. Declined card (test 1.2) — needs a real workaround
Stripe's fake decline number (`4000 0000 0000 0002`) won't work in live mode either — it'll fail with the same `live_mode_test_card` error, not a real decline. To actually exercise the decline path you need a **genuinely failing real card**:
- Easiest: intentionally mistype one digit of a real card number, or use the correct number with a wrong CVC/expiry — this should trigger a real (harmless, no actual charge) decline from the card network.
- Confirm: clear decline message shown, user stays on the payment step, **no charge appears in Stripe** (even a failed attempt sometimes shows as a $0/failed PaymentIntent — check for that too, and make sure it's not silently retried into a real charge).

## 5. Deposits & ledger (test 1.5)
- Admin → Family Ledger → pick a test family → **Record deposit** $500 (this can be a manual/logged entry — confirm whether "deposit" here is a real Stripe charge or just an internal ledger record; if it's a real charge, it counts toward your refund list).
- Log three completed $200 sessions, expand the row.
- Cancel one scheduled session with 30+ days' notice; schedule its make-up.
- **Expected:** first two sessions show "covered by deposit" (deposit used $500 / left $0); cancel-with-notice adds 1 to "banked," make-up session brings it back; a session dated before Aug 1 doesn't appear in charges.

## 6. Payment survives student deletion (second half of test 2.1)
This is the one that got blocked in session 2 — there's no way to log a *completed* payment without a real card, and Payments/Billing queue only offer a `$ Charge` button (no manual/no-card "mark as paid" option exists — confirmed missing, see `QA_BUGS_2026-07-05.md` if worth flagging as a gap on its own).
- Create a fresh throwaway student (**watch out** — student creation breaks if "Parent Name" is a single word with no space; see bug #3 in the bug log).
- Log a session for them, then actually charge it for real (small amount, e.g. $1–5) via the Billing queue.
- Confirm the payment shows as completed in `/admin/payments` and/or `/admin/financials`.
- As the **top-level master admin**, delete the student via the normal UI.
- **Expected:** the student and their sessions disappear; the **payment/financial record must survive** the deletion.
- **Fail condition:** the payment record disappears along with the student — this is the most severe failure mode in the whole billing area (permanent loss of financial history) and was flagged as the highest-risk area in the original QA guide.
- Refund the real charge once you've confirmed it's there.

## 7. While you're at it — resolve Q3
Decide together: should this URL stay on live Stripe keys (deliberate pre-launch verification environment), or move to test-mode keys for day-to-day QA, with live-mode reserved for one final check right before actual launch? Whatever you land on, note it back in the bug log so future QA sessions don't rediscover this from scratch.
