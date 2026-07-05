import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { getInviteByToken, inviteIsActive } from "@/lib/server/invites";

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
    prefill: { ...consultationPrefill, ...(invite.prefill || {}) },
  });
}
