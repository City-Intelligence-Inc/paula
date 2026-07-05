import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import { notifyAction } from "@/lib/server/notify";
import { createInvite, sendInviteEmail, registrationUrl } from "@/lib/server/invites";
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

  // Tokenized invitation (C-1): single-use, 7-day expiry. The register flow
  // sees an existing tutor row for this email and links instead of creating
  // a duplicate.
  const name = `${tutor.firstName || ""} ${tutor.lastName || ""}`.trim() || "there";
  const invite = await createInvite({
    email: tutor.email,
    role: "tutor",
    firstName: tutor.firstName,
    lastName: tutor.lastName,
    invitedBy: actor!.email || actor!.userId,
  });
  const inviteUrl = registrationUrl(invite.token);
  const emailRes = await sendInviteEmail(invite);

  await notifyAction({
    kind: "tutor.invited",
    summary: `Invited ${name} to create a tutor-portal account`,
    details: { tutorId: tutor.id, email: tutor.email },
  }).catch(() => {});

  // QA bug #11: a failed invite email used to hard-error (502). Keep the
  // invite and hand back the link so the admin can copy it — same fallback
  // the Users page already offers.
  return Response.json({
    ok: true,
    emailSent: emailRes.ok,
    emailError: emailRes.ok ? undefined : emailRes.error,
    inviteUrl,
  });
}
