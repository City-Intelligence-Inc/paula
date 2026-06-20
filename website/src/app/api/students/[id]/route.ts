import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import {
  resolveActor,
  forbidden,
  tutorScopeForStudent,
  stripPricingFromStudent,
} from "@/lib/server/access";
import type { Student } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  const a = actor!;

  const { id } = await params;
  const result = await ddb().send(
    new GetCommand({ TableName: Tables.students, Key: { id } }),
  );
  if (!result.Item) {
    return Response.json({ error: "Student not found" }, { status: 404 });
  }
  // School-portal credentials are admin-only and flow exclusively through
  // /api/students/:id/credentials — never expose them on the general GET.
  const { schoolLogins: _omit, ...student } = result.Item;
  void _omit;

  // Authorization: admins see everything. Tutors only see students they're
  // assigned to, and never the pricing/billing fields. Parents don't use
  // this endpoint.
  if (a.isAdmin) {
    return Response.json({ student });
  }
  if (a.role === "tutor" && a.tutor) {
    const scope = tutorScopeForStudent(student as Pick<Student, "tutorIds" | "tutorAccess">, a.tutor.id);
    if (scope === "none") {
      return forbidden("You are not assigned to this student.");
    }
    return Response.json({ student: stripPricingFromStudent(student) });
  }
  return forbidden();
}

const editableFields = [
  "firstName",
  "lastName",
  "grade",
  "status",
  "parentName",
  "parentEmail",
  "parentPhone",
  "sessionType",
  "rate",
  "tutorIds",
  "tutorAccess",
  "classCapacity",
  "primaryPayerParentId",
  "studentEmail",
] as const;

type Editable = (typeof editableFields)[number];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Editing a student record (rate, tutor assignments, status…) is admin-only.
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Admin access required.");
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sets: string[] = ["#updatedAt = :updatedAt"];
  const names: Record<string, string> = { "#updatedAt": "updatedAt" };
  const values: Record<string, unknown> = {
    ":updatedAt": new Date().toISOString(),
  };

  for (const f of editableFields as readonly Editable[]) {
    if (!(f in body)) continue;
    const v = body[f];
    if (v === undefined) continue;
    names[`#${f}`] = f;
    values[`:${f}`] = v;
    sets.push(`#${f} = :${f}`);
  }

  if (sets.length === 1) {
    return Response.json({ error: "No editable fields supplied" }, { status: 400 });
  }

  try {
    const out = await ddb().send(
      new UpdateCommand({
        TableName: Tables.students,
        Key: { id },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      }),
    );
    return Response.json({ student: out.Attributes });
  } catch (err) {
    console.error("[PUT /api/students/:id] failed:", err);
    return Response.json(
      { error: "Update failed", detail: String(err) },
      { status: 500 },
    );
  }
}
