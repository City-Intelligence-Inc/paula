// Demo scenarios — one per tracker row that still needs a visual in the
// sheet. Each scenario drives the LIVE site read-only: navigate, scroll,
// hover, type into filters — but NEVER submit anything that mutates data
// (no charges, no copies, no invites). Destructive buttons are hovered, not
// clicked; confirm() dialogs are auto-dismissed by the runner as a backstop.
//
// auth: "admin" scenarios need scripts/demos/auth-admin.json;
//       "parent" scenarios need auth-parent.json (both optional — scenarios
//       without their auth file are skipped with a note).

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// Best-effort interaction: a demo must never die because a hover/click
// target moved — the page footage is the deliverable.
const attempt = (fn) => fn().catch(() => {});

// Slow, watchable scrolling — demos are for humans.
async function drift(page, px = 600, step = 24) {
  for (let y = 0; y < px; y += step) {
    await page.mouse.wheel(0, step);
    await pause(40);
  }
}

export const SCENARIOS = [
  {
    id: "R-8",
    title: "Users — roles, invites, offboarding",
    auth: "admin",
    run: async (page, base) => {
      await page.goto(`${base}/admin/users`);
      await page.waitForLoadState("networkidle");
      await pause(1500);
      await drift(page, 900);
      const invite = page.locator("text=Invite a new user").first();
      if (await invite.count()) await invite.scrollIntoViewIfNeeded();
      await pause(2000);
    },
  },
  {
    id: "N-6",
    title: "Session-note comment threads",
    auth: "admin",
    run: async (page, base) => {
      await page.goto(`${base}/notes`);
      await page.waitForLoadState("networkidle");
      await pause(1500);
      const toggle = page.locator("text=/^Comments/").first();
      if (await toggle.count()) {
        await toggle.scrollIntoViewIfNeeded();
        await toggle.click(); // opening a thread is read-only
        await pause(1500);
      }
      await drift(page, 700);
      await pause(1500);
    },
  },
  {
    id: "F-1",
    title: "Shared files — drag-and-drop upload zone",
    auth: "admin",
    run: async (page, base) => {
      await page.goto(`${base}/admin/students`);
      await page.waitForLoadState("networkidle");
      const first = page.locator("a[href^='/admin/students/']").first();
      if (await first.count()) {
        await first.click();
        await page.waitForLoadState("networkidle");
      }
      const zone = page.locator("text=Drop a file here").first();
      if (await zone.count()) {
        await zone.scrollIntoViewIfNeeded();
        await zone.hover();
      }
      await pause(2500);
    },
  },
  {
    id: "B-2",
    title: "Fractional hours & payer splits on the session form",
    auth: "admin",
    run: async (page, base) => {
      await page.goto(`${base}/admin/sessions/new`);
      await page.waitForLoadState("networkidle");
      await pause(1500);
      await drift(page, 800); // show duration + payer-split fields; DO NOT submit
      await pause(2000);
    },
  },
  {
    id: "B-4",
    title: "Family ledger — deposit drawdown & banked sessions",
    auth: "admin",
    run: async (page, base) => {
      await page.goto(`${base}/admin/ledger`);
      await page.waitForLoadState("networkidle");
      await pause(1500);
      const row = page.locator("tbody tr").first();
      if (await row.count()) {
        await row.click(); // expand drawdown detail — read-only
        await pause(2000);
      }
      await drift(page, 500);
      await pause(1500);
    },
  },
  {
    id: "B-6",
    title: "Billing history — staff view",
    auth: "admin",
    run: async (page, base) => {
      await page.goto(`${base}/admin/payments`);
      await page.waitForLoadState("networkidle");
      await pause(1500);
      await drift(page, 800);
      await pause(1500);
    },
  },
  {
    id: "D-2",
    title: "Copy last week — tutor-level schedule duplication",
    auth: "admin",
    run: async (page, base) => {
      await page.goto(`${base}/admin`);
      await page.waitForLoadState("networkidle");
      await pause(1500);
      const btn = page.getByRole("button", { name: /copy last week/i }).first();
      await attempt(async () => {
        await btn.scrollIntoViewIfNeeded({ timeout: 5000 });
        await btn.hover({ timeout: 5000 }); // hover only — clicking would duplicate the week
      });
      await pause(2000);
      await drift(page, 500);
      await pause(1000);
    },
  },
  {
    id: "D-3",
    title: "Admin command deck — daily counts, approvals, card updates",
    auth: "admin",
    run: async (page, base) => {
      await page.goto(`${base}/admin`);
      await page.waitForLoadState("networkidle");
      await pause(2500);
      await drift(page, 400);
      await pause(2000);
    },
  },
  {
    id: "C-2",
    title: "Contacts database with Mailchimp sync + response log",
    auth: "admin",
    run: async (page, base) => {
      await page.goto(`${base}/admin/contacts`);
      await page.waitForLoadState("networkidle");
      await pause(1500);
      await attempt(async () => {
        // Expand the first contact's profile log — read-only.
        const row = page.locator("button:has-text('@')").first();
        await row.click({ timeout: 5000 });
        await pause(2000);
      });
      await drift(page, 500);
      await pause(1500);
    },
  },
  {
    id: "C-3",
    title: "Public inquiry form (lead capture, mailing-list fine print)",
    auth: null, // public
    run: async (page, base) => {
      await page.goto(`${base}/contact`);
      await page.waitForLoadState("networkidle");
      await page.fill("#name", "Demo Parent").catch(() => {});
      await page.fill("#email", "demo@example.com").catch(() => {});
      await page.fill("#studentInfo", "Maya, 4th grade").catch(() => {});
      await drift(page, 600);
      await pause(2000); // filled but NEVER submitted
    },
  },
  {
    id: "C-9",
    title: "Hidden registration — locked email + expired-link error page",
    auth: null, // public
    run: async (page, base) => {
      await page.goto(`${base}/register?token=demo-expired-token-000000`);
      await page.waitForLoadState("networkidle");
      await pause(3000); // shows the C-1 error/expiry page
    },
  },
  {
    id: "C-7",
    title: "Student profile — instant parent search, rate, payer",
    auth: "admin",
    run: async (page, base) => {
      await page.goto(`${base}/admin/students`);
      await page.waitForLoadState("networkidle");
      const first = page.locator("a[href^='/admin/students/']").first();
      if (await first.count()) {
        await first.click();
        await page.waitForLoadState("networkidle");
      }
      const search = page.locator("input[placeholder='Search parents…']").first();
      if (await search.count()) {
        await search.scrollIntoViewIfNeeded();
        await search.click();
        await search.pressSequentially("a", { delay: 300 }); // shows matches; no selection
        await pause(1500);
        await search.fill("");
      }
      await pause(1500);
    },
  },
  {
    id: "C-8",
    title: "Family profile — student search, cards on file, history",
    auth: "admin",
    run: async (page, base) => {
      await page.goto(`${base}/admin/families`);
      await page.waitForLoadState("networkidle");
      const first = page.locator("a[href^='/admin/families/']").first();
      if (await first.count()) {
        await first.click();
        await page.waitForLoadState("networkidle");
      }
      await pause(1000);
      await drift(page, 1200);
      await pause(2000);
    },
  },
  {
    id: "C-10",
    title: "Parent contract tab (in-portal PDF)",
    auth: "parent",
    run: async (page, base) => {
      await page.goto(`${base}/dashboard/contract`);
      await page.waitForLoadState("networkidle");
      await pause(3500);
    },
  },
  {
    id: "B-5",
    title: "Card on file — parent billing view",
    auth: "parent",
    run: async (page, base) => {
      await page.goto(`${base}/dashboard/billing`);
      await page.waitForLoadState("networkidle");
      await pause(1500);
      await drift(page, 600);
      await pause(2000);
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────
// FULL-TASK scenarios (opt-in via `npm run demos -- --tasks`). These perform
// the real workflow end to end — every step ASSERTS success (so each video
// is also an e2e test run) and every scenario cleans up its own demo data
// before the recording ends. Demo entities are clearly labeled and use
// @example.com addresses. The runner ACCEPTS confirm() dialogs for these.

const DEMO = {
  inviteEmail: "demo-invite@example.com",
  familyEmail: "demo-family@example.com",
  contactEmail: "demo-contact@example.com",
};

// Call the app's own API from inside the recorded page (admin cookies ride
// along). Throws on non-2xx so failures surface as scenario failures.
async function api(page, path, opts = {}) {
  const res = await page.evaluate(
    async ({ path, opts }) => {
      const r = await fetch(path, {
        method: opts.method || "GET",
        headers: { "Content-Type": "application/json" },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
      let json = null;
      try {
        json = await r.json();
      } catch {}
      return { ok: r.ok, status: r.status, json };
    },
    { path, opts },
  );
  if (!res.ok && !opts.allowFail) {
    throw new Error(`${opts.method || "GET"} ${path} → ${res.status}: ${JSON.stringify(res.json)}`);
  }
  return res.json;
}

async function mustSee(page, text, timeout = 15000) {
  await page.locator(`text=${text}`).first().waitFor({ state: "visible", timeout });
}

export const TASK_SCENARIOS = [
  {
    id: "R-8-full",
    title: "FULL TASK: invite a user, see it pending, copy link, revoke",
    auth: "admin",
    task: true,
    run: async (page, base) => {
      await page.goto(`${base}/admin/users`);
      await page.waitForLoadState("networkidle");
      // Pre-clean any leftover from an aborted run.
      const pre = await api(page, "/api/admin/invites").catch(() => null);
      for (const inv of pre?.invites || []) {
        if (inv.email === DEMO.inviteEmail && !inv.usedAt) {
          await api(page, `/api/admin/invites?token=${encodeURIComponent(inv.token)}`, { method: "DELETE", allowFail: true });
        }
      }
      await page.reload();
      await page.waitForLoadState("networkidle");
      await pause(1500);

      // Fill the invite form.
      await page.fill("input[placeholder='parent@example.com']", DEMO.inviteEmail);
      await page.locator("form select").first().selectOption("parent");
      const nameInputs = page.locator("form input.w-32");
      await nameInputs.nth(0).fill("Demo");
      await nameInputs.nth(1).fill("Lead");
      await pause(800);
      await page.getByRole("button", { name: /send invitation/i }).click();

      // Assert: pending row appears.
      await mustSee(page, DEMO.inviteEmail);
      await pause(2000);

      // Copy link (clipboard call may be blocked headless — best effort).
      await attempt(() => page.getByText("Copy link").first().click({ timeout: 3000 }));
      await pause(1200);

      // Revoke (confirm auto-accepted) and assert the row is gone.
      await page.getByText("Revoke").first().click();
      await page.locator(`text=${DEMO.inviteEmail}`).first().waitFor({ state: "hidden", timeout: 15000 });
      await pause(2000);
    },
  },
  {
    id: "C-1-C-9-full",
    title: "FULL TASK: approve → tokenized invite → registration → family created → offboarded",
    auth: "admin",
    task: true,
    run: async (page, base) => {
      await page.goto(`${base}/admin/users`);
      await page.waitForLoadState("networkidle");

      // Pre-clean leftovers from any aborted run.
      const famsPre = await api(page, "/api/families");
      for (const f of famsPre.families || []) {
        if ((f.parents || []).some((p) => p.email === DEMO.familyEmail)) {
          for (const s of f.students || []) {
            await api(page, `/api/students/${s.id}`, { method: "DELETE", allowFail: true });
          }
          await api(page, `/api/families/${f.id}`, { method: "DELETE", allowFail: true });
        }
      }
      await api(page, `/api/admin/contacts?email=${encodeURIComponent(DEMO.familyEmail)}`, { method: "DELETE", allowFail: true });

      // C-1: create the tokenized invitation (as the admin approval would).
      const created = await api(page, "/api/admin/invites", {
        method: "POST",
        body: { email: DEMO.familyEmail, role: "parent", firstName: "Demo", lastName: "Family" },
      });
      const token = created.invite.token;
      await pause(1000);

      // C-9: the family's side — hidden registration with the locked email.
      await page.goto(`${base}/register?token=${token}`);
      await page.waitForLoadState("networkidle");
      const emailField = page.locator(`input[value='${DEMO.familyEmail}']`).first();
      await emailField.waitFor({ timeout: 15000 });
      if (!(await emailField.isDisabled())) throw new Error("C-9 violation: email field is editable");
      await pause(2000);

      await page.locator("input").nth(1).fill("Demo");
      await page.locator("input").nth(2).fill("Family");
      // Child card
      const childInputs = page.locator(".rounded-lg.border input");
      await childInputs.nth(0).fill("Demo");
      await childInputs.nth(1).fill("Kid");
      await childInputs.nth(2).fill("Demo School");
      await page.locator(".rounded-lg.border select").first().selectOption("4");
      await pause(1500);
      await page.getByRole("button", { name: /complete registration/i }).click();
      await mustSee(page, "all set");
      await pause(2500);

      // Single-use proof: reload the link → already used.
      await page.goto(`${base}/register?token=${token}`);
      await mustSee(page, "Invitation not available");
      await pause(2000);

      // Back office: the family + student exist.
      const fams = await api(page, "/api/families");
      const fam = (fams.families || []).find((f) =>
        (f.parents || []).some((p) => p.email === DEMO.familyEmail),
      );
      if (!fam) throw new Error("registration did not create the family");
      await page.goto(`${base}/admin/families/${fam.id}`);
      await mustSee(page, "Demo Kid");
      await pause(3000);

      // R-8 offboarding: hard-delete student then family (super admin).
      for (const s of fam.students || []) {
        await api(page, `/api/students/${s.id}`, { method: "DELETE" });
      }
      await api(page, `/api/families/${fam.id}`, { method: "DELETE" });
      await api(page, `/api/admin/contacts?email=${encodeURIComponent(DEMO.familyEmail)}`, { method: "DELETE", allowFail: true });
      await page.goto(`${base}/admin/families`);
      await page.waitForLoadState("networkidle");
      await pause(2500);
    },
  },
  {
    id: "B-4-full",
    title: "FULL TASK: deposit drawdown on a self-created demo family",
    auth: "admin",
    task: true,
    // Touches ONLY data it creates: demo student + family + two sessions,
    // deposit recorded, drawdown shown, then the whole tree is hard-deleted
    // (student delete cascades the sessions; family delete removes the rest).
    run: async (page, base) => {
      await page.goto(`${base}/admin/ledger`);
      await page.waitForLoadState("networkidle");

      // Pre-clean leftovers from an aborted run, then create the demo tree.
      const famsPre = await api(page, "/api/families");
      for (const f of famsPre.families || []) {
        if ((f.students || []).some((s) => s.lastName === "LedgerDemo")) {
          for (const s of f.students || []) {
            await api(page, `/api/students/${s.id}`, { method: "DELETE", allowFail: true });
          }
          await api(page, `/api/families/${f.id}`, { method: "DELETE", allowFail: true });
        }
      }
      const madeStudent = await api(page, "/api/students", {
        method: "POST",
        body: {
          firstName: "Demo",
          lastName: "LedgerDemo",
          grade: "4",
          status: "active",
          parentName: "Demo Parent",
          parentEmail: DEMO.familyEmail,
          parentPhone: "",
          sessionType: "individual",
          rate: 100,
        },
      });
      const studentId = madeStudent.student?.id || madeStudent.id;
      const stu = await api(page, `/api/students/${studentId}`);
      const familyId = stu.student?.familyId;
      if (!familyId) throw new Error("demo student has no familyId");

      // Two completed sessions this academic year → real drawdown rows.
      for (const [date, dur] of [
        ["2026-06-24", 60],
        ["2026-07-01", 90],
      ]) {
        await api(page, "/api/sessions", {
          method: "POST",
          body: { studentId, date, time: "15:00", duration: dur, type: "individual", status: "completed" },
        });
      }

      // Record the $500 deposit through the ledger UI on OUR demo row.
      await page.reload();
      await page.waitForLoadState("networkidle");
      await mustSee(page, "LedgerDemo");
      const row = page.locator("tr", { hasText: "LedgerDemo" }).first();
      await row.scrollIntoViewIfNeeded();
      await pause(1000);
      await row.locator("button").first().click();
      await page.locator("tbody input").first().fill("500");
      await page.getByRole("button", { name: /^save$/i }).first().click();
      await mustSee(page, "$500");
      await pause(1500);

      // Expand: the two sessions show, first fully covered by the deposit.
      await row.click();
      await mustSee(page, "covered by deposit");
      await pause(3500);

      // Tear the whole demo tree down (student delete cascades sessions).
      await api(page, `/api/students/${studentId}`, { method: "DELETE" });
      await api(page, `/api/families/${familyId}`, { method: "DELETE" });
      await api(page, `/api/admin/contacts?email=${encodeURIComponent(DEMO.familyEmail)}`, { method: "DELETE", allowFail: true });
      await page.reload();
      await page.waitForLoadState("networkidle");
      await pause(2000);
    },
  },
  {
    id: "C-2-full",
    title: "FULL TASK: add a contact, log a staff response, remove it",
    auth: "admin",
    task: true,
    run: async (page, base) => {
      await page.goto(`${base}/admin/contacts`);
      await page.waitForLoadState("networkidle");
      await api(page, `/api/admin/contacts?email=${encodeURIComponent(DEMO.contactEmail)}`, { method: "DELETE", allowFail: true });
      await page.reload();
      await page.waitForLoadState("networkidle");
      await pause(1000);

      // Add the contact through the UI.
      await page.getByRole("button", { name: /add contact/i }).click();
      const form = page.locator("form");
      await form.locator("input").nth(0).fill("Demo Contact");
      await form.locator("input").nth(1).fill(DEMO.contactEmail);
      await form.locator("input").nth(2).fill("(555) 000-0000");
      await page.getByRole("button", { name: /save contact/i }).click();
      await mustSee(page, DEMO.contactEmail);
      await pause(1500);

      // Open the profile and log a response (C-4).
      await page.locator(`button:has-text("${DEMO.contactEmail}")`).first().click();
      await page
        .locator("textarea[placeholder*='Log a response']")
        .fill("Called — interested in fall tutoring. Sending details Monday.");
      await page.getByRole("button", { name: /log response/i }).click();
      await mustSee(page, "interested in fall tutoring");
      await pause(2500);

      // Clean up: remove the demo contact entirely.
      await api(page, `/api/admin/contacts?email=${encodeURIComponent(DEMO.contactEmail)}`, { method: "DELETE" });
      await page.reload();
      await page.waitForLoadState("networkidle");
      await pause(1500);
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────
// SANDBOX-ONLY scenarios — the destructive flows that must never run on
// production, filmed for real against the local sandbox stack
// (`npm run sandbox`, Stripe SANDBOX keys, throwaway in-memory data).
// The runner refuses these unless --base points at localhost.

async function firstStudent(page) {
  const j = await api(page, "/api/students");
  const s = (j.students || []).find((x) => x.status === "active") || (j.students || [])[0];
  if (!s) throw new Error("sandbox has no seeded students");
  return s;
}

const lastWeekDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1 - 7 + offsetDays); // last week's Mon + offset
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const SANDBOX_SCENARIOS = [
  {
    id: "D-2-sandbox",
    title: "SANDBOX: Copy last week actually duplicates the schedule",
    auth: "admin",
    task: true,
    sandboxOnly: true,
    run: async (page, base) => {
      await page.goto(`${base}/admin`);
      await page.waitForLoadState("networkidle");
      const stu = await firstStudent(page);

      // Put three sessions on last week so there is something to copy.
      for (const [i, time] of [["0", "10:00"], ["2", "15:30"], ["4", "13:00"]].entries()) {
        await api(page, "/api/sessions", {
          method: "POST",
          body: {
            studentId: stu.id,
            date: lastWeekDate(Number(time[0] ?? 0) || [0, 2, 4][i]),
            time: time[1] || time,
            duration: 60,
            type: "individual",
            status: "completed",
          },
        });
      }
      await page.reload();
      await page.waitForLoadState("networkidle");
      await pause(2000);

      // THE click — allowed here, this is the sandbox.
      await page.getByRole("button", { name: /copy last week/i }).click();
      await mustSee(page, "copied");
      await pause(2500);

      // Idempotence, on camera: click again → nothing new.
      await page.getByRole("button", { name: /copy last week/i }).click();
      await mustSee(page, "already on the books");
      await pause(3000);
    },
  },
  {
    id: "BILLING-sandbox",
    title: "SANDBOX: card save → 45-min session → billing queue → live (sandbox) charge → history",
    auth: "admin",
    task: true,
    sandboxOnly: true,
    run: async (page, base) => {
      // B-5: save a card through the real Stripe (sandbox) Elements form.
      const stu = await firstStudent(page);
      await api(page, `/api/students/${stu.id}`, { method: "PUT", body: { rate: 100 } });
      const famId = stu.familyId;
      if (!famId) throw new Error("seeded student has no family");
      await page.goto(`${base}/admin/families/${famId}`);
      await page.waitForLoadState("networkidle");
      await pause(1500);

      await page.getByRole("button", { name: /add card/i }).first().click();
      const stripeFrame = page.frameLocator("iframe[name^='__privateStripeFrame']").first();
      await stripeFrame.locator("[name='cardnumber']").fill("4242424242424242");
      await stripeFrame.locator("[name='exp-date']").fill("12/34");
      await stripeFrame.locator("[name='cvc']").fill("123");
      await attempt(() => stripeFrame.locator("[name='postal']").fill("94301", { timeout: 3000 }));
      await pause(1000);
      await page.getByRole("button", { name: /save card/i }).first().click();
      await mustSee(page, "Card on file", 30000);
      await pause(2000);

      // B-2: a 45-minute session bills 0.75 × $100.
      await api(page, "/api/sessions", {
        method: "POST",
        body: {
          studentId: stu.id,
          date: new Date().toISOString().slice(0, 10),
          time: "09:00",
          duration: 45,
          type: "individual",
          status: "completed",
        },
      });
      await page.goto(`${base}/admin/billing`);
      await page.waitForLoadState("networkidle");
      await mustSee(page, "$75");
      await pause(2500);

      // Approve → real charge against the Stripe SANDBOX (B-3: descriptor
      // is locked to MATHITUDE server-side).
      const row = page.locator("tr", { hasText: "$75" }).first();
      await attempt(() => row.locator("input[type='checkbox']").first().check({ timeout: 4000 }));
      await page.getByRole("button", { name: /approve|charge/i }).first().click();
      await pause(6000); // Stripe round-trip on camera

      // B-6: the payment shows in history.
      await page.goto(`${base}/admin/payments`);
      await page.waitForLoadState("networkidle");
      await mustSee(page, "$75");
      await pause(3000);
    },
  },
  {
    id: "N-6-sandbox",
    title: "SANDBOX: post a session-note comment for real",
    auth: "admin",
    task: true,
    sandboxOnly: true,
    run: async (page, base) => {
      const stu = await firstStudent(page);
      await page.goto(`${base}/admin`);
      await page.waitForLoadState("networkidle");
      // A completed session note to talk under.
      await api(page, `/api/students/${stu.id}/session-notes`, {
        method: "POST",
        body: {
          date: new Date().toISOString().slice(0, 10),
          time: "16:00",
          duration: 60,
          sessionActivities: "Fractions with pattern blocks",
          publicNotes: "Great focus today — nailed equivalent fractions.",
        },
        allowFail: true, // shape differs per deployment; the comment API is the star
      });
      await page.goto(`${base}/staff-log-session?studentId=${stu.id}`);
      await page.waitForLoadState("networkidle");
      await pause(2000);
      const toggle = page.locator("text=/^Comments/").first();
      await toggle.scrollIntoViewIfNeeded();
      await toggle.click();
      await page
        .locator("textarea[placeholder='Add a comment…']")
        .first()
        .fill("Parents: he asked to do more of these — sending a worksheet Friday.");
      await page.getByRole("button", { name: /^post$/i }).first().click();
      await mustSee(page, "sending a worksheet Friday");
      await pause(3000);
    },
  },
  {
    id: "C-6-sandbox",
    title: "SANDBOX: August-1 grade rollover, on camera",
    auth: "admin",
    task: true,
    sandboxOnly: true,
    run: async (page, base) => {
      await page.goto(`${base}/admin/students`);
      await page.waitForLoadState("networkidle");
      await pause(2500); // grades before

      await api(page, "/api/cron/advance-grades", {
        method: "POST",
        body: { force: true },
      });
      await page.reload();
      await page.waitForLoadState("networkidle");
      await pause(3500); // grades after — every active student one step up
    },
  },
];
