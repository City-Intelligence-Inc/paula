# Mathitude Website — Content TODOs for Sarah

These are things that need to be updated with real content. Each item tells you exactly which file to edit and what to change. You can edit these files directly using Stardrop CLI or any code editor.

---

## Branding (waiting on branding kit)

- [ ] **Logo color** — Replace purple hex code when exact brand purple is confirmed
  - File: `src/app/globals.css` → line with `--color-mathitude-purple: #7c3aed`
  - Change `#7c3aed` to the exact hex from the branding kit

- [ ] **Paula's photo** — Replace placeholder icon with real photo
  - File: `src/components/sections/about-paula.tsx`
  - Replace the `<User>` icon div with an `<Image>` component
  - Put the photo file in `public/images/paula.jpg`

- [ ] **Bucky ball images** — Add to hero section
  - File: `src/components/sections/hero.tsx`
  - Add `<Image>` components with the bucky ball photos
  - Put images in `public/images/`

- [ ] **Character illustrations** (Pascal, Space Chips, Rubik's Boy)
  - These were removed from the hero in the redesign
  - If wanted back, add to `src/components/sections/hero.tsx`

---

## Social Media Links

- [ ] **Facebook** — File: `src/components/sections/footer.tsx` → change `https://facebook.com` to real URL
- [ ] **X/Twitter** — Same file → change `https://twitter.com`
- [ ] **YouTube** — Same file → change `https://youtube.com`
- [ ] **Instagram** — Same file → change `https://instagram.com`

---

## Public Pages Content

- [ ] **Shop Books** — Add real Amazon purchase links
  - File: `src/app/shop/page.tsx`
  - Links currently point to `amazon.com/stores/Paula-Hamilton/author/B07SJ8TZ56`
  - Add individual book URLs if available

- [ ] **Events** — Update with real upcoming events
  - File: `src/app/events/page.tsx`
  - Replace sample events with actual dates and details

- [ ] **Contact** — Verify hours and location info
  - File: `src/app/contact/page.tsx`
  - Confirm: "Menlo Park, CA — one block from Trader Joe's"
  - Confirm hours: Mon-Fri 9am-7pm, Sat 10am-4pm

---

## Dashboard Content

- [ ] **Calendly link** — Replace placeholder with Paula's real Calendly URL
  - File: `src/app/dashboard/schedule/page.tsx`
  - Change `https://calendly.com/d/placeholder` to real URL

- [ ] **Course materials** — Add/update grade-level content
  - File: `src/app/dashboard/courses/page.tsx`
  - Content is currently sample data — update with real materials

- [ ] **Resources** — Populate from DynamoDB via the backend
  - Seed real data using `POST /api/seed` or add individually via `POST /api/resources`

---

## Admin Dashboard

- [ ] **Student data** — Import from Excel sheet
  - Use the seed endpoint or add students one by one via the admin UI
  - Currently has 13 sample students with fake names

- [ ] **Academic calendar** — Research actual school dates
  - Page: `/admin/calendar`
  - Fill in real 2026-2027 dates for the 12 Bay Area schools

- [ ] **Stripe keys** — Replace test keys with real ones
  - Vercel env vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Backend env vars on App Runner: `STRIPE_SECRET_KEY`

---

## How to Edit

**Option A — Stardrop CLI (recommended):**
Tell the CLI what you want to change in plain English. Example:
> "Change Paula's photo to the new image I uploaded to public/images/paula.jpg"

**Option B — Direct file editing:**
Open the file listed above and make the change. Then tell Ari to deploy:
> "Hey, I updated [file]. Can you deploy?"

**Option C — Through the admin dashboard:**
For student data, session notes, and events — use the admin UI at `/admin`.
