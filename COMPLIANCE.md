# How Mathitude Handles Card Data

**A plain-English compliance brief for Paula to forward.**
Updated 2026-05-24. Author: Ari (ari@coframe.com).

---

## In one sentence

Mathitude never sees, transmits, or stores credit card numbers. Cards
go from the parent's browser **directly to Stripe** inside a
Stripe-hosted iframe. Mathitude only ever holds Stripe's reference
tokens (`pm_…`, `cus_…`) and a card's brand + last 4 digits for
display.

Stripe is **PCI DSS Level 1** — the highest tier of card-handler
compliance, the same category as Apple Pay and large banks.

---

## How card data moves

<div style="margin: 22px 0;">
<svg viewBox="0 0 820 560" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:'Avenir Next','Helvetica Neue',Arial,sans-serif;">
  <defs>
    <marker id="ar-purple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#7030A0"/>
    </marker>
    <marker id="ar-dark" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1A1A2E"/>
    </marker>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Lane backgrounds -->
  <rect x="20"  y="20" width="240" height="500" rx="14" fill="#FAFAFA" stroke="#E4E4E7" stroke-width="1.5"/>
  <rect x="290" y="20" width="240" height="500" rx="14" fill="#F5F0FA" stroke="#7030A0" stroke-width="1.5" stroke-dasharray="6 4"/>
  <rect x="560" y="20" width="240" height="500" rx="14" fill="#FAFAFA" stroke="#E4E4E7" stroke-width="1.5"/>

  <!-- Lane titles -->
  <text x="140" y="46" text-anchor="middle" font-size="13" font-weight="700" fill="#1A1A2E" letter-spacing="0.5">PARENT'S BROWSER</text>
  <text x="140" y="62" text-anchor="middle" font-size="10" fill="#6B6F76">our control + Stripe iframe</text>

  <text x="410" y="46" text-anchor="middle" font-size="13" font-weight="700" fill="#7030A0" letter-spacing="0.5">STRIPE — PCI SCOPE</text>
  <text x="410" y="62" text-anchor="middle" font-size="10" fill="#7030A0">Level 1 PCI DSS attested</text>

  <text x="680" y="46" text-anchor="middle" font-size="13" font-weight="700" fill="#1A1A2E" letter-spacing="0.5">MATHITUDE</text>
  <text x="680" y="62" text-anchor="middle" font-size="10" fill="#6B6F76">our servers + DynamoDB</text>

  <!-- Step boxes -->

  <!-- Mathitude UI -->
  <rect x="40"  y="260" width="200" height="62" rx="8" fill="#FFFFFF" stroke="#E4E4E7" filter="url(#soft)"/>
  <text x="140" y="284" text-anchor="middle" font-size="12" font-weight="600" fill="#1A1A2E">Mathitude billing page</text>
  <text x="140" y="302" text-anchor="middle" font-size="10" fill="#6B6F76">our React UI</text>
  <text x="140" y="315" text-anchor="middle" font-size="10" fill="#6B6F76">can't read the iframe</text>

  <!-- Stripe iframe (inside browser, but PCI scoped) -->
  <rect x="40"  y="105" width="200" height="78" rx="8" fill="#FFFFFF" stroke="#7030A0" stroke-width="1.5" filter="url(#soft)"/>
  <text x="140" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="#7030A0">&lt;CardElement /&gt;</text>
  <text x="140" y="146" text-anchor="middle" font-size="10" fill="#6B6F76">Stripe-hosted iframe</text>
  <text x="140" y="160" text-anchor="middle" font-size="10" fill="#6B6F76">served from js.stripe.com</text>
  <text x="140" y="175" text-anchor="middle" font-size="10" fill="#1A1A2E" font-weight="600">parent types card here</text>

  <!-- Stripe API + vault -->
  <rect x="310" y="105" width="200" height="78" rx="8" fill="#FFFFFF" stroke="#7030A0" stroke-width="1.5" filter="url(#soft)"/>
  <text x="410" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="#7030A0">api.stripe.com</text>
  <text x="410" y="146" text-anchor="middle" font-size="10" fill="#6B6F76">Stripe vault</text>
  <text x="410" y="160" text-anchor="middle" font-size="10" fill="#1A1A2E">stores PAN + expiry</text>
  <text x="410" y="175" text-anchor="middle" font-size="10" fill="#1A1A2E">returns pm_… token</text>

  <!-- Mathitude server -->
  <rect x="580" y="260" width="200" height="62" rx="8" fill="#FFFFFF" stroke="#E4E4E7" filter="url(#soft)"/>
  <text x="680" y="284" text-anchor="middle" font-size="12" font-weight="700" fill="#1A1A2E">Next.js server</text>
  <text x="680" y="302" text-anchor="middle" font-size="10" fill="#6B6F76">/api/stripe/...</text>
  <text x="680" y="315" text-anchor="middle" font-size="10" fill="#6B6F76">attaches token to customer</text>

  <!-- DynamoDB -->
  <rect x="580" y="390" width="200" height="62" rx="8" fill="#FFFFFF" stroke="#E4E4E7" filter="url(#soft)"/>
  <text x="680" y="414" text-anchor="middle" font-size="12" font-weight="700" fill="#1A1A2E">DynamoDB</text>
  <text x="680" y="432" text-anchor="middle" font-size="10" fill="#6B6F76">encrypted at rest, AWS-managed KMS</text>
  <text x="680" y="446" text-anchor="middle" font-size="10" fill="#1A1A2E">stores cus_…, pm_… only</text>

  <!-- Numbered arrows -->

  <!-- 1. iframe → Stripe (PAN over TLS) -->
  <line x1="240" y1="138" x2="310" y2="138" stroke="#7030A0" stroke-width="2.5" marker-end="url(#ar-purple)"/>
  <circle cx="275" cy="118" r="11" fill="#7030A0"/>
  <text x="275" y="122" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">1</text>
  <text x="275" y="155" text-anchor="middle" font-size="9" fill="#7030A0" font-weight="600">PAN, TLS 1.2+</text>

  <!-- 2. Stripe → iframe (token back) -->
  <line x1="310" y1="158" x2="240" y2="158" stroke="#7030A0" stroke-width="2.5" marker-end="url(#ar-purple)"/>
  <circle cx="275" cy="178" r="11" fill="#7030A0"/>
  <text x="275" y="182" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">2</text>
  <text x="275" y="198" text-anchor="middle" font-size="9" fill="#7030A0" font-weight="600">pm_… token</text>

  <!-- 3. Stripe iframe → Mathitude UI (token only, in-browser) -->
  <line x1="140" y1="183" x2="140" y2="260" stroke="#1A1A2E" stroke-width="2.5" marker-end="url(#ar-dark)"/>
  <circle cx="155" cy="220" r="11" fill="#1A1A2E"/>
  <text x="155" y="224" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">3</text>
  <text x="175" y="222" text-anchor="start" font-size="9" fill="#1A1A2E" font-weight="600">pm_… handed to our JS</text>

  <!-- 4. UI → server (HTTPS, token-only) -->
  <line x1="240" y1="290" x2="580" y2="290" stroke="#1A1A2E" stroke-width="2.5" marker-end="url(#ar-dark)"/>
  <circle cx="410" cy="270" r="11" fill="#1A1A2E"/>
  <text x="410" y="274" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">4</text>
  <text x="410" y="306" text-anchor="middle" font-size="9" fill="#1A1A2E" font-weight="600">HTTPS — token + parentId, no PAN</text>

  <!-- 5. Server → Stripe (attach token) -->
  <line x1="630" y1="260" x2="500" y2="190" stroke="#1A1A2E" stroke-width="2.5" marker-end="url(#ar-dark)"/>
  <circle cx="565" cy="220" r="11" fill="#1A1A2E"/>
  <text x="565" y="224" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">5</text>
  <text x="555" y="245" text-anchor="end" font-size="9" fill="#1A1A2E" font-weight="600">attach pm_… to cus_…</text>

  <!-- 6. Server → DynamoDB (persist token) -->
  <line x1="680" y1="322" x2="680" y2="390" stroke="#1A1A2E" stroke-width="2.5" marker-end="url(#ar-dark)"/>
  <circle cx="695" cy="356" r="11" fill="#1A1A2E"/>
  <text x="695" y="360" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">6</text>
  <text x="713" y="360" text-anchor="start" font-size="9" fill="#1A1A2E" font-weight="600">cus_…, pm_… persisted</text>

  <!-- Legend -->
  <g transform="translate(40, 480)">
    <line x1="0"  y1="6" x2="28" y2="6" stroke="#7030A0" stroke-width="2.5"/>
    <text x="34" y="10" font-size="10" fill="#1A1A2E">Card data (steps 1–2 only) — never leaves Stripe.</text>
    <line x1="0"  y1="26" x2="28" y2="26" stroke="#1A1A2E" stroke-width="2.5"/>
    <text x="34" y="30" font-size="10" fill="#1A1A2E">Token paths (steps 3–6) — carries only Stripe references.</text>
  </g>
