import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { currentUser } from "@clerk/nextjs/server";
import { ddb, Tables } from "@/lib/server/ddb";
import { sendAdminNotification } from "@/lib/server/notify";

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

// Check if this email already has a family — prevent duplicate registrations.
async function findExistingParentId(email: string): Promise<string | null> {
  const e = email.trim().toLowerCase();
  const r = await ddb().send(
    new ScanCommand({ TableName: Tables.parents, ProjectionExpression: "id, email" }),
  );
  const match = (r.Items || []).find(
    (p) => typeof p.email === "string" && p.email.trim().toLowerCase() === e,
  );
  return match?.id ?? null;
}

export async function POST(request: Request) {
  const clerkUser = await currentUser().catch(() => null);
  if (!clerkUser) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const primaryEmail = clerkUser.emailAddresses?.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;
  const email = (primaryEmail || clerkUser.emailAddresses?.[0]?.emailAddress || "").toLowerCase();

  if (!email) {
    return Response.json({ error: "No email on Clerk account" }, { status: 400 });
  }

  // Idempotent: if they already have a parent record, return it.
  const existingParentId = await findExistingParentId(email);
  if (existingParentId) {
    return Response.json({ parentId: existingParentId }, { status: 200 });
  }

  let body: {
    parentFirstName?: string;
    parentLastName?: string;
    parentPhone?: string;
    studentFirstName?: string;
    studentLastName?: string;
    grade?: string;
    school?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.studentFirstName?.trim() || !body.studentLastName?.trim()) {
    return Response.json({ error: "Student first and last name required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const suffix = Math.random().toString(36).slice(2, 6);
  const slug = slugify(`${body.studentFirstName}_${body.studentLastName}`) || `s_${Date.now()}`;

  const familyId = `fam_${slug}_${suffix}`;
  const parentId = `par_${slug}_${suffix}`;
  const studentId = `stu_${slug}_${suffix}`;

  const parentFirstName = body.parentFirstName?.trim() || clerkUser.firstName || email.split("@")[0];
  const parentLastName = body.parentLastName?.trim() || clerkUser.lastName || "";
  const parentName = [parentFirstName, parentLastName].filter(Boolean).join(" ");

  const family = {
    id: familyId,
    primaryPayerId: parentId,
    createdAt: now,
    updatedAt: now,
  };

  const parent = {
    id: parentId,
    familyId,
    clerkUserId: clerkUser.id,
    firstName: parentFirstName,
    lastName: parentLastName,
    email,
    phone: body.parentPhone?.trim() || "",
    createdAt: now,
    updatedAt: now,
  };

  const student = {
    id: studentId,
    familyId,
    firstName: body.studentFirstName.trim(),
    lastName: body.studentLastName.trim(),
    grade: body.grade || "K",
    ...(body.school?.trim() ? { school: body.school.trim() } : {}),
    status: "active",
    sessionType: "individual",
    rate: 0,
    parentName,
    parentEmail: email,
    parentPhone: body.parentPhone?.trim() || "",
    tutorIds: [],
    createdAt: now,
    updatedAt: now,
  };

  try {
    await Promise.all([
      ddb().send(new PutCommand({ TableName: Tables.families, Item: family })),
      ddb().send(new PutCommand({ TableName: Tables.parents, Item: parent })),
      ddb().send(new PutCommand({ TableName: Tables.students, Item: student })),
    ]);

    sendAdminNotification({
      subject: "New family self-enrolled",
      html: `<p>A family completed the onboarding flow and is now in the system.</p>
<p><strong>Parent:</strong> ${parentName} (${email})</p>
<p><strong>Student:</strong> ${student.firstName} ${student.lastName}, Grade ${student.grade}${student.school ? `, ${student.school}` : ""}</p>
<p>Their account is live — they may still need a rate and tutor assignment before sessions begin.</p>`,
      text: `New family self-enrolled.\n\nParent: ${parentName} (${email})\nStudent: ${student.firstName} ${student.lastName}, Grade ${student.grade}\n\nSet their rate and tutor in the admin portal.`,
    }).catch(() => {});

    return Response.json({ parentId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/onboarding] failed:", err);
    return Response.json({ error: "Registration failed", detail: String(err) }, { status: 500 });
  }
}
