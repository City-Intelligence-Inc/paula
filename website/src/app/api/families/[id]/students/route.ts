import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";
import { notifyAction } from "@/lib/server/notify";

interface AddSiblingBody {
  firstName?: string;
  lastName?: string;
  grade?: string;
  status?: "active" | "waitlist" | "inactive";
  sessionType?: "individual" | "group";
  rate?: number;
  primaryPayerParentId?: string;
}

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

// POST /api/families/[id]/students → add a sibling to an existing family.
// Reuses the family's parents + stripe customer + saved card so the family
// doesn't re-enter payment info for each kid. If split-custody applies,
// admin can pass primaryPayerParentId to override the family default.
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id: familyId } = await ctx.params;

  let body: AddSiblingBody;
  try {
    body = (await request.json()) as AddSiblingBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.firstName?.trim() || !body.lastName?.trim()) {
    return Response.json(
      { error: "firstName and lastName are required" },
      { status: 400 },
    );
  }

  const c = ddb();
  const fam = await c.send(
    new GetCommand({ TableName: Tables.families, Key: { id: familyId } }),
  );
  if (!fam.Item) {
    return Response.json({ error: "Family not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const baseSlug =
    slugify(`${body.firstName}_${body.lastName}`) || `s_${Date.now()}`;
  const suffix = Math.random().toString(36).slice(2, 6);
  const student: Record<string, unknown> = {
    id: `stu_${baseSlug}_${suffix}`,
    familyId,
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    grade: body.grade || "",
    status: body.status || "active",
    sessionType: body.sessionType || "individual",
    rate: typeof body.rate === "number" ? body.rate : 0,
    tutorIds: [],
    createdAt: now,
    updatedAt: now,
  };
  if (body.primaryPayerParentId?.trim()) {
    student.primaryPayerParentId = body.primaryPayerParentId.trim();
  }

  try {
    await c.send(new PutCommand({ TableName: Tables.students, Item: student }));
  } catch (err) {
    console.error("[POST family students] failed:", err);
    return Response.json(
      { error: "Create failed", detail: String(err) },
      { status: 500 },
    );
  }

  await notifyAction({
    kind: "family.sibling_added",
    summary: `Sibling added to family: ${student.firstName} ${student.lastName}`,
    details: {
      familyId,
      studentId: student.id as string,
      grade: (student.grade as string) || "—",
      primaryPayerParentId:
        (student.primaryPayerParentId as string) || "family default",
    },
  }).catch(() => {});

  return Response.json({ student }, { status: 201 });
}
