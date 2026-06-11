import { resolveActor } from "@/lib/server/access";

// GET /api/me/is-admin → { isAdmin, isMaster, role, email }
// The navbar + shells use this to decide what to show for the signed-in user
// and which role accent/badge to render. Falls back to non-admin on error.
export async function GET() {
  try {
    const { actor, response } = await resolveActor();
    if (response || !actor) {
      return Response.json({ isAdmin: false, isMaster: false, role: "parent", email: null });
    }
    return Response.json({
      isAdmin: actor.isAdmin,
      isMaster: actor.isMaster,
      role: actor.role,
      email: actor.email || null,
    });
  } catch (err) {
    console.warn("[GET /api/me/is-admin] failed:", err);
    return Response.json({ isAdmin: false, isMaster: false, role: "parent", email: null });
  }
}
