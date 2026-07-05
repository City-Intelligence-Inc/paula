import { PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { currentUser } from "@clerk/nextjs/server";
import { ddb, Tables } from "@/lib/server/ddb";
import { sendAdminNotification } from "@/lib/server/notify";
import { splitFullName } from "@/lib/names";

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

// GET /api/onboarding — the card-gate status for the signed-in user (C-1
// "Credit Card Gate" / B-5). Resolves their parent record by Clerk id OR by
// email (an invited parent's row was created at /register, before any Clerk
// account existed — we link clerkUserId here on first contact), then reports
// whether a card is already on file so the onboarding page can skip straight
// to the right step.
export async function GET() {
  const clerkUser = await currentUser().catch(() => null);
  if (!clerkUser) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }
  const primaryEmail = clerkUser.emailAddresses?.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;
  const email = (primaryEmail || clerkUser.emailAddresses?.[0]?.emailAddress || "").toLowerCase();

  // Staff and tutors are never card-gated (QA bug #5: team accounts were
  // funneled into the family portal). Send them to their own portals.
  if (email) {
    const { isAdminEmail } = await import("@/lib/server/admins");
    if (await isAdminEmail(email)) {
      return Response.json({ redirect: "/admin" });
    }
    const { findTutorByEmail } = await import("@/lib/server/access");
    if (await findTutorByEmail(clerkUser.id, email)) {
      return Response.json({ redirect: "/tutor" });
    }
  }

  const r = await ddb().send(new ScanCommand({ TableName: Tables.parents }));
  const parents = (r.Items || []) as {
    id: string;
    email?: string;
    clerkUserId?: string;
    stripeCustomerId?: string;
    createdAt?: string;
  }[];
  const parent =
    parents.find((p) => p.clerkUserId === clerkUser.id) ||
    parents.find(
      (p) => email && (p.email || "").trim().toLowerCase() === email,
    ) ||
    null;

  if (!parent) {
    return Response.json({ parentId: null, hasCard: false, needsInfo: true });
  }

  // First sign-in after an invited registration: attach the Clerk account.
  if (!parent.clerkUserId) {
    await ddb()
      .send(
        new UpdateCommand({
          TableName: Tables.parents,
          Key: { id: parent.id },
          UpdateExpression: "SET clerkUserId = :c, updatedAt = :u",
          ExpressionAttributeValues: {
            ":c": clerkUser.id,
            ":u": new Date().toISOString(),
          },
        }),
      )
      .catch(() => {});
  }

  let hasCard = false;
  if (parent.stripeCustomerId) {
    try {
      const { getStripe } = await import("@/lib/server/stripe");
      const stripe = await getStripe();
      const pms = await stripe.paymentMethods.list({
        customer: parent.stripeCustomerId,
        type: "card",
        limit: 1,
      });
      hasCard = pms.data.length > 0;
    } catch {
      hasCard = false;
    }
  }

  return Response.json({ parentId: parent.id, hasCard, needsInfo: false });
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

  type StudentInput = {
    firstName?: string;
    lastName?: string;
    grade?: string;
    school?: string;
  };
  let body: {
    parentFirstName?: string;
    parentLastName?: string;
    parentPhone?: string;
    students?: StudentInput[];
    // Legacy single-student payload (pre multi-child onboarding).
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

  // Normalize to a list: accept the new `students` array, fall back to the
  // legacy single-student fields, then drop any blank rows.
  const studentInputs: StudentInput[] = (
    body.students?.length
      ? body.students
      : [{ firstName: body.studentFirstName, lastName: body.studentLastName, grade: body.grade, school: body.school }]
  ).filter((s) => s.firstName?.trim() && s.lastName?.trim());

  if (studentInputs.length === 0) {
    return Response.json({ error: "At least one student's first and last name is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const suffix = Math.random().toString(36).slice(2, 6);
  const firstStudent = studentInputs[0];
  const slug = slugify(`${firstStudent.firstName}_${firstStudent.lastName}`) || `s_${Date.now()}`;

  const familyId = `fam_${slug}_${suffix}`;
  const parentId = `par_${slug}_${suffix}`;

  const parentFirstName = body.parentFirstName?.trim() || clerkUser.firstName || email.split("@")[0];
  const parentLastName = body.parentLastName?.trim() || clerkUser.lastName || "";
  const parentName = [parentFirstName, parentLastName].filter(Boolean).join(" ");
  // The parents `by-family` GSI keys on (familyId, lastName); an empty-string
  // sort key is rejected by DynamoDB. splitFullName guarantees a non-empty
  // lastName from the display name above (parentFirstName always resolves to
  // at least the email local-part), so a self-enroller who gives only a first
  // name still writes cleanly (QA bug #3, generalized to this path).
  const { firstName: safeParentFirst, lastName: safeParentLast } =
    splitFullName(parentName);

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
    firstName: safeParentFirst,
    lastName: safeParentLast,
    email,
    phone: body.parentPhone?.trim() || "",
    createdAt: now,
    updatedAt: now,
  };

  const students = studentInputs.map((s, i) => {
    const sSlug =
      slugify(`${s.firstName}_${s.lastName}`) || `s_${Date.now()}_${i}`;
    return {
      // Unique per student — the shared suffix + a per-student slug/index keeps
      // siblings from colliding on a shared last name.
      id: `stu_${sSlug}_${suffix}${i > 0 ? `_${i}` : ""}`,
      familyId,
      firstName: s.firstName!.trim(),
      lastName: s.lastName!.trim(),
      grade: s.grade || "K",
      ...(s.school?.trim() ? { school: s.school.trim() } : {}),
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
  });

  try {
    await Promise.all([
      ddb().send(new PutCommand({ TableName: Tables.families, Item: family })),
      ddb().send(new PutCommand({ TableName: Tables.parents, Item: parent })),
      ...students.map((student) =>
        ddb().send(new PutCommand({ TableName: Tables.students, Item: student }))
      ),
    ]);

    const studentLine = (s: (typeof students)[number]) =>
      `${s.firstName} ${s.lastName}, Grade ${s.grade}${s.school ? `, ${s.school}` : ""}`;
    const label = students.length === 1 ? "Student" : "Students";
    sendAdminNotification({
      subject: "New family self-enrolled",
      html: `<p>A family completed the onboarding flow and is now in the system.</p>
<p><strong>Parent:</strong> ${parentName} (${email})</p>
<p><strong>${label}:</strong></p>
<ul>${students.map((s) => `<li>${studentLine(s)}</li>`).join("")}</ul>
<p>Their account is live — they may still need a rate and tutor assignment before sessions begin.</p>`,
      text: `New family self-enrolled.\n\nParent: ${parentName} (${email})\n${label}:\n${students.map((s) => `  - ${studentLine(s)}`).join("\n")}\n\nSet their rate and tutor in the admin portal.`,
    }).catch(() => {});

    return Response.json({ parentId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/onboarding] failed:", err);
    return Response.json({ error: "Registration failed", detail: String(err) }, { status: 500 });
  }
}
