# Sarah's CRM Requirements (from 2026-03-27 call)

## What Sarah Built in Wix (what we need to replicate)

### Student List
> "A list of all the students. Be able to toggle between the students, be able to search for the students, add new student or edit a student. Having a little profile for them."

- Search/filter students
- Add new student (popup form)
- Edit existing student
- Student profiles with meta information
- Currently uses fake names because real client data can't be public

### Session Notes ("Pass Notes")
> "Pass notes, adding a note"

- Per-student session notes/logs
- Ability to add notes after each session
- This is how Paula tracks what happened in each tutoring session

### Dashboard = Weekly Schedule
> "This shouldn't even be her dashboard — this should be like her weekly schedule which you can get to from a dashboard."

- The main admin landing should be the WEEKLY SCHEDULE, not a generic dashboard
- Shows who's coming when, what type of session

### Payment System
> "If you go if the Wix user goes to their account settings page and you scroll down, this is just like embedded HTML and then it has me add a card here and then I can save payment info."

- Client-side: embedded Stripe card form in account settings
- Staff-side: manual "charge this person" button
- Paula is "pretty averse to doing the payment processing ourselves" — Stripe handles compliance
- MindBody used to handle this seamlessly — that's the benchmark

### Auth Wall (Critical)
> "I wanted to screen share right now like the stuff that shouldn't be listed in Google that we like need from the staff side of things"
> "[Paula] would kill me if I had her clients' info just out there"

- All student data MUST be behind authentication
- Currently using fake names as a workaround
- Real names, contact info, session notes, payment info = highly sensitive

### Fields Sarah Mentioned for Student Backend
- Student name
- Grade level
- Status (active/waitlist)
- Parent/guardian contact info
- Session schedule (connected to calendar)
- Session type (individual vs group)
- Session notes/logs per session
- Payment information (card on file via Stripe)
- Rate/pricing

### What Nikki Confirmed as Top 3 Priorities
1. Admin dashboard (the few pages Sarah showed — students, schedule, notes)
2. Stripe integration
3. Basic backend design

### Sarah's Technical Context
- Using Gemini for coding help
- Knows "a little bit of JavaScript"
- Has backend files she built herself
- Self-describes as "full stack now" (learning)
- Would become project manager if better tools are found
- Available Mon-Thu 12-5pm for Paula work
