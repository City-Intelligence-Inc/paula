# Design System — Mathitude

Source of truth for visual + UX decisions on the Mathitude portal and marketing
pages. Always read this before changing colors, fonts, spacing, or aesthetic
direction. Decided 2026-05-24 via `/design-consultation`.

---

## Product context

- **What this is:** Operations + client-management platform for Mathitude (K-12
  math enrichment/tutoring), with public marketing pages, a parent dashboard,
  and a staff/admin portal.
- **Who it's for:** Two distinct audiences sharing the same brand surface:
  - **Parents** — visit the marketing site, sign in for billing + schedule.
    Warmth, trust, low friction.
  - **Paula + staff** — operator-dense day-to-day use. Speed, scannability,
    precision over decoration.
- **Project type:** Hybrid — marketing pages (editorial), parent dashboard
  (transactional), staff portal (operator dashboard).

## The memorable thing

Mathitude is the **warm operator's portal**. A math studio where the back
office feels handwritten even when it's showing dollar amounts. The brand is
Paula, not Stripe.

Every design decision below serves this. If a choice makes the portal feel
more like a generic Stripe-clone and less like Paula's studio, it's the wrong
choice.

---

## Aesthetic direction

**Editorial-utilitarian.** Warmth at the brand layer (corners, headers,
marketing); surgical precision in the middle (tables, forms, the operator
dashboard). Both halves are necessary — pure editorial slows operators down;
pure utilitarian erases the brand.

**Decoration level:** intentional. Original Surfer brand mark, cream surfaces,
warm semantic palette. No decorative blobs, gradients, or 3-column icon grids.

**Mood:** "Paula's studio". Approachable. Confident. The opposite of a SaaS
dashboard that could belong to any company.

---

## Color

### Brand

| Token | Hex | Usage |
|---|---|---|
| `mathitude-purple` | `#7030A0` | Primary CTA, active states, brand mark, links on hover |
| `mathitude-teal` | `#2AB5B2` | Marketing accents only (not in operator UI) |
| `mathitude-cream` | `#FDF6E3` | Marketing backgrounds (existing) |
| `mathitude-navy` | `#1E293B` | Reserved — dark surfaces if/when we ship dark mode |

### Operator portal surfaces (NEW)

| Token | Hex | Usage |
|---|---|---|
| `surface-paper` | `#FBF7F0` | Admin shell background — replaces `bg-neutral-50` |
| `surface-card` | `#FFFFFF` | Cards, panels, modal surfaces (sits on `surface-paper`) |
| `border-warm` | `#E8E3D9` | Dividers, card borders. Cream-shifted neutral. |
| `text-primary` | `#1A1A2E` | Body text on operator pages (near-black, faint navy tint) |
| `text-muted` | `#6B6F76` | Secondary copy, labels, captions |
| `text-faint` | `#A8A29E` | Disabled, placeholder, very faint metadata |

### Semantic (operator + parent dashboard)

| State | Hex | Notes |
|---|---|---|
| Success | `#0F7B6C` | Moss/teal. Pairs with mathitude-teal. Never `green-500`. |
| Warning | `#B8851A` | Mustard. Pairs with the cream surface. Never `amber-500`. |
| Error | `#B0263C` | Cranberry. Warm-palette failure, never `red-500`. |
| Info | `#7030A0` | Brand purple — info messages use the primary. |

Always pair semantic color with text + icon. Never rely on color alone for
state communication.

### Marketing pages

Marketing pages stay on `bg-white` with `#7030A0` accents. Do not introduce
`surface-paper` to public marketing — the operator portal is where the warm
surface lives. Marketing keeps its existing photography-forward look.

---

## Typography

### Fonts

| Role | Font | Loading | Notes |
|---|---|---|---|
| Display / brand mark | **Original Surfer** | `next/font/google` (already loaded) | Brand-only. Logo, hero on marketing, the occasional decorative title. **Never on admin pages.** |
| UI / body | **Avenir Next** w/ Nunito Sans fallback | Avenir Next is system-licensed on macOS/iOS; Nunito Sans loaded via `next/font/google` | Primary running text everywhere. |
| Data / tabular | **Geist** with `font-variant-numeric: tabular-nums` | `next/font/google` (add) | Financials dashboard, payment tables, anything with aligned numerals. |
| Code / monospace | **Geist Mono** | Already part of Geist family | If/when we ship anything code-shaped. |

**Banned:** Inter, Roboto, Poppins, Space Grotesk, Montserrat, Open Sans. These
are the AI-design-tool convergence fonts. If a vendor library ships one of them
as default, override it at the component level.

### Weights + sizes

- **Marketing body:** weight 300 (the current spacious feel — keep)
- **Operator body:** weight 400 (current 300 is too thin for dense tables)
- **Headings (h1–h6):** weight 400, `letter-spacing: -0.02em` (already set)
- **Brand mark (Original Surfer):** always weight 400, `color: #7030A0`

### Type scale (operator portal)

| Level | Size | Line height | Use |
|---|---|---|---|
| Display | 32px / 2rem | 1.1 | Page title |
| H2 | 20px / 1.25rem | 1.3 | Section heading |
| H3 | 16px / 1rem | 1.4 | Card heading |
| Body | 14px / 0.875rem | 1.55 | Default running text |
| Small | 12px / 0.75rem | 1.5 | Captions, labels |
| Tabular | 14px / 0.875rem | 1.4 | Tables — Geist + tabular-nums |

