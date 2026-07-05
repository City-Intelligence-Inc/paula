import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import { sendAdminNotification, notifyAction } from "@/lib/server/notify";
import type { Tutor } from "@/lib/types";

// POST /api/admin/tutors/[id]/invite — email a tutor a link to create their
// portal account (R-8, mirrors the caregiver invite). When they sign up with
// this email, actor resolution matches them to the tutor record automatically.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Admin access required.");

  const { id } = await params;
  const r = await ddb().send(
    new GetCommand({ TableName: Tables.tutors, Key: { id } }),
  );
  const tutor = r.Item as Tutor | undefined;
  if (!tutor) return Response.json({ error: "Tutor not found" }, { status: 404 });
  if (!tutor.email) {
    return Response.json(
      { error: "This tutor has no email on file to invite." },
      { status: 400 },
    );
  }
  if (tutor.clerkUserId) {
    return Response.json(
      { error: "This tutor already has an account." },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;
  const signUpUrl = `${origin}/sign-up`;
  const name = `${tutor.firstName || ""} ${tutor.lastName || ""}`.trim() || "there";

  const emailRes = await sendAdminNotification({
    to: tutor.email,
    subject: "You're invited to the Mathitude tutor portal",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#7030A0;margin:0 0 16px;">Welcome to Mathitude</h2>
        <p style="color:#111;font-size:15px;line-height:1.5;margin:0 0 16px;">
          Hi ${name}, Mathitude has set you up as a tutor. Create your account
          to see your students, log sessions, and write session notes:
        </p>
        <p style="margin:0 0 20px;">
          <a href="${signUpUrl}" style="display:inline-block;background:#7030A0;color:#fff;text-decoration:none;padding:12px 22px;border-radius:9999px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;font-size:13px;">Create your account</a>
        </p>
        <p style="color:#666;font-size:13px;line-height:1.5;margin:0;">
          Use this email address (${tutor.email}) when you sign up so we can
          link you to your tutor profile automatically.
        </p>
      </div>
    `,
    text: `Hi ${name}, create your Mathitude tutor account at ${signUpUrl} using ${tutor.email}.`,
  });

  if (!emailRes.ok) {
    return Response.json(
      { error: `Could not send invite: ${emailRes.error}` },
      { status: 502 },
    );
  }

  await notifyAction({
    kind: "tutor.invited",
    summary: `Invited ${name} to create a tutor-portal account`,
    details: { tutorId: tutor.id, email: tutor.email },
  }).catch(() => {});

  return Response.json({ ok: true });
}
