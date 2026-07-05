import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { clerkClient } from "@clerk/nextjs/server";
import { ddb, Tables } from "@/lib/server/ddb";
import { getInviteByToken, inviteIsActive } from "@/lib/server/invites";

// #7: does this email already have a Clerk login? If so the register page
// should send them to sign-in, not through "create your login" (a dead end —
// Clerk rejects sign-up for an existing email). getUserList matches emails by
// case-insensitive partial match, so we confirm an exact address hit.
// Best-effort: any Clerk error falls back to the normal register flow.
async function emailHasAccount(email: string): Promise<boolean> {
  const target = email.trim().toLowerCase();
  if (!target) return false;
  try {
    const client = await clerkClient();
    const list = await client.users.getUserList({ emailAddress: [target] });
    return (list.data || []).some((u) =>
      (u.emailAddresses || []).some(
        (e) => e.emailAddress.trim().toLowerCase() === target,
      ),
    );
  } catch (err) {
    console.warn("[register/validate] Clerk lookup failed:", err);
    return false;
  }
}

// GET /api/register/validate?token=… — public. Tells the hidden registration
// page whether the token is live and what to prefill. The email in the
// response is the ONLY email the registration flow will accept (C-9: the
// field is read-only, sourced from the token, never from user input).

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const invite = await getInviteByToken(token);

  if (!invite) {
    return Response.json({ valid: false, reason: "not-found" }, { status: 404 });
  }
  if (invite.usedAt) {
    return Response.json({ valid: false, reason: "used" }, { status: 410 });
  }
  if (!inviteIsActive(invite)) {
    return Response.json({ valid: false, reason: "expired" }, { status: 410 });
  }

  // Carry inquiry-form details over (C-1) so the family doesn't retype them.
  let consultationPrefill: Record<string, string> = {};
  if (invite.consultationId) {
    try {
      const r = await ddb().send(
        new GetCommand({
          TableName: Tables.bookings,
          Key: { id: invite.consultationId },
        }),
      );
      if (r.Item?.type === "consultation") {
        consultationPrefill = {
          parentName: (r.Item.parentName as string) || "",
          phone: (r.Item.phone as string) || "",
          studentInfo: (r.Item.studentInfo as string) || "",
        };
      }
    } catch {
      // prefill is best-effort
    }
  }

  return Response.json({
    valid: true,
    email: invite.email,
    role: invite.role,
    firstName: invite.firstName || "",
    lastName: invite.lastName || "",
    familyId: invite.familyId || null,
    alreadyRegistered: await emailHasAccount(invite.email),
    prefill: { ...consultationPrefill, ...(invite.prefill || {}) },
  });
}
