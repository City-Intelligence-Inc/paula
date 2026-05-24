import { currentUser } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/server/ddb";
import {
  addAdminEmail,
  isMasterAdminEmail,
  listAllAdmins,
  removeAdminEmail,
  setAdminRole,
  type AdminRole,
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

// Master-admin gate. Admin-only endpoints already require sign-in via
// requireAdmin(); this further restricts admin-management mutations to
// master_admin so a plain admin can't escalate themselves or grant access
// to a friend.
async function requireMasterAdmin(): Promise<
  | { actor: string; response: null }
  | { actor: string; response: Response }
> {
  const auth = await requireAdmin();
  if (auth.response) return { actor: "unknown", response: auth.response };
  const actor = await actorEmail();
  const isMaster = await isMasterAdminEmail(actor);
  if (!isMaster) {
    return {
      actor,
      response: Response.json(
        {
          error:
            "Only master admins can manage the admin list. Ask Paula or another master admin to make this change.",
          code: "not_master_admin",
        },
        { status: 403 },
      ),
    };
  }
  return { actor, response: null };
}

// GET — every signed-in admin can view the list. Surfaces role on each
// entry + a viewerIsMaster flag so the UI can hide write actions for plain
// admins.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const actor = await actorEmail();
  const data = await listAllAdmins();
  const viewerIsMaster = await isMasterAdminEmail(actor);
  return Response.json({ ...data, viewerIsMaster, viewerEmail: actor });
}

// POST — master admin adds another admin (default role: admin).
// Body: { email, role?: "master_admin" | "admin" }
export async function POST(request: Request) {
  const gate = await requireMasterAdmin();
  if (gate.response) return gate.response;

  let body: { email?: string; role?: AdminRole };
  try {
    body = (await request.json()) as { email?: string; role?: AdminRole };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.email) {
    return Response.json({ error: "email required" }, { status: 400 });
  }
  const role: AdminRole = body.role === "master_admin" ? "master_admin" : "admin";
  try {
    await addAdminEmail(body.email, gate.actor, role);
    await notifyAction({
      kind: "admin.added",
      summary: `${role === "master_admin" ? "Master admin" : "Admin"} added: ${body.email.toLowerCase()} (by ${gate.actor})`,
      details: {
        email: body.email.toLowerCase(),
        role,
        actor: gate.actor,
      },
    }).catch(() => {});
    const data = await listAllAdmins();
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}

// PUT — master admin changes another admin's role.
// Body: { email, role: "master_admin" | "admin" }
export async function PUT(request: Request) {
  const gate = await requireMasterAdmin();
  if (gate.response) return gate.response;

  let body: { email?: string; role?: AdminRole };
  try {
    body = (await request.json()) as { email?: string; role?: AdminRole };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.email || !body.role) {
    return Response.json(
      { error: "email and role required" },
      { status: 400 },
    );
  }
  if (body.role !== "master_admin" && body.role !== "admin") {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }
  try {
    await setAdminRole(body.email, body.role, gate.actor);
    await notifyAction({
      kind: "admin.role_changed",
      summary: `${body.email.toLowerCase()} role set to ${body.role} (by ${gate.actor})`,
      details: {
        email: body.email.toLowerCase(),
        role: body.role,
        actor: gate.actor,
      },
    }).catch(() => {});
    const data = await listAllAdmins();
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}

// DELETE — master admin removes a non-bootstrap admin.
export async function DELETE(request: Request) {
  const gate = await requireMasterAdmin();
  if (gate.response) return gate.response;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) {
    return Response.json(
      { error: "email query param required" },
      { status: 400 },
    );
  }
  try {
    await removeAdminEmail(email, gate.actor);
    await notifyAction({
      kind: "admin.removed",
      summary: `Admin removed: ${email.toLowerCase()} (by ${gate.actor})`,
      details: { email: email.toLowerCase(), actor: gate.actor },
    }).catch(() => {});
    const data = await listAllAdmins();
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}
