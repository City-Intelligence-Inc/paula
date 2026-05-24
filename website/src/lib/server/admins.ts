import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";

// Bootstrap master admins. These are baked-in master admins who can manage
// the admin list. They can never be removed or demoted via the UI. Keep in
// sync with src/app/dashboard/layout.tsx and src/components/sections/
// navbar.tsx.
export const BOOTSTRAP_ADMIN_EMAILS = [
  "phamilton@mathitude.com",
  "ari@coframe.com",
  "nljq16@stanford.edu",
] as const;

const ADMIN_EMAILS_KEY = "admin-emails";
const CACHE_TTL_MS = 30_000;
let cache: {
  value: AdminEntry[];
  expires: number;
} | null = null;

export type AdminRole = "master_admin" | "admin";

export interface AdminEntry {
  email: string;
  role: AdminRole;
  // Optional metadata so the UI can show who added a portal admin.
  addedAt?: string;
  addedBy?: string;
}

interface AdminEmailsRow {
  id: string;
  // v1 (legacy): emails: string[]   — every entry treated as plain admin
  // v2:          admins: AdminEntry[] — explicit role per email
  emails?: string[];
  admins?: AdminEntry[];
  updatedAt?: string;
  updatedBy?: string;
}

function normalize(email: string): string {
  return (email || "").trim().toLowerCase();
}

export function isBootstrapAdmin(email: string): boolean {
  const e = normalize(email);
  return (BOOTSTRAP_ADMIN_EMAILS as readonly string[]).includes(e);
}

// Bootstrap admins are master_admin by default. Portal-added entries
// inherit whatever role was assigned when added (default: admin).
async function readAdditional(): Promise<AdminEntry[]> {
  if (cache && cache.expires > Date.now()) return cache.value;
  let entries: AdminEntry[] = [];
  try {
    const r = await ddb().send(
      new GetCommand({
        TableName: Tables.secrets,
        Key: { id: ADMIN_EMAILS_KEY },
      }),
    );
    const row = r.Item as AdminEmailsRow | undefined;
    if (row?.admins && Array.isArray(row.admins)) {
      entries = row.admins
        .map((a) => ({
          email: normalize(a.email),
          role: (a.role === "master_admin" ? "master_admin" : "admin") as AdminRole,
          addedAt: a.addedAt,
          addedBy: a.addedBy,
        }))
        .filter((a) => a.email);
    } else if (row?.emails && Array.isArray(row.emails)) {
      // Legacy v1 row — migrate in memory; persisted on next write.
      entries = row.emails.map((e) => ({
        email: normalize(e),
        role: "admin" as AdminRole,
      }));
    }
  } catch (err) {
    console.warn("[admins.readAdditional] failed:", err);
  }
  cache = { value: entries, expires: Date.now() + CACHE_TTL_MS };
  return entries;
}

export async function listAllAdmins(): Promise<{
  bootstrap: AdminEntry[];
  additional: AdminEntry[];
  all: AdminEntry[];
}> {
  const bootstrap: AdminEntry[] = (BOOTSTRAP_ADMIN_EMAILS as readonly string[]).map(
    (email) => ({ email, role: "master_admin" as AdminRole }),
  );
  const additional = await readAdditional();
  // De-dupe: bootstrap always wins on role.
  const bootstrapEmails = new Set(bootstrap.map((b) => b.email));
  const dedupedAdditional = additional.filter(
    (a) => !bootstrapEmails.has(a.email),
  );
  const all = [...bootstrap, ...dedupedAdditional];
  return { bootstrap, additional: dedupedAdditional, all };
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const e = normalize(email);
  if (!e) return false;
  if (isBootstrapAdmin(e)) return true;
  const additional = await readAdditional();
  return additional.some((a) => a.email === e);
}

export async function isMasterAdminEmail(email: string): Promise<boolean> {
  const e = normalize(email);
  if (!e) return false;
  if (isBootstrapAdmin(e)) return true;
  const additional = await readAdditional();
  return additional.some(
    (a) => a.email === e && a.role === "master_admin",
  );
}

export async function getAdminRole(email: string): Promise<AdminRole | null> {
  const e = normalize(email);
  if (!e) return null;
  if (isBootstrapAdmin(e)) return "master_admin";
  const additional = await readAdditional();
  const found = additional.find((a) => a.email === e);
  return found?.role || null;
}

async function writeAdditional(
  entries: AdminEntry[],
  updatedBy: string,
): Promise<void> {
  // De-dupe by email; last write wins.
  const map = new Map<string, AdminEntry>();
  for (const a of entries) {
    if (!a.email) continue;
    map.set(a.email, { ...a, email: normalize(a.email) });
  }
  const final = [...map.values()];
  await ddb().send(
    new PutCommand({
      TableName: Tables.secrets,
      Item: {
        id: ADMIN_EMAILS_KEY,
        admins: final,
        updatedAt: new Date().toISOString(),
        updatedBy,
      } satisfies AdminEmailsRow,
    }),
  );
  cache = null;
}

export async function addAdminEmail(
  email: string,
  updatedBy: string,
  role: AdminRole = "admin",
) {
  const e = normalize(email);
  if (!e || !e.includes("@")) {
    throw new Error("Invalid email");
  }
  if (isBootstrapAdmin(e)) {
    return; // already master_admin via bootstrap — no-op
  }
  const existing = await readAdditional();
  const filtered = existing.filter((a) => a.email !== e);
  filtered.push({
    email: e,
    role,
    addedAt: new Date().toISOString(),
    addedBy: updatedBy,
  });
  await writeAdditional(filtered, updatedBy);
}

export async function setAdminRole(
  email: string,
  role: AdminRole,
  updatedBy: string,
) {
  const e = normalize(email);
  if (!e) throw new Error("Invalid email");
  if (isBootstrapAdmin(e)) {
    throw new Error(
      "Bootstrap admins are always master_admin and cannot be demoted.",
    );
  }
  const existing = await readAdditional();
  if (!existing.some((a) => a.email === e)) {
    throw new Error("That email isn't in the admin list yet.");
  }
  const updated = existing.map((a) =>
    a.email === e ? { ...a, role } : a,
  );
  await writeAdditional(updated, updatedBy);
}

export async function removeAdminEmail(email: string, updatedBy: string) {
  const e = normalize(email);
  if (!e) throw new Error("Invalid email");
  if (isBootstrapAdmin(e)) {
    throw new Error(
      "Bootstrap admins are part of the protected list and cannot be removed from the UI.",
    );
  }
  const existing = await readAdditional();
  if (!existing.some((a) => a.email === e)) return;
  await writeAdditional(
    existing.filter((a) => a.email !== e),
    updatedBy,
  );
}
