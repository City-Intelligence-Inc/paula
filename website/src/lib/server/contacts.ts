import { createHash, randomBytes } from "crypto";
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";

// Contacts database (FEATURE_LIST C-2/C-4). Every lead and customer — from
// the public inquiry form, manual staff entry, or completed registration —
// gets one contact row keyed by email. Rows live in the bookings table
// (type:"contact"), alongside the consultations and invites they originate
// from. Each contact carries a log: the original inquiry contents and every
// staff response, so the whole relationship reads in one place (C-4).
//
// Mailing list: this table IS the list — no external audience to sync.
// Everyone is subscribed unless `unsubscribed` (the inquiry form's fine
// print covers the opt-in — Paula 7/1). Broadcasts loop through subscribed
// contacts via /api/admin/mailing-list/broadcast using the same sending
// key as all transactional email; each message carries a tokenized
// one-click unsubscribe link.

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
  unsubscribed?: boolean;
  unsubscribedAt?: string;
  // Random token proving an unsubscribe link was minted by us — the public
  // unsubscribe route requires email + matching token.
  unsubToken?: string;
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
        unsubToken: existing.unsubToken || randomBytes(16).toString("base64url"),
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
        unsubToken: randomBytes(16).toString("base64url"),
        log: input.logEntry ? [{ ...input.logEntry, at: now }] : [],
        createdAt: now,
        updatedAt: now,
      };

  await ddb().send(
    new PutCommand({ TableName: Tables.bookings, Item: contact }),
  );
  return contact;
}

// One-click unsubscribe: flips the flag when the token matches. Returns the
// contact on success, null when the email/token pair doesn't check out.
export async function unsubscribeContact(
  email: string,
  token: string,
): Promise<Contact | null> {
  const existing = await getContactByEmail(email);
  if (!existing || !token || existing.unsubToken !== token) return null;
  if (existing.unsubscribed) return existing;
  const now = new Date().toISOString();
  const updated: Contact = {
    ...existing,
    unsubscribed: true,
    unsubscribedAt: now,
    log: [
      ...existing.log,
      { at: now, by: "unsubscribe-link", kind: "system", text: "Unsubscribed from the mailing list." },
    ],
    updatedAt: now,
  };
  await ddb().send(
    new PutCommand({ TableName: Tables.bookings, Item: updated }),
  );
  return updated;
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

