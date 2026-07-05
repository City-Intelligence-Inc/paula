import { resolveActor, forbidden } from "@/lib/server/access";
import { notifyAction } from "@/lib/server/notify";
import {
  createInvite,
  listInvites,
  revokeInvite,
  sendInviteEmail,
  type InviteRole,
} from "@/lib/server/invites";

// Admin management of tokenized invitations (R-8 / C-1).
// GET    → all invites, newest first (pending / used / expired / revoked)
// POST   → create an invite and email the registration link
// DELETE → revoke a pending invite (?token=…)

const ROLES: InviteRole[] = ["parent", "tutor", "student", "office"];

export async function GET() {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Admin access required.");
  const invites = await listInvites();
  // The raw token is embedded in each row id; admins may need it to re-copy
  // the link, so returning it here is intentional (admin-only surface).
  return Response.json({ invites });
}

interface PostBody {
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  familyId?: string;
  studentId?: string;
  consultationId?: string;
  prefill?: Record<string, string>;
}

export async function POST(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Admin access required.");

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "A valid email is required" }, { status: 400 });
  }
  const role = (body.role || "") as InviteRole;
  if (!ROLES.includes(role)) {
    return Response.json(
      { error: `role must be one of: ${ROLES.join(", ")}` },
      { status: 400 },
    );
  }
  if (role === "student" && !body.studentId) {
    return Response.json(
      { error: "Student invites need a studentId to link the login to." },
      { status: 400 },
    );
  }

  const invite = await createInvite({
    email,
    role,
    firstName: body.firstName,
    lastName: body.lastName,
    familyId: body.familyId,
    studentId: body.studentId,
    consultationId: body.consultationId,
    prefill: body.prefill,
    invitedBy: actor!.email || actor!.userId,
  });

  const sent = await sendInviteEmail(invite);
  if (!sent.ok) {
    // Keep the invite (the admin can copy the link manually) but surface the
    // email failure honestly.
    return Response.json(
      { invite, emailError: sent.error || "Email could not be sent" },
      { status: 201 },
    );
  }

  notifyAction({
    kind: "user.invited",
    summary: `${actor!.email} invited ${email} as ${role}`,
    details: { email, role, familyId: body.familyId, studentId: body.studentId },
  }).catch(() => {});

  return Response.json({ invite }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Admin access required.");

  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token) return Response.json({ error: "token required" }, { status: 400 });
  await revokeInvite(token);
  return Response.json({ ok: true });
}
