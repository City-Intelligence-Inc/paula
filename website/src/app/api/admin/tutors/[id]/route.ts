import {
  DeleteCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";

interface PutBody {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
}

// GET /api/admin/tutors/[id] → tutor + students assigned to them
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await ctx.params;

  const c = ddb();
  const [tutorRes, studentsRes] = await Promise.all([
    c.send(new GetCommand({ TableName: Tables.tutors, Key: { id } })),
    c.send(
      new ScanCommand({
        TableName: Tables.students,
        FilterExpression: "contains(tutorIds, :t)",
        ExpressionAttributeValues: { ":t": id },
      }),
    ),
  ]);
  if (!tutorRes.Item) {
    return Response.json({ error: "Tutor not found" }, { status: 404 });
  }
  return Response.json({
    tutor: tutorRes.Item,
    students: studentsRes.Items || [],
  });
}

// PUT /api/admin/tutors/[id] → update fields (rename, deactivate, etc.)
export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await ctx.params;

  let body: PutBody;
  try {
    body = (await request.json()) as PutBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sets: string[] = ["updatedAt = :u"];
  const removes: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = { ":u": new Date().toISOString() };

  function setField(field: keyof PutBody, value: unknown) {
    const placeholder = `:${String(field)}`;
    const nameKey = `#${String(field)}`;
    if (value === null || value === "") {
      removes.push(nameKey);
      names[nameKey] = String(field);
    } else if (value !== undefined) {
      sets.push(`${nameKey} = ${placeholder}`);
      names[nameKey] = String(field);
      values[placeholder] = value;
    }
  }

  setField("firstName", body.firstName);
  setField("lastName", body.lastName);
  setField("email", body.email);
  setField("phone", body.phone);
  setField("active", body.active);

  const expr = [
    sets.length ? `SET ${sets.join(", ")}` : "",
    removes.length ? `REMOVE ${removes.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const out = await ddb().send(
    new UpdateCommand({
      TableName: Tables.tutors,
      Key: { id },
      UpdateExpression: expr,
      ExpressionAttributeNames:
        Object.keys(names).length > 0 ? names : undefined,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }),
  );
  return Response.json({ tutor: out.Attributes });
}

// DELETE /api/admin/tutors/[id]
// Refuses if any students still reference this tutor in tutorIds — caller
// must reassign first to avoid leaving orphan references.
export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await ctx.params;

  const c = ddb();
  const assigned = await c.send(
    new ScanCommand({
      TableName: Tables.students,
      FilterExpression: "contains(tutorIds, :t)",
      ExpressionAttributeValues: { ":t": id },
      Limit: 1,
    }),
  );
  if ((assigned.Items || []).length > 0) {
    return Response.json(
      {
        error:
          "Tutor still has students assigned. Reassign their students first.",
      },
      { status: 409 },
    );
  }

  await c.send(new DeleteCommand({ TableName: Tables.tutors, Key: { id } }));
  return Response.json({ ok: true });
}
