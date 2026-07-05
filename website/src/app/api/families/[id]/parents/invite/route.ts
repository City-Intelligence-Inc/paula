import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import { notifyAction } from "@/lib/server/notify";
import { createInvite, sendInviteEmail } from "@/lib/server/invites";

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

  // Tokenized invitation (C-1): single-use, 7-day expiry, email locked to
  // the caregiver's address. Supersedes the old generic /sign-up link.
  const { id: familyId } = await params;
  const name = `${parent.firstName || ""} ${parent.lastName || ""}`.trim() || "there";
  const invite = await createInvite({
    email: parent.email,
    role: "parent",
    firstName: parent.firstName,
    lastName: parent.lastName,
    familyId,
    invitedBy: actor!.email || actor!.userId,
  });
  const emailRes = await sendInviteEmail(invite);

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
