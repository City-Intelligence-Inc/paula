import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import {
  appendContactLog,
  listContacts,
  upsertContact,
} from "@/lib/server/contacts";
import type { Student } from "@/lib/types";

// Contacts database API (C-2/C-4).
// GET  → all contacts for office staff / super admin; tutors only see
//        contacts attached to families whose students they service.
// POST → { action: "add", email, name, phone? }          manual contact
//        { action: "respond", email, text }              log a staff response

export async function GET() {
  const { actor, response } = await resolveActor();
  if (response) return response;
  const a = actor!;
  if (!a.isAdmin && a.role !== "tutor") return forbidden();

  let contacts = await listContacts();

  if (!a.isAdmin) {
    // Tutor scope (C-2): only contacts attached to the families they service.
    const tid = a.tutor?.id || "__none__";
    const r = await ddb().send(
      new ScanCommand({
        TableName: Tables.students,
        ProjectionExpression: "familyId, tutorIds",
      }),
    );
    const myFamilies = new Set(
      ((r.Items as Pick<Student, "familyId" | "tutorIds">[]) || [])
        .filter((s) => (s.tutorIds || []).includes(tid))
        .map((s) => s.familyId)
        .filter(Boolean) as string[],
    );
    contacts = contacts
      .filter((c) => c.familyId && myFamilies.has(c.familyId))
      // R-5: tutors never see parent emails/phones or the correspondence
      // log — they get the name and enough context to know who the family
      // is; all communication goes through the site.
      .map((c) => ({
        ...c,
        email: "",
        phone: undefined,
        log: [],
        mailchimpError: undefined,
      }));
  }

  return Response.json({ contacts });
}

interface PostBody {
  action?: "add" | "respond";
  email?: string;
  name?: string;
  phone?: string;
  text?: string;
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

  if (body.action === "respond") {
    const text = body.text?.trim();
    if (!text) {
      return Response.json({ error: "text is required" }, { status: 400 });
    }
    const contact = await appendContactLog(email, {
      by: actor!.email || actor!.userId,
      kind: "response",
      text,
    });
    if (!contact) {
      return Response.json({ error: "Contact not found" }, { status: 404 });
    }
    return Response.json({ contact });
  }

  // default: add
  const contact = await upsertContact({
    email,
    name: body.name,
    phone: body.phone,
    source: "manual",
    logEntry: {
      by: actor!.email || actor!.userId,
      kind: "system",
      text: "Contact added manually.",
    },
  });
  return Response.json({ contact }, { status: 201 });
}
