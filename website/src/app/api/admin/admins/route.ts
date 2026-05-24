import { currentUser } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/server/ddb";
import {
  addAdminEmail,
  listAllAdminEmails,
  removeAdminEmail,
} from "@/lib/server/admins";
import { notifyAction } from "@/lib/server/notify";

async function actorEmail(): Promise<string> {
  try {
    const u = await currentUser();
    const primary = u?.emailAddresses?.find(
      (e) => e.id === u.primaryEmailAddressId,
    )?.emailAddress;
    return (primary || u?.emailAddresses?.[0]?.emailAddress || "unknown")
      .toLowerCase();
  } catch {
    return "unknown";
  }
}

// GET /api/admin/admins — list bootstrap + additional admins
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const data = await listAllAdminEmails();
  return Response.json(data);
}

// POST /api/admin/admins — add a new admin email
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.email) {
    return Response.json({ error: "email required" }, { status: 400 });
  }
  try {
    const actor = await actorEmail();
    await addAdminEmail(body.email, actor);
    await notifyAction({
      kind: "admin.added",
      summary: `Admin added: ${body.email.toLowerCase()} (by ${actor})`,
      details: { email: body.email.toLowerCase(), actor },
    }).catch(() => {});
    const data = await listAllAdminEmails();
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}

// DELETE /api/admin/admins?email=foo@bar.com — remove an additional admin
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) {
    return Response.json({ error: "email query param required" }, { status: 400 });
  }
  try {
    const actor = await actorEmail();
    await removeAdminEmail(email, actor);
    await notifyAction({
      kind: "admin.removed",
      summary: `Admin removed: ${email.toLowerCase()} (by ${actor})`,
      details: { email: email.toLowerCase(), actor },
    }).catch(() => {});
    const data = await listAllAdminEmails();
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}
