import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { addAdminEmail } from "@/lib/server/admins";
import { notifyAction } from "@/lib/server/notify";
import {
  consumeInvite,
  createInvite,
  getInviteByToken,
  inviteIsActive,
  sendInviteEmail,
} from "@/lib/server/invites";
import { GRADE_OPTIONS } from "@/lib/grades";
import type { GuardianRelationship, Student } from "@/lib/types";

// POST /api/register — public endpoint behind the tokenized invite (C-1/C-9).
// Consumes the single-use token atomically, then creates the entity rows for
// the invited role. The account email comes exclusively from the invite —
// nothing in the request body can change it. After this succeeds the client
// sends the user to Clerk sign-up with the same email; role resolution
// (access.ts) links them on first sign-in via the created rows.

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

const RELATIONSHIPS: GuardianRelationship[] = [
  "parent",
  "stepparent",
  "grandparent",
  "aunt",
  "uncle",
  "nanny",
  "guardian",
  "other",
];

interface ChildInput {
  firstName?: string;
  lastName?: string;
  school?: string;
  grade?: string;
  birthday?: string; // YYYY-MM-DD
}

interface CaregiverInput {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Body {
  token?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  relationship?: string;
  children?: ChildInput[];
  caregivers?: CaregiverInput[];
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const invite = await getInviteByToken(body.token || "");
  if (!invite || !inviteIsActive(invite)) {
    return Response.json(
      { error: "This invitation link is no longer valid." },
      { status: 410 },
    );
  }

  const firstName = body.firstName?.trim() || invite.firstName || "";
  const lastName = body.lastName?.trim() || invite.lastName || "";
  if (!firstName || !lastName) {
    return Response.json(
      { error: "First and last name are required." },
      { status: 400 },
    );
  }

  // Validate role-specific input BEFORE consuming the single-use token, so a
  // form error never burns the invitation.
  const children = (body.children || []).filter(
    (c) => c.firstName?.trim() && c.lastName?.trim(),
  );
  if (invite.role === "parent" && !invite.familyId && children.length === 0) {
    return Response.json(
      { error: "Add at least one child so we can set up your family." },
      { status: 400 },
    );
  }
  for (const c of children) {
    if (c.grade && !GRADE_OPTIONS.includes(c.grade as (typeof GRADE_OPTIONS)[number])) {
      return Response.json({ error: `Unknown grade: ${c.grade}` }, { status: 400 });
    }
    if (c.birthday && !/^\d{4}-\d{2}-\d{2}$/.test(c.birthday)) {
      return Response.json(
        { error: "Birthdays must be YYYY-MM-DD." },
        { status: 400 },
      );
    }
  }
  const caregivers = (body.caregivers || []).filter(
    (g) => g.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email),
  );

  // Single-use gate: exactly one submit wins (C-1).
  const consumed = await consumeInvite(invite.token);
  if (!consumed) {
    return Response.json(
      { error: "This invitation link has already been used." },
      { status: 410 },
    );
  }

  const now = new Date().toISOString();
  const suffix = Math.random().toString(36).slice(2, 6);
  const c = ddb();

  try {
    if (invite.role === "tutor") {
      // An admin may have created the tutor row before inviting them — in
      // that case sign-in links by email and there's nothing to create.
      const existing = await c.send(
        new ScanCommand({
          TableName: Tables.tutors,
          ProjectionExpression: "id, email",
        }),
      );
      const already = (existing.Items || []).some(
        (t) =>
          typeof t.email === "string" &&
          t.email.trim().toLowerCase() === invite.email,
      );
      if (!already) {
        const slug = slugify(`${firstName}_${lastName}`) || `t_${suffix}`;
        await c.send(
          new PutCommand({
            TableName: Tables.tutors,
            Item: {
              id: `tut_${slug}_${suffix}`,
              firstName,
              lastName,
              email: invite.email,
              assignedStudentIds: [],
              active: true,
              createdAt: now,
              updatedAt: now,
            },
          }),
        );
      }
    } else if (invite.role === "office") {
      await addAdminEmail(invite.email, `invite:${invite.invitedBy}`, "admin");
    } else if (invite.role === "student") {
      if (invite.studentId) {
        await c.send(
          new UpdateCommand({
            TableName: Tables.students,
            Key: { id: invite.studentId },
            UpdateExpression: "SET studentEmail = :e, updatedAt = :u",
            ExpressionAttributeValues: { ":e": invite.email, ":u": now },
          }),
        );
      }
    } else {
      // parent — join an existing family or create a new one with children.
      const relationship = RELATIONSHIPS.includes(
        body.relationship as GuardianRelationship,
      )
        ? (body.relationship as GuardianRelationship)
        : "parent";
      const phone = body.phone?.trim() || "";
      const parentName = `${firstName} ${lastName}`.trim();

      let familyId = invite.familyId || "";
      const slug =
        slugify(
          children[0]
            ? `${children[0].firstName}_${children[0].lastName}`
            : `${firstName}_${lastName}`,
        ) || `f_${suffix}`;
      const parentId = `par_${slug}_${suffix}`;

      if (familyId) {
        const fam = await c.send(
          new GetCommand({ TableName: Tables.families, Key: { id: familyId } }),
        );
        if (!fam.Item) familyId = "";
      }
      if (!familyId) {
        familyId = `fam_${slug}_${suffix}`;
        await c.send(
          new PutCommand({
            TableName: Tables.families,
            Item: {
              id: familyId,
              primaryPayerId: parentId,
              createdAt: now,
              updatedAt: now,
            },
          }),
        );
      }

      await c.send(
        new PutCommand({
          TableName: Tables.parents,
          Item: {
            id: parentId,
            familyId,
            firstName,
            lastName,
            email: invite.email,
            phone,
            relationship,
            createdAt: now,
            updatedAt: now,
          },
        }),
      );

      for (const [i, child] of children.entries()) {
        const kidSlug =
          slugify(`${child.firstName}_${child.lastName}`) || `k${i}_${suffix}`;
        const student: Student = {
          id: `stu_${kidSlug}_${suffix}`,
          familyId,
          firstName: child.firstName!.trim(),
          lastName: child.lastName!.trim(),
          grade: child.grade || "K",
          ...(child.school?.trim() ? { school: child.school.trim() } : {}),
          ...(child.birthday ? { birthday: child.birthday } : {}),
          status: "active",
          sessionType: "individual",
          rate: 0,
          parentName,
          parentEmail: invite.email,
          parentPhone: phone,
          tutorIds: [],
          createdAt: now,
          updatedAt: now,
        };
        await c.send(
          new PutCommand({ TableName: Tables.students, Item: student }),
        );
      }

      // Additional caregivers each get their own tokenized invite (C-9).
      for (const g of caregivers) {
        if (g.email!.toLowerCase() === invite.email) continue;
        const gInvite = await createInvite({
          email: g.email!,
          role: "parent",
          firstName: g.firstName,
          lastName: g.lastName,
          familyId,
          invitedBy: `registration:${invite.email}`,
        });
        sendInviteEmail(gInvite).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[POST /api/register] entity creation failed:", err);
    return Response.json(
      {
        error:
          "Your invitation was accepted but account setup hit an error — please contact info@mathitude.com.",
      },
      { status: 500 },
    );
  }

  notifyAction({
    kind: "user.registered",
    summary: `${invite.email} completed registration (${invite.role})`,
    details: {
      role: invite.role,
      children: children.length,
      caregiversInvited: caregivers.length,
    },
  }).catch(() => {});

  return Response.json({ ok: true, email: invite.email, role: invite.role });
}
