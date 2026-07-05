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
      const btn = page.locator("text=Copy last week").first();
      if (await btn.count()) {
        await btn.scrollIntoViewIfNeeded();
        await btn.hover(); // hover only — clicking would duplicate the week
      }
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
      const row = page.locator("button:has-text('@')").first();
      const anyRow = (await row.count()) ? row : page.locator("main button").first();
      if (await anyRow.count()) {
        await anyRow.click(); // expand profile log — read-only
        await pause(2000);
      }
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
