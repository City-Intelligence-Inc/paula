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
// Mailchimp: every upsert is mirrored to the configured audience
// (MAILCHIMP_API_KEY + MAILCHIMP_AUDIENCE_ID). Best-effort — a Mailchimp
// outage never blocks a lead from being recorded.

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
  mailchimpSyncedAt?: string;
  mailchimpError?: string;
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

  // Mirror to Mailchimp before persisting so the sync status lands on the row.
  const sync = await pushToMailchimp(contact);
  if (sync.ok) {
    contact.mailchimpSyncedAt = now;
    delete contact.mailchimpError;
  } else if (sync.error) {
    contact.mailchimpError = sync.error;
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

// ---- Mailchimp ----
// PUT (upsert) the member by md5(email) into the configured audience.
// status_if_new "subscribed" matches the inquiry form's fine print ("by
// submitting you are joining our mailing list" — Paula 7/1).
async function pushToMailchimp(
  contact: Contact,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = (process.env.MAILCHIMP_API_KEY || "").trim();
  const listId = (process.env.MAILCHIMP_AUDIENCE_ID || "").trim();
  if (!apiKey || !listId) {
    return { ok: false }; // not configured — silently skip, no error recorded
  }
  const dc = apiKey.split("-").pop();
  if (!dc || !dc.startsWith("us")) {
    return { ok: false, error: "MAILCHIMP_API_KEY missing -usN datacenter suffix" };
  }
  const memberHash = createHash("md5")
    .update(contact.email.toLowerCase())
    .digest("hex");
  const [firstName, ...rest] = (contact.name || "").split(" ");
  try {
    const res = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${memberHash}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: contact.email,
          status_if_new: "subscribed",
          merge_fields: {
            FNAME: firstName || "",
            LNAME: rest.join(" "),
            ...(contact.phone ? { PHONE: contact.phone } : {}),
          },
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Mailchimp ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
