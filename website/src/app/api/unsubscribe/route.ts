import { unsubscribeContact } from "@/lib/server/contacts";

// Public one-click unsubscribe (GET link in every broadcast footer; POST for
// List-Unsubscribe-Post one-click from mail clients). Requires the email +
// its minted token, so nobody can unsubscribe someone else by guessing.

function page(title: string, body: string): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;margin:0;padding:48px 16px;">
  <div style="max-width:460px;margin:0 auto;text-align:center;">
    <h1 style="color:#7030A0;font-size:24px;margin:0 0 12px;">${title}</h1>
    <p style="color:#444;font-size:15px;line-height:1.6;">${body}</p>
    <p style="margin-top:24px;"><a href="/" style="color:#7030A0;">mathitude.com</a></p>
  </div>
</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function handle(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("e") || "").trim().toLowerCase();
  const token = (searchParams.get("t") || "").trim();
  if (!email || !token) {
    return page("Something's missing", "This unsubscribe link is incomplete. Please use the link from the bottom of the email.");
  }
  const contact = await unsubscribeContact(email, token);
  if (!contact) {
    return page("Link not recognized", "This unsubscribe link doesn't match our records. Please use the link from the most recent email, or reply to it and we'll remove you by hand.");
  }
  return page("You're unsubscribed", `${email} won't receive Mathitude mailing-list emails anymore. Session notes and account emails are unaffected.`);
}

export async function GET(request: Request) {
  return handle(request);
}

// RFC 8058 one-click (mail clients POST with no body semantics we need).
export async function POST(request: Request) {
  return handle(request);
}