Marketing scale stays as-is (larger, looser).

---

## Spacing

- **Base unit:** 4px (Tailwind default — keep)
- **Operator density:** comfortable. Card padding 16–24px, section gaps 24–32px.
- **Marketing density:** spacious. Section padding 80–128px stays.

### Scale (already in Tailwind)

| Token | px | Use |
|---|---|---|
| `0.5` | 2 | Hairline gaps |
| `1` | 4 | Inline gaps |
| `2` | 8 | Tight stacking |
| `3` | 12 | Form field gaps |
| `4` | 16 | Default card padding |
| `6` | 24 | Section content padding |
| `8` | 32 | Section vertical rhythm |
| `12` | 48 | Page top padding (operator) |
| `20` | 80 | Marketing section spacing |

---

## Layout

- **Operator approach:** grid-disciplined. Predictable columns, fixed sidebar
  (256px), max content width 1152px.
- **Marketing approach:** editorial. Asymmetric layouts allowed in heroes,
  grid-disciplined in feature sections.
- **Card radius:** 8px (currently `var(--radius) * 0.6 ≈ 3.75px` is too sharp
  for the warm voice). Set base `--radius: 0.5rem` so `--radius-md = 8px`.
- **Button radius:** 6px (`--radius-sm`) for compact buttons, `rounded-full`
  for primary CTAs (already in use, keep).

---

## Motion

- **Operator pages:** minimal-functional. Transitions only on hover/focus
  states and modal/drawer open. No entrance animations on data tables — they
  delay scanning.
- **Marketing pages:** keep the existing fade-in-up + stagger choreography.
- **Easing:** `ease-out` for enter, `ease-in` for exit, `ease-in-out` for move.
- **Duration:** 150ms for state changes, 250ms for surface transitions, never
  exceed 400ms on operator UI.

---

## Risks taken (and why)

The system makes three deliberate departures from the SaaS-portal default.
Naming them so future contributors know they're intentional.

1. **Cream surface (`#FBF7F0`) for the admin shell.** Every shadcn portal uses
   `bg-neutral-50`. The cream differentiates Paula's portal at a glance and
   ties to the existing marketing kit. Cost: looks less "enterprise". Worth
   it because the brand is warmth.
2. **Geist for tabular data.** Adding a font means ~30KB more on the financials
   page. Worth it because that page exists to be scanned; tabular-nums
   alignment is the whole point.
3. **Cranberry error (`#B0263C`) instead of red-500.** Generic stoplight red
   would clash with the cream + purple system. Cranberry keeps failures
   warm-palette. Always pair with icon + text so the affordance survives.

---

## Anti-patterns (do not ship)

- Purple gradients
- 3-column feature grids with icon-in-circle (the AI slop signal)
- Centered-everything page layouts
- Uniform `rounded-full` on all elements (use the hierarchy above)
- `system-ui` as a primary display or body font
- Inter, Roboto, Poppins as primary fonts (overused / convergence)
- Generic semantic colors (`text-red-500`, `bg-amber-100`) — always use the
  warm semantic palette tokens above

---

## Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-24 | Design system established | Paula's admin portal needed a coherent system separating brand from operator. Editorial-utilitarian split chosen over "make it look like Linear". |
| 2026-05-24 | Cream `#FBF7F0` admin shell | Differentiates from every shadcn portal; ties to existing marketing kit. |
| 2026-05-24 | Geist + tabular-nums for financials | Operator dashboard scannability. |
| 2026-05-24 | Cranberry error `#B0263C` over red-500 | Warm-palette failure state. |
| 2026-05-24 | Original Surfer reserved to brand mark only | Operator pages must not slow down with display type. |
| 2026-06-13 | No lavender tints on marketing — warm taupe `#EFEBE5` instead | Pale purple (`#7030A0`/5, `#F2E8FA`) read "too girly"; taupe matches the warm-neutral system. |
| 2026-06-13 | Marketing CTAs: imperative, no articles, no arrows | "Open calendar" not "Open the calendar →". Less is more (Paula). |

---

## Marketing copy + visual rules (learned 2026-06-13 with Paula & Sarah)

Apply these by default on public pages. They came from a live working session; they are settled preferences, not suggestions.

- **Less is more.** One CTA per section. Make the card/section header the link instead of a header + redundant "Learn more" prompt. Cut articles and arrows from link text.
- **No lavender.** Tinted panels use warm taupe `#EFEBE5` with `ring-black/[0.06]`, never a purple tint.
- **Hero headlines:** black text, only the brand word + the key noun in `#7030A0`. No comma/period if the punctuation sits next to the colored words. Brand-script (Original Surfer) for brand-y titles.
- **No auto-popping tours/modals.** Help is opt-in (the `?` floater), never auto-launched.
- **About Paula opener:** "Meet Paula" is the dominant Original Surfer title; the descriptive line is a smaller subordinate subtitle.
- **Process — generalize, don't one-off.** When Paula points at one instance of a pattern (a lavender panel, a redundant CTA, a verbose label), grep for every instance across the codebase and fix them in one commit. Don't wait to be shown each one.
