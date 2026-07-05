import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import { notifyAction } from "@/lib/server/notify";
import { splitFullName } from "@/lib/names";

// Find an existing family by a caregiver's email so a new student with the
// same parent email JOINS that family instead of splintering into a new one
// (Sara: "they still 'splinter' into two families"). Returns the familyId of
// the matching parent, or null.
async function findFamilyByParentEmail(email: string): Promise<string | null> {
  const e = email.trim().toLowerCase();
  if (!e) return null;
  try {
    const r = await ddb().send(
      new ScanCommand({ TableName: Tables.parents, ProjectionExpression: "familyId, email" }),
    );
    const match = (r.Items || []).find(
      (p) => typeof p.email === "string" && p.email.trim().toLowerCase() === e,
    );
    return (match?.familyId as string | undefined) || null;
  } catch (err) {
    console.warn("[findFamilyByParentEmail] failed:", err);
    return null;
  }
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;

  const params: ScanCommandInput = { TableName: Tables.students };
  if (q) {
    params.FilterExpression =
      "contains(firstName, :q) OR contains(lastName, :q) OR contains(parentName, :q) OR contains(grade, :q)";
    params.ExpressionAttributeValues = { ":q": q };
  }

  const result = await ddb().send(new ScanCommand(params));
  return Response.json({ students: result.Items || [] });
}

interface NewStudentBody {
  firstName?: string;
  lastName?: string;
  grade?: string;
  school?: string;
  status?: "active" | "waitlist" | "inactive";
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  sessionType?: "individual" | "group";
  rate?: number;
  // Pass to add this student to an existing family (sibling flow); when set
  // we skip the family+parent autocreate and inherit billing from the
  // existing family.
  familyId?: string;
  primaryPayerParentId?: string;
}

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export async function POST(request: Request) {
  // Creating students is admin-only.
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Admin access required.");

  let body: NewStudentBody;
  try {
    body = (await request.json()) as NewStudentBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.firstName || !body.lastName) {
    return Response.json(
      { error: "firstName and lastName required" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const baseSlug =
    slugify(`${body.firstName}_${body.lastName}`) || `s_${Date.now()}`;
  const suffix = Math.random().toString(36).slice(2, 6);
  const studentId = `stu_${baseSlug}_${suffix}`;
  // Resolve the family this student joins:
  //   1. Explicit familyId (sibling flow from a family profile).
  //   2. Otherwise, dedup by the caregiver's email — if a parent already has
  //      that email, join their family (don't splinter).
  //   3. Otherwise, create a fresh family + parent.
  let resolvedFamilyId = body.familyId?.trim() || "";
  if (!resolvedFamilyId && body.parentEmail?.trim()) {
    const existing = await findFamilyByParentEmail(body.parentEmail);
    if (existing) resolvedFamilyId = existing;
  }
  const useExistingFamily = !!resolvedFamilyId;

  // When creating a fresh family we also write a parent row, and the
  // `by-family` GSI keys on (familyId, lastName) — DynamoDB rejects an
  // empty-string sort key, so the parent must resolve to a non-empty
  // lastName. splitFullName routes a single-word name to lastName; a fully
  // blank name still yields none, so require one up front with a friendly
  // message instead of leaking the raw DynamoDB error (QA bug #3).
  const { firstName: parentFirst, lastName: parentLast } = splitFullName(
    body.parentName,
  );
  if (!useExistingFamily && !parentLast) {
    return Response.json(
      { error: "Parent name is required to create a new family." },
      { status: 400 },
    );
  }

  const familyId = useExistingFamily
    ? resolvedFamilyId
    : `fam_${baseSlug}_${suffix}`;
  const parentId = useExistingFamily ? "" : `par_${baseSlug}_${suffix}`;

  const family = useExistingFamily
    ? null
    : {
        id: familyId,
        primaryPayerId: parentId,
        createdAt: now,
        updatedAt: now,
      };

  const parent = useExistingFamily
    ? null
    : {
        id: parentId,
        familyId,
        firstName: parentFirst,
        lastName: parentLast,
        email: body.parentEmail || "",
        phone: body.parentPhone || "",
        createdAt: now,
        updatedAt: now,
      };

  const student: Record<string, unknown> = {
    id: studentId,
    familyId,
    firstName: body.firstName,
    lastName: body.lastName,
    grade: body.grade || "",
    ...(body.school?.trim() ? { school: body.school.trim() } : {}),
    status: body.status || "active",
    sessionType: body.sessionType || "individual",
    rate: typeof body.rate === "number" ? body.rate : 0,
    parentName: body.parentName || "",
    parentEmail: body.parentEmail || "",
    parentPhone: body.parentPhone || "",
    tutorIds: [],
    createdAt: now,
    updatedAt: now,
  };
  if (body.primaryPayerParentId?.trim()) {
    student.primaryPayerParentId = body.primaryPayerParentId.trim();
  }

  try {
    const writes: Promise<unknown>[] = [
      ddb().send(new PutCommand({ TableName: Tables.students, Item: student })),
    ];
    if (family) {
      writes.push(
        ddb().send(new PutCommand({ TableName: Tables.families, Item: family })),
      );
    }
    if (parent) {
      writes.push(
        ddb().send(new PutCommand({ TableName: Tables.parents, Item: parent })),
      );
    }
    await Promise.all(writes);
    await notifyAction({
      kind: "student.created",
      summary: `New student added: ${student.firstName} ${student.lastName}`,
      details: {
        studentId: student.id,
        grade: student.grade || "—",
        parentName: student.parentName || "—",
        parentEmail: student.parentEmail || "—",
        familyId: student.familyId,
      },
    }).catch(() => {});

    return Response.json({ student }, { status: 201 });
  } catch (err) {
    // Log the full exception server-side; never surface raw AWS/DynamoDB
    // internals (table + index names) to the admin UI (QA bug #3b).
    console.error("[POST /api/students] failed:", err);
    return Response.json(
      { error: "Couldn't save the student. Please try again or contact support." },
      { status: 500 },
    );
  }
}
