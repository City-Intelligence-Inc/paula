// One-off recap mailer. Run after pulling env vars:
//   npx vercel env pull .env.local
//   node --env-file=.env.local scripts/send-recap.mjs

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("❌  RESEND_API_KEY not set. Run: npx vercel env pull .env.local first.");
  process.exit(1);
}

const FROM = "Mathitude <notifications@mathitude.com>";
const TO   = ["ari@coframe.com", "phamilton@mathitude.com", "sbell@mathitude.com"];

const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#222;">

  <p style="color:#7030A0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;margin:0 0 4px;">Mathitude</p>
  <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 4px;">Dev session recap — June 20, 2026</h1>
  <p style="color:#888;font-size:13px;margin:0 0 32px;">18 commits shipped to production today</p>

  <h2 style="font-size:14px;font-weight:700;color:#7030A0;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;padding-bottom:6px;border-bottom:2px solid #7030A0;">Student Email Feature</h2>
  <p style="font-size:14px;line-height:1.6;margin:0 0 10px;">Students can now have their own email on file. Paula can add it mid-session without navigating away — an amber prompt appears automatically if no student email is set.</p>
  <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.9;color:#333;">
    <li>Optional <strong>student email field</strong> on every student record</li>
    <li><strong>Inline add during Log Session</strong> — saves to the student record instantly, then session notes go to both parent and student</li>
    <li><strong>Auto-email after every session</strong> when notes are present — deduped so if parent and student share an address, only one email is sent</li>
    <li><strong>173 integration tests</strong> covering recipient logic, subject, HTML + plain-text body, date formatting, and XSS escaping</li>
  </ul>

  <h2 style="font-size:14px;font-weight:700;color:#7030A0;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;padding-bottom:6px;border-bottom:2px solid #7030A0;">Session Logging UX</h2>
  <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.9;color:#333;">
    <li><strong>Searchable student combobox</strong> — type to filter by name; replaces the all-caps native browser dropdown. Grade shown on the right of each row.</li>
    <li><strong>Title-cased names</strong> everywhere ("KIRAN L" → "Kiran L")</li>
    <li><strong>CC on all system emails</strong> — every outbound Resend email will CC <code style="background:#f4f0ff;padding:1px 4px;border-radius:3px;">SYSTEM_CC_EMAIL</code>. See action needed below.</li>
  </ul>

  <h2 style="font-size:14px;font-weight:700;color:#7030A0;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;padding-bottom:6px;border-bottom:2px solid #7030A0;">Website &amp; Marketing</h2>
  <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.9;color:#333;">
    <li><strong>/team page</strong> — Paula featured, supporting tutor grid</li>
    <li><strong>Hero redesign</strong> — text stacked above photos, floating math symbol animations</li>
    <li><strong>Auth pages</strong> — Gmail phone UI with animated inbox cycling through K–12 math topics (algebra, pre-calc, calc, stats…)</li>
    <li><strong>Animation system</strong> — scroll reveals, parallax, aurora, magnetic CTAs, tilt, scramble, spotlight, progress bar</li>
    <li><strong>/compact</strong> — tighter homepage spacing variant for comparison</li>
    <li><strong>Navbar</strong> — larger icon, lighter text, better balance</li>
  </ul>

  <h2 style="font-size:14px;font-weight:700;color:#7030A0;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;padding-bottom:6px;border-bottom:2px solid #7030A0;">Actions Needed</h2>
  <table style="border-collapse:collapse;width:100%;font-size:14px;">
    <tr style="vertical-align:top;">
      <td style="padding:6px 16px 6px 0;color:#666;white-space:nowrap;">Activate CC</td>
      <td style="padding:6px 0;line-height:1.5;">Add <code style="background:#f4f0ff;padding:1px 5px;border-radius:3px;">SYSTEM_CC_EMAIL=phamilton@mathitude.com</code> in Vercel → Settings → Environment Variables → Production. Every system email will then CC Paula.</td>
    </tr>
    <tr style="vertical-align:top;">
      <td style="padding:6px 16px 6px 0;color:#666;white-space:nowrap;">Add admin</td>
      <td style="padding:6px 0;line-height:1.5;">Paula: go to <a href="https://website-sage-three-98.vercel.app/admin/admins" style="color:#7030A0;">Admin → Admins</a> and add <strong>arihant@complete.city</strong>.</td>
    </tr>
  </table>

  <p style="margin:32px 0 0;font-size:12px;color:#bbb;border-top:1px solid #eee;padding-top:16px;">
    Mathitude · Menlo Park, CA · <a href="mailto:info@mathitude.com" style="color:#bbb;text-decoration:none;">info@mathitude.com</a>
  </p>
</div>
`;

const text = `Mathitude — Dev session recap, June 20, 2026
18 commits shipped to production today

STUDENT EMAIL FEATURE
- Optional student email field on every student record
- Inline add during Log Session — no page navigation needed
- Auto-email session notes to parent + student after each session (deduped)
- 173 integration tests covering all email-building logic

SESSION LOGGING UX
- Searchable student combobox (type to filter, grade shown per row)
- Title-cased names ("KIRAN L" → "Kiran L")
- CC on all system emails via SYSTEM_CC_EMAIL env var

WEBSITE & MARKETING
- /team page: Paula featured + supporting tutor grid
- Hero redesign: text above photos, floating math animations
- Auth pages: animated Gmail inbox cycling K–12 math topics
- Animation system: scroll reveals, parallax, aurora, magnetic CTAs
- /compact route for homepage comparison
- Navbar balance fixes

ACTIONS NEEDED
- Set SYSTEM_CC_EMAIL=phamilton@mathitude.com in Vercel env vars
- Paula: add arihant@complete.city as admin at /admin/admins
`;

console.log("Sending to:", TO.join(", "));

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({ from: FROM, to: TO, subject: "Mathitude dev session recap — June 20, 2026", html, text }),
});

const json = await res.json();
if (!res.ok) {
  console.error("❌  Resend error:", json);
  process.exit(1);
}

console.log("✅  Sent. Resend ID:", json.id);