</svg>
</div>

The card number lives inside the dashed purple zone — never outside.
Steps 1 and 2 happen between Stripe's iframe and Stripe's servers; our
JavaScript and our backend are not on those hops. Steps 3, 4, 5, 6
carry **only** Stripe's reference tokens.

---

## What Mathitude has (and what Mathitude doesn't)

### We have

| Data | Sensitivity | Where it lives |
|---|---|---|
| Stripe customer reference (`cus_…`) | Non-sensitive | DynamoDB `parents` table |
| Stripe payment method reference (`pm_…`) | Non-sensitive | DynamoDB |
| Card brand (Visa, Mastercard, …) | Non-sensitive | DynamoDB `payments` + display only |
| Last 4 digits of card | Non-sensitive (per PCI DSS) | DynamoDB + display only |
| Card expiry month / year (for display) | Non-sensitive | DynamoDB + display only |
| Charge history (amount, status, date) | Business data | DynamoDB `payments` |

### We do not have

- Full card number (PAN)
- CVV / CVC
- Cardholder name (Stripe holds it)
- Billing ZIP (Stripe holds it)
- Anything that could be used to charge the card without Stripe

These remain on Stripe's PCI-compliant infrastructure. We could not
hand them to a hacker, a subpoena, or a curious bookkeeper because we
do not possess them.

