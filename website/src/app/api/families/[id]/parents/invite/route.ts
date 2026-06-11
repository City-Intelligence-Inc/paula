import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import { sendAdminNotification, notifyAction } from "@/lib/server/notify";

interface Body {
  parentId?: string;
}

// POST /api/families/[id]/parents/invite  { parentId }
// Emails a caregiver a link to create their account (3/ Sara — "see if a
// caregiver has an account and invite them if not"). Admin-only. Best-effort
// email; records an admin notification of the invite.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Admin access required.");

  await params; // familyId is implied by the parent record; not needed here
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.parentId) {
    return Response.json({ error: "parentId required" }, { status: 400 });
  }

  const r = await ddb().send(
    new GetCommand({ TableName: Tables.parents, Key: { id: body.parentId } }),
  );
  const parent = r.Item as
    | { id: string; firstName?: string; lastName?: string; email?: string; clerkUserId?: string }
    | undefined;
  if (!parent) return Response.json({ error: "Parent not found" }, { status: 404 });
  if (!parent.email) {
    return Response.json(
      { error: "This caregiver has no email on file to invite." },
      { status: 400 },
    );
  }
  if (parent.clerkUserId) {
    return Response.json(
      { error: "This caregiver already has an account." },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;
  const signUpUrl = `${origin}/sign-up`;
  const name = `${parent.firstName || ""} ${parent.lastName || ""}`.trim() || "there";

  const emailRes = await sendAdminNotification({
    to: parent.email,
    subject: "You're invited to your Mathitude family portal",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#7030A0;margin:0 0 16px;">Welcome to Mathitude</h2>
        <p style="color:#111;font-size:15px;line-height:1.5;margin:0 0 16px;">
          Hi ${name}, Mathitude has set up a family portal where you can view
          session notes, schedules, and billing. Create your account to get
          access:
        </p>
        <p style="margin:0 0 20px;">
          <a href="${signUpUrl}" style="display:inline-block;background:#7030A0;color:#fff;text-decoration:none;padding:12px 22px;border-radius:9999px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;font-size:13px;">Create your account</a>
        </p>
        <p style="color:#666;font-size:13px;line-height:1.5;margin:0;">
          Use this email address (${parent.email}) when you sign up so we can
          link you to your family automatically.
        </p>
      </div>
    `,
    text: `Hi ${name}, create your Mathitude family portal account at ${signUpUrl} using ${parent.email}.`,
  });

  if (!emailRes.ok) {
    return Response.json(
      { error: `Could not send invite: ${emailRes.error}` },
      { status: 502 },
    );
  }

  await notifyAction({
    kind: "parent.invited",
    summary: `Invited ${name} to create a family-portal account`,
    details: { parentId: parent.id, email: parent.email },
  }).catch(() => {});

  return Response.json({ ok: true });
}
