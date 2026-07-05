import { createHash } from "crypto";
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";

// Contacts database (FEATURE_LIST C-2/C-4). Every lead and customer — from
// the public inquiry form, manual staff entry, or completed registration —
// gets one contact row keyed by email. Rows live in the bookings table
// (type:"contact"), alongside the consultations and invites they originate
// from. Each contact carries a log: the original inquiry contents and every
// staff response, so the whole relationship reads in one place (C-4).
//
// Mailing list: every upsert is mirrored to a Resend Audience
// (RESEND_API_KEY — already used for all transactional email — plus
// RESEND_AUDIENCE_ID). Best-effort — a Resend outage never blocks a lead
// from being recorded. Broadcasts to the list are sent from the Resend
// dashboard.

export interface ContactLogEntry {
  at: string; // ISO timestamp
  by: string; // "inquiry-form" | staff email
  kind: "inquiry" | "response" | "note" | "system";
  text: string;
}

export interface Contact {
  id: string; // `contact_${md5(email)}`
  type: "contact";
  email: string;
  name: string;
  phone?: string;
  source: "inquiry" | "manual" | "registration";
  familyId?: string;
  studentInfo?: string; // student names/grades, free-form from the inquiry
  log: ContactLogEntry[];
  mailingListSyncedAt?: string;
  mailingListError?: string;
  createdAt: string;
  updatedAt: string;
}

export function contactId(email: string): string {
  const e = email.trim().toLowerCase();
  return `contact_${createHash("md5").update(e).digest("hex")}`;
}

export async function getContactByEmail(email: string): Promise<Contact | null> {
  const r = await ddb().send(
    new GetCommand({ TableName: Tables.bookings, Key: { id: contactId(email) } }),
  );
  const item = r.Item as Contact | undefined;
  return item?.type === "contact" ? item : null;
}

export async function listContacts(): Promise<Contact[]> {
  const r = await ddb().send(
    new ScanCommand({
      TableName: Tables.bookings,
      FilterExpression: "#t = :c",
      ExpressionAttributeNames: { "#t": "type" },
      ExpressionAttributeValues: { ":c": "contact" },
    }),
  );
  const items = (r.Items as Contact[]) || [];
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// Create-or-update by email. New log entries append; identity fields fill in
// blanks but never overwrite non-empty values with empty ones.
export async function upsertContact(input: {
  email: string;
  name?: string;
  phone?: string;
  source?: Contact["source"];
  familyId?: string;
  studentInfo?: string;
  logEntry?: Omit<ContactLogEntry, "at">;
}): Promise<Contact> {
  const email = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const existing = await getContactByEmail(email);

  const contact: Contact = existing
    ? {
        ...existing,
        name: input.name?.trim() || existing.name,
        phone: input.phone?.trim() || existing.phone,
        familyId: input.familyId || existing.familyId,
        studentInfo: input.studentInfo?.trim() || existing.studentInfo,
        log: input.logEntry
          ? [...existing.log, { ...input.logEntry, at: now }]
          : existing.log,
        updatedAt: now,
      }
    : {
        id: contactId(email),
        type: "contact",
        email,
        name: input.name?.trim() || email,
        phone: input.phone?.trim() || undefined,
        source: input.source || "manual",
        familyId: input.familyId,
        studentInfo: input.studentInfo?.trim() || undefined,
        log: input.logEntry ? [{ ...input.logEntry, at: now }] : [],
        createdAt: now,
        updatedAt: now,
      };

  // Mirror to the Resend audience before persisting so the sync status lands
  // on the row.
  const sync = await pushToResendAudience(contact);
  if (sync.ok) {
    contact.mailingListSyncedAt = now;
    delete contact.mailingListError;
  } else if (sync.error) {
    contact.mailingListError = sync.error;
  }

  await ddb().send(
    new PutCommand({ TableName: Tables.bookings, Item: contact }),
  );
  return contact;
}

export async function appendContactLog(
  email: string,
  entry: Omit<ContactLogEntry, "at">,
): Promise<Contact | null> {
  const existing = await getContactByEmail(email);
  if (!existing) return null;
  const now = new Date().toISOString();
  const updated: Contact = {
    ...existing,
    log: [...existing.log, { ...entry, at: now }],
    updatedAt: now,
  };
  await ddb().send(
    new PutCommand({ TableName: Tables.bookings, Item: updated }),
  );
  return updated;
}

// ---- Resend Audience ----
// The audience ID lives in the DDB secrets table (row "resend-audience"),
// same pattern as the Stripe keys — created once via the master-only
// /api/admin/mailing-list/setup route, no env var required. An env override
// (RESEND_AUDIENCE_ID) still wins if set.

const AUDIENCE_ROW_ID = "resend-audience";
const AUDIENCE_CACHE_MS = 60_000;
let audienceCache: { value: string; expires: number } | null = null;

export async function getResendAudienceId(): Promise<string> {
  const env = (process.env.RESEND_AUDIENCE_ID || "").trim();
  if (env) return env;
  if (audienceCache && audienceCache.expires > Date.now()) {
    return audienceCache.value;
  }
  try {
    const r = await ddb().send(
      new GetCommand({
        TableName: Tables.secrets,
        Key: { id: AUDIENCE_ROW_ID },
      }),
    );
    const id = ((r.Item as { audienceId?: string } | undefined)?.audienceId || "").trim();
    audienceCache = { value: id, expires: Date.now() + AUDIENCE_CACHE_MS };
    return id;
  } catch {
    return "";
  }
}

export async function setResendAudienceId(
  audienceId: string,
  updatedBy: string,
): Promise<void> {
  await ddb().send(
    new PutCommand({
      TableName: Tables.secrets,
      Item: {
        id: AUDIENCE_ROW_ID,
        audienceId,
        updatedAt: new Date().toISOString(),
        updatedBy,
      },
    }),
  );
  audienceCache = null;
}

// Add the contact to the configured Resend audience. Subscribed-by-default
// matches the inquiry form's fine print ("by submitting you are joining our
// mailing list" — Paula 7/1); Resend handles unsubscribe links on
// broadcasts. An already-existing contact counts as synced.
async function pushToResendAudience(
  contact: Contact,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const audienceId = await getResendAudienceId();
  if (!apiKey || !audienceId) {
    return { ok: false }; // not configured — silently skip, no error recorded
  }
  const [firstName, ...rest] = (contact.name || "").split(" ");
  try {
    const res = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: contact.email,
          first_name: firstName || "",
          last_name: rest.join(" "),
          unsubscribed: false,
        }),
      },
    );
    if (res.ok) return { ok: true };
    const body = await res.text().catch(() => "");
    // Duplicate contact = already on the list — that's a successful sync.
    if (res.status === 409 || /already exists/i.test(body)) {
      return { ok: true };
    }
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
