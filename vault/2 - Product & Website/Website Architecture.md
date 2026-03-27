# Website Architecture

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Auth**: Clerk (email/password, social login)
- **Hosting**: Vercel (pending deployment)
- **Scheduling**: Calendly embed (needs Paula's actual link)

## Site Structure

### Public Pages (no auth)
| Route | Content |
|-------|---------|
| `/` | Landing page — hero, about Paula, services, reviews, location/hours/pricing |
| `/sign-in` | Clerk sign-in |
| `/sign-up` | Clerk sign-up |

### Client Dashboard (auth required)
| Route | Content |
|-------|---------|
| `/dashboard` | Welcome page with quick links |
| `/dashboard/courses` | Course materials by grade (Pre-K, K-5, 6-8, 9-12, College) |
| `/dashboard/schedule` | Calendly meet-and-greet scheduler |
| `/dashboard/resources` | Books, YouTube videos, puzzles/PDFs, math tool links |
| `/dashboard/events` | Math festivals, workshops, announcements |

## Design System
- **Primary**: Teal (#2ab5b2) — Mathitude brand
- **Navy**: #2c3e50 — headings, footer
- **Accent colors**: Orange, Purple, Blue, Green — for category coding
- **Fonts**: Poppins (body), Lora (headings/serif)
- **Components**: shadcn/ui (Card, Tabs, Badge, Sheet, ScrollArea, etc.)

## TODO
- [ ] Replace placeholder Calendly URL with Paula's actual link
- [ ] Add real book Amazon/purchase links
- [ ] Add real YouTube video embeds
- [ ] Upload actual PDF files for swamp puzzles
- [ ] Add Paula's photo
- [ ] Add character illustrations (Pascal, Space Chips, Rubik's Boy)
- [ ] Set up Vercel env vars for Clerk keys
