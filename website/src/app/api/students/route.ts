import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";
import { notifyAction } from "@/lib/server/notify";

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
  const auth = await requireUser();
  if (auth.response) return auth.response;

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
  // Sibling flow: when familyId is provided, attach to existing family and
  // skip the family+parent autocreate. The family's saved card and parents
  // are reused — no need for parents to enter payment info twice.
  const useExistingFamily = !!body.familyId?.trim();
  const familyId = useExistingFamily
    ? (body.familyId as string).trim()
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

  const [parentFirst, ...parentRest] = (body.parentName || "").trim().split(/\s+/);
  const parent = useExistingFamily
    ? null
    : {
        id: parentId,
        familyId,
        firstName: parentFirst || body.parentName || "",
        lastName: parentRest.join(" "),
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
    console.error("[POST /api/students] failed:", err);
    return Response.json(
      { error: "Create failed", detail: String(err) },
      { status: 500 },
    );
  }
}
