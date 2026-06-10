import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { auth, currentUser } from "@clerk/nextjs/server";

let _ddb: DynamoDBDocumentClient | null = null;

export function ddb() {
  if (!_ddb) {
    _ddb = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: process.env.AWS_REGION || "us-west-2" }),
      { marshallOptions: { removeUndefinedValues: true } },
    );
  }
  return _ddb;
}

const PREFIX = process.env.DYNAMODB_TABLE_PREFIX || "mathitude-staging";

export const Tables = {
  students: `${PREFIX}-students`,
  sessions: `${PREFIX}-sessions`,
  payments: `${PREFIX}-payments`,
  events: `${PREFIX}-events`,
  resources: `${PREFIX}-resources`,
  bookings: `${PREFIX}-bookings`,
  content: `${PREFIX}-content`,
  families: `${PREFIX}-families`,
  parents: `${PREFIX}-parents`,
  tutors: `${PREFIX}-tutors`,
  users: `${PREFIX}-users`,
  secrets: `${PREFIX}-secrets`,
  notifications: `${PREFIX}-notifications`,
  userRoles: `${PREFIX}-user-roles`,
} as const;

export async function requireUser() {
  try {
    const { userId } = await auth();
    console.log("[requireUser]", {
      userId,
      hasAwsKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecret: !!process.env.AWS_SECRET_ACCESS_KEY,
      prefix: process.env.DYNAMODB_TABLE_PREFIX || "(default)",
      region: process.env.AWS_REGION || "(default)",
    });
    if (!userId) {
      return { userId: null, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { userId, response: null as Response | null };
  } catch (err) {
    console.error("[requireUser] auth() threw:", err);
    return {
      userId: null,
      response: Response.json({ error: "Auth error", detail: String(err) }, { status: 500 }),
    };
  }
}

// Resolve the signed-in user's primary email (lowercased), or "" if none.
// Shared by requireAdmin and the /admin layout gate.
export async function currentUserEmail(): Promise<string> {
  try {
    const u = await currentUser();
    if (!u) return "";
    const primary = u.emailAddresses?.find(
      (e) => e.id === u.primaryEmailAddressId,
    )?.emailAddress;
    return (primary || u.emailAddresses?.[0]?.emailAddress || "").toLowerCase();
  } catch (err) {
    console.warn("[currentUserEmail] failed:", err);
    return "";
  }
}

// Admin gate. Requires a signed-in user whose email is in the admin list
// (bootstrap env BOOTSTRAP_ADMIN_EMAILS + DynamoDB-managed additional admins).
// Bootstrap admins resolve from env alone, so they stay in even if DynamoDB
// is unavailable. Non-admins get a 403.
//
// History: until 2026-06 this was a passthrough to requireUser() so the
// Mathitude team could use the portal before the admin list existed. Now that
// BOOTSTRAP_ADMIN_EMAILS is populated, it enforces real admin access — add new
// staff via Settings → Admins (or the env var) rather than relying on any
// signed-in account.
export async function requireAdmin() {
  const base = await requireUser();
  if (base.response) return base; // not signed in → 401 from requireUser

  const email = await currentUserEmail();
  try {
    // Late import to avoid a module cycle (admins.ts imports ddb()).
    const { isAdminEmail } = await import("@/lib/server/admins");
    if (email && (await isAdminEmail(email))) {
      return base;
    }
  } catch (err) {
    console.error("[requireAdmin] admin check failed:", err);
    return {
      userId: base.userId,
      response: Response.json(
        { error: "Admin check failed" },
        { status: 500 },
      ) as Response | null,
    };
  }

  return {
    userId: base.userId,
    response: Response.json(
      { error: "Forbidden — admin access required" },
      { status: 403 },
    ) as Response | null,
  };
}

// ---------------------------------------------------------
// Phase 3 RBAC scaffolding (2026-05-19)
//
// Role data lives in mathitude-staging-user-roles, keyed by Clerk userId.
// getUserRole returns the assigned role or null. requireRole() rejects if
// the user lacks one of the listed roles — EXCEPT when no role row exists
// at all, in which case it falls through (legacy admin-by-default per the
// TODO above). This lets us start guarding endpoints incrementally: assign
// a role row to a user and that user is locked to it; users without rows
// keep working as today.
// ---------------------------------------------------------

export type UserRole = "master_admin" | "admin" | "tutor" | "parent";

interface UserRoleRecord {
  clerkUserId: string;
  role: UserRole;
  linkedEntityId?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getUserRole(
  clerkUserId: string,
): Promise<UserRoleRecord | null> {
  if (!clerkUserId) return null;
  try {
    // Late import to avoid pulling DDB GetCommand into modules that only
    // call requireUser().
    const { GetCommand } = await import("@aws-sdk/lib-dynamodb");
    const r = await ddb().send(
      new GetCommand({
        TableName: Tables.userRoles,
        Key: { clerkUserId },
      }),
    );
    return (r.Item as UserRoleRecord | undefined) || null;
  } catch (err) {
    console.warn("[getUserRole] lookup failed:", err);
    return null;
  }
}

export async function requireRole(allowed: UserRole[]) {
  const auth = await requireUser();
  if (auth.response) return auth;

  const userId = auth.userId!;
  const record = await getUserRole(userId);

  // Legacy fallback: no role row at all → treat as admin (pre-Phase-3
  // behavior). Required so existing Mathitude staff don't lose access on
  // the day this code ships.
  if (!record) {
    return { userId, role: "admin" as UserRole, response: null as Response | null };
  }

  if (!allowed.includes(record.role)) {
    return {
      userId,
      role: record.role,
      response: Response.json(
        { error: `Forbidden — requires one of: ${allowed.join(", ")}` },
        { status: 403 },
      ),
    };
  }

  return { userId, role: record.role, response: null as Response | null };
}
