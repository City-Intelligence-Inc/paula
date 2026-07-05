import {
  BatchWriteCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import {
  resolveActor,
  forbidden,
  tutorScopeForStudent,
  stripPricingFromStudent,
  stripContactFromStudent,
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
    return Response.json({
      student: stripContactFromStudent(stripPricingFromStudent(student)),
    });
  }
  return forbidden();
}

const editableFields = [
  "firstName",
  "lastName",
  "grade",
  "school",
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
  // C-7: relink a student to a family (via the parent-search autocomplete on
  // the student page) + registration-collected birthday.
  "familyId",
  "birthday",
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

// DELETE /api/students/:id — R-8 hard offboarding, super admin only.
// Cascades to the student's session rows (schedule + notes). Payment rows
// are deliberately RETAINED — they are financial records. Prefer setting
// status to "inactive" (PUT) unless the record really must go.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isMaster) {
    return forbidden("Only the super admin can delete a student.");
  }

  const { id } = await params;
  const c = ddb();
  const existing = await c.send(
    new GetCommand({ TableName: Tables.students, Key: { id } }),
  );
  if (!existing.Item) {
    return Response.json({ error: "Student not found" }, { status: 404 });
  }

  try {
    // Cascade sessions (paged batch deletes of up to 25 keys).
    let deletedSessions = 0;
    let lastKey: Record<string, unknown> | undefined;
    do {
      const page = await c.send(
        new QueryCommand({
          TableName: Tables.sessions,
          KeyConditionExpression: "studentId = :sid",
          ExpressionAttributeValues: { ":sid": id },
          ProjectionExpression: "studentId, dateTime",
          ExclusiveStartKey: lastKey,
        }),
      );
      const keys = (page.Items || []) as { studentId: string; dateTime: string }[];
      for (let i = 0; i < keys.length; i += 25) {
        await c.send(
          new BatchWriteCommand({
            RequestItems: {
              [Tables.sessions]: keys.slice(i, i + 25).map((k) => ({
                DeleteRequest: { Key: { studentId: k.studentId, dateTime: k.dateTime } },
              })),
            },
          }),
        );
      }
      deletedSessions += keys.length;
      lastKey = page.LastEvaluatedKey;
    } while (lastKey);

    await c.send(
      new DeleteCommand({ TableName: Tables.students, Key: { id } }),
    );

    return Response.json({ ok: true, deletedSessions });
  } catch (err) {
    console.error("[DELETE /api/students/:id] failed:", err);
    return Response.json(
      { error: "Delete failed", detail: String(err) },
      { status: 500 },
    );
  }
}