---

## Data model — one card per parent

Each parent on a family has their own Stripe customer with exactly one
card on file. A family can have multiple parents, so a family can have
multiple cards available. The family record points at one parent as
the **primary payer** — that's whose card gets charged. Switching the
primary payer is a one-click action; the system charges the new
parent's card from the next billing event onward.

This matches real-world households: husband adds his card under his
parent record, wife under hers, and Paula picks whose card runs at
billing time.

---

## Access controls

### Two admin tiers

- **Master admin** — full control, including adding/removing other
  admins. Bootstrap master admins (Paula, Ari, Nikki) are hard-coded
  and cannot be removed via the UI.
- **Admin** — full operator access to families, students, sessions,
  billing, payments, financials. Cannot manage other admins; if a
  plain admin tries to mutate the admin list, the server returns 403.

Both tiers sign in through Clerk (a SOC 2 Type 2 attested identity
provider). There is no admin path that doesn't go through Clerk.

### Stripe API key

We use a Stripe **restricted key** (`rk_…`) scoped to the four
permissions we actually need: payment methods, customers, payment
intents, setup intents. The key is stored encrypted at rest in
DynamoDB and is never returned in any HTTP response — only the last
4 characters appear in the diagnostic display under Settings → Stripe.

### Webhooks

Every incoming Stripe webhook event is verified against our
`STRIPE_WEBHOOK_SECRET` before being acted on. Forged or
stale-timestamped events are rejected with HTTP 400. This prevents
a third party from sending fake "payment succeeded" events to mark
debts as paid.

### Logs

`grep -r "cardNumber\|card_number\|pan" src/` returns zero hits across
the codebase. Application logs (Vercel + AWS CloudWatch) contain no
PANs.

---

## Questions Paula might be asked

**Where is my card stored?**
On Stripe's servers, the same infrastructure used by Lyft, Shopify,
Substack, Slack, and tens of thousands of other businesses. Stripe is
PCI DSS Level 1 attested — the top compliance tier. Mathitude has a
reference to your card, not the card itself.

**Can a Mathitude employee see my card number?**
No. The card number never reaches Mathitude's servers, and Mathitude's
JavaScript can't read inside Stripe's input field. The strongest claim
isn't a policy; it's that we don't have the data to look at.

**What if Mathitude's database gets hacked?**
An attacker would see Stripe reference tokens (which require Mathitude's
restricted Stripe key to use) and the last 4 digits of cards. They
would not see card numbers, expiries, or CVCs because those are not in
the database. The Stripe key itself is encrypted at rest with an
AWS-managed key; access logs would show any read.

**What if Stripe gets hacked?**
Then everyone who uses Stripe (including most of the internet) has a
problem. Stripe carries Level 1 PCI attestation precisely to make this
extremely unlikely.

**How do you charge me without seeing my card?**
We call Stripe's API and say: "Charge $100 from customer `cus_xyz`
using payment method `pm_abc`." Stripe handles the actual card
transaction. Our request never includes a card number.

**Can I get a copy of this?**
Yes — Paula has the PDF version. If you want a fresh dated copy, ask
her.

---

## SOC 2 path (if and when Mathitude wants its own attestation)

Stripe, Clerk, AWS, Vercel — all of Mathitude's sub-processors carry
their own SOC 2 attestations. Most of the controls a SOC 2 auditor
would check for Mathitude are inherited from those vendors.

The Mathitude-side work is access logging, encryption verification,
vendor management, and an incident-response runbook. Realistic cost:
~$10–15K/year for a compliance vendor (Vanta, Drata, Secureframe),
~3 months for Type 1 attestation, ~9 months for Type 2.

Cheapest first step today: enable AWS CloudTrail with 365-day retention
+ GuardDuty. <$50/month, required evidence for any future audit.

---

## Sign-off checklist

| Question | Answer |
|---|---|
| Does Mathitude see card numbers? | No. |
| Does Mathitude transmit card numbers to its own servers? | No. |
| Does Mathitude store card numbers? | No — only Stripe references. |
| Is Stripe PCI-compliant? | Yes, Level 1 (highest tier). |
| Are admin actions authenticated? | Yes, via Clerk. |
| Are admin mutations restricted to master admin? | Yes. |
| Are Stripe webhooks signature-verified? | Yes. |
| Is the database encrypted at rest? | Yes, AWS KMS. |
| Can a Mathitude breach leak card data? | No — we don't have it to leak. |

Maintainer: Ari ([ari@coframe.com](mailto:ari@coframe.com)). Latest
version always at `COMPLIANCE.md` in the Mathitude repository.
