import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireRole } from "@/lib/server/ddb";
import type { SchoolLogin } from "@/lib/types";
import { sanitizeSchoolLogins } from "@/lib/school-logins";

// "Ghost-student" school portal credentials.
//
// Admin-only — gated by requireRole(["master_admin","admin"]). Per Paula's
// 5/17 note: she needs a secure place to store student school logins so she
// can sign in as the "ghost student" and track assignments/communications.
// These are deliberately NOT part of the general student GET; they only flow
// through this route so tutors and parents can never read them once RBAC is
// enforced. The row lives in the (at-rest encrypted) students table.

const ADMIN_ROLES = ["master_admin", "admin"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole([...ADMIN_ROLES]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const result = await ddb().send(
    new GetCommand({
      TableName: Tables.students,
      Key: { id },
      ProjectionExpression: "schoolLogins",
    }),
  );
  if (!result.Item) {
    return Response.json({ error: "Student not found" }, { status: 404 });
  }
  return Response.json({
    credentials: (result.Item.schoolLogins as SchoolLogin[] | undefined) || [],
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole([...ADMIN_ROLES]);
  if (auth.response) return auth.response;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const credentials = sanitizeSchoolLogins(body.credentials, now);

  try {
    await ddb().send(
      new UpdateCommand({
        TableName: Tables.students,
        Key: { id },
        UpdateExpression: "SET #c = :c, #u = :u",
        ExpressionAttributeNames: { "#c": "schoolLogins", "#u": "updatedAt" },
        ExpressionAttributeValues: { ":c": credentials, ":u": now },
        // Don't create a phantom student if the id is wrong.
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "NONE",
      }),
    );
    return Response.json({ credentials });
  } catch (err) {
    if (err && typeof err === "object" && (err as { name?: string }).name === "ConditionalCheckFailedException") {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }
    console.error("[PUT /api/students/:id/credentials] failed:", err);
    return Response.json(
      { error: "Update failed", detail: String(err) },
      { status: 500 },
    );
  }
}
