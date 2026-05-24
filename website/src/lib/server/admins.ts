import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";

// Hardcoded bootstrap admins — these can never be removed via the UI. They
// guarantee at least one human can always sign in even if the DDB row is
// deleted by accident. Keep in sync with the same list in
// src/app/dashboard/layout.tsx and src/components/sections/navbar.tsx.
export const BOOTSTRAP_ADMIN_EMAILS = [
  "phamilton@mathitude.com",
  "ari@coframe.com",
  "nljq16@stanford.edu",
] as const;

const ADMIN_EMAILS_KEY = "admin-emails";
const CACHE_TTL_MS = 30_000;
let cache: { value: string[]; expires: number } | null = null;

interface AdminEmailsRow {
  id: string;
  emails: string[];
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

export async function listAdditionalAdmins(): Promise<string[]> {
  if (cache && cache.expires > Date.now()) return cache.value;
  let emails: string[] = [];
  try {
    const r = await ddb().send(
      new GetCommand({ TableName: Tables.secrets, Key: { id: ADMIN_EMAILS_KEY } }),
    );
    const row = r.Item as AdminEmailsRow | undefined;
    if (row?.emails && Array.isArray(row.emails)) {
      emails = row.emails.map(normalize).filter(Boolean);
    }
  } catch (err) {
    console.warn("[listAdditionalAdmins] read failed:", err);
  }
  cache = { value: emails, expires: Date.now() + CACHE_TTL_MS };
  return emails;
}

export async function listAllAdminEmails(): Promise<{
  bootstrap: string[];
  additional: string[];
  all: string[];
}> {
  const additional = await listAdditionalAdmins();
  const bootstrap = [...BOOTSTRAP_ADMIN_EMAILS];
  const all = Array.from(new Set([...bootstrap, ...additional]));
  return { bootstrap, additional, all };
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const e = normalize(email);
  if (!e) return false;
  if (isBootstrapAdmin(e)) return true;
  const list = await listAdditionalAdmins();
  return list.includes(e);
}

async function writeAdditionalAdmins(
  emails: string[],
  updatedBy: string,
): Promise<void> {
  const unique = Array.from(new Set(emails.map(normalize).filter(Boolean)));
  await ddb().send(
    new PutCommand({
      TableName: Tables.secrets,
      Item: {
        id: ADMIN_EMAILS_KEY,
        emails: unique,
        updatedAt: new Date().toISOString(),
        updatedBy,
      } satisfies AdminEmailsRow,
    }),
  );
  cache = null;
}

export async function addAdminEmail(email: string, updatedBy: string) {
  const e = normalize(email);
  if (!e || !e.includes("@")) {
    throw new Error("Invalid email");
  }
  if (isBootstrapAdmin(e)) {
    return; // already an admin via bootstrap list — no-op
  }
  const existing = await listAdditionalAdmins();
  if (existing.includes(e)) return;
  await writeAdditionalAdmins([...existing, e], updatedBy);
}

export async function removeAdminEmail(email: string, updatedBy: string) {
  const e = normalize(email);
  if (!e) throw new Error("Invalid email");
  if (isBootstrapAdmin(e)) {
    throw new Error(
      "This admin is part of the bootstrap list and cannot be removed from the UI.",
    );
  }
  const existing = await listAdditionalAdmins();
  if (!existing.includes(e)) return;
  await writeAdditionalAdmins(
    existing.filter((x) => x !== e),
    updatedBy,
  );
}
