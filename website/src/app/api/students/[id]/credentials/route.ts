import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireRole } from "@/lib/server/ddb";
import type { SchoolLogin } from "@/lib/types";

// "Ghost-student" school portal credentials.
//
// Admin-only — gated by requireRole(["master_admin","admin"]). Per Paula's
// 5/17 note: she needs a secure place to store student school logins so she
// can sign in as the "ghost student" and track assignments/communications.
// These are deliberately NOT part of the general student GET; they only flow
// through this route so tutors and parents can never read them once RBAC is
// enforced. The row lives in the (at-rest encrypted) students table.

const ADMIN_ROLES = ["master_admin", "admin"] as const;

function sanitize(input: unknown, now: string): SchoolLogin[] {
  if (!Array.isArray(input)) return [];
  const out: SchoolLogin[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const portal = typeof r.portal === "string" ? r.portal.trim() : "";
    const username = typeof r.username === "string" ? r.username.trim() : "";
    const password = typeof r.password === "string" ? r.password : "";
    // A credential with no portal label AND no username is just an empty row.
    if (!portal && !username) continue;
    out.push({
      id:
        typeof r.id === "string" && r.id
          ? r.id
          : `cred_${out.length}_${now.replace(/[^0-9]/g, "")}`,
      portal,
      url: typeof r.url === "string" ? r.url.trim() : undefined,
      username,
      password,
      notes: typeof r.notes === "string" ? r.notes.trim() : undefined,
      // Server-authoritative timestamp — don't trust client clocks.
      updatedAt: now,
    });
  }
  return out;
}

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
  const credentials = sanitize(body.credentials, now);

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
