import { randomBytes } from "crypto";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { sendAdminNotification } from "@/lib/server/notify";

// Tokenized account invitations (FEATURE_LIST C-1 / C-9 / R-8).
//
// Lifecycle: admin approves a lead (or adds a user) → an invite row is
// created with a random single-use token and a 7-day expiry → the invitee
// opens /register?token=… where the email is read-only, fills in their
// details → POST /api/register consumes the token atomically (a conditional
// write, so a raced double-submit can only succeed once) → entity rows are
// created and the invitee is sent to Clerk sign-up with the same email.
//
// Rows live in the bookings table (id-keyed, same home as consultation
// leads) as type:"invite" — no new infra required.

export const INVITE_TTL_DAYS = 7;

export type InviteRole = "parent" | "tutor" | "student" | "office";

export interface Invite {
  id: string; // `invite_${token}`
  type: "invite";
  token: string;
  email: string;
  role: InviteRole;
  firstName?: string;
  lastName?: string;
  familyId?: string; // parent invites: join an existing family
  studentId?: string; // student invites: which student this login belongs to
  consultationId?: string; // C-1: inquiry the lead came from (prefill carry-over)
  prefill?: Record<string, string>; // extra prefill (phone, studentInfo, …)
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
}

export function inviteIsActive(inv: Invite, now = new Date()): boolean {
  return (
    !inv.usedAt && !inv.revokedAt && new Date(inv.expiresAt).getTime() > now.getTime()
  );
}

export async function createInvite(input: {
  email: string;
  role: InviteRole;
  invitedBy: string;
  firstName?: string;
  lastName?: string;
  familyId?: string;
  studentId?: string;
  consultationId?: string;
  prefill?: Record<string, string>;
}): Promise<Invite> {
  const token = randomBytes(24).toString("base64url");
  const now = new Date();
  const invite: Invite = {
    id: `invite_${token}`,
    type: "invite",
    token,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    firstName: input.firstName?.trim() || undefined,
    lastName: input.lastName?.trim() || undefined,
    familyId: input.familyId || undefined,
    studentId: input.studentId || undefined,
    consultationId: input.consultationId || undefined,
    prefill: input.prefill,
    invitedBy: input.invitedBy,
    createdAt: now.toISOString(),
    expiresAt: new Date(
      now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString(),
  };
  await ddb().send(
    new PutCommand({ TableName: Tables.bookings, Item: invite }),
  );
  return invite;
}

export async function getInviteByToken(token: string): Promise<Invite | null> {
  if (!token || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const r = await ddb().send(
    new GetCommand({ TableName: Tables.bookings, Key: { id: `invite_${token}` } }),
  );
  const item = r.Item as Invite | undefined;
  return item?.type === "invite" ? item : null;
}

export async function listInvites(): Promise<Invite[]> {
  const r = await ddb().send(
    new ScanCommand({
      TableName: Tables.bookings,
      FilterExpression: "#t = :invite",
      ExpressionAttributeNames: { "#t": "type" },
      ExpressionAttributeValues: { ":invite": "invite" },
    }),
  );
  const items = (r.Items as Invite[]) || [];
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function revokeInvite(token: string): Promise<void> {
  await ddb().send(
    new DeleteCommand({
      TableName: Tables.bookings,
      Key: { id: `invite_${token}` },
    }),
  );
}

// Mark the invite used — strictly once. The conditional write fails if a
// parallel submit already consumed it (or it was revoked meanwhile).
export async function consumeInvite(token: string): Promise<boolean> {
  try {
    await ddb().send(
      new UpdateCommand({
        TableName: Tables.bookings,
        Key: { id: `invite_${token}` },
        UpdateExpression: "SET usedAt = :u",
        ConditionExpression:
          "attribute_exists(id) AND attribute_not_exists(usedAt) AND attribute_not_exists(revokedAt)",
        ExpressionAttributeValues: { ":u": new Date().toISOString() },
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function registrationUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_URL || "https://mathitude.com").replace(/\/$/, "");
  return `${base}/register?token=${token}`;
}

const ROLE_BLURB: Record<InviteRole, string> = {
  parent:
    "Mathitude has set up a family portal where you can view session notes, schedules, and billing.",
  tutor:
    "Mathitude has set up a tutor portal where you'll see your students, schedule, and session notes.",
  student:
    "Mathitude has set up a portal where you can see your own session notes and schedule.",
  office:
    "Mathitude has set up staff access for you — schedules, students, and session notes in one place.",
};

export async function sendInviteEmail(invite: Invite): Promise<{ ok: boolean; error?: string }> {
  const url = registrationUrl(invite.token);
  const name =
    `${invite.firstName || ""} ${invite.lastName || ""}`.trim() || "there";
  return sendAdminNotification({
    to: invite.email,
    subject: "You're invited to your Mathitude portal",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#7030A0;margin:0 0 16px;">Welcome to Mathitude</h2>
        <p style="color:#111;font-size:15px;line-height:1.5;margin:0 0 16px;">
          Hi ${name}, ${ROLE_BLURB[invite.role]} Use your personal link to set
          up your account:
        </p>
        <p style="margin:0 0 20px;">
          <a href="${url}" style="display:inline-block;background:#7030A0;color:#fff;text-decoration:none;padding:12px 22px;border-radius:9999px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;font-size:13px;">Set up your account</a>
        </p>
        <p style="color:#666;font-size:13px;line-height:1.5;margin:0;">
          This link is just for ${invite.email}, works once, and expires in
          ${INVITE_TTL_DAYS} days.
        </p>
      </div>
    `,
    text: `Hi ${name}, set up your Mathitude account at ${url} — the link is personal to ${invite.email}, works once, and expires in ${INVITE_TTL_DAYS} days.`,
  });
}
