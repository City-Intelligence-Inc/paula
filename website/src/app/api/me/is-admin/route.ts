import { currentUser } from "@clerk/nextjs/server";
import { isAdminEmail } from "@/lib/server/admins";

// GET /api/me/is-admin → { isAdmin, email }
// Lightweight endpoint the navbar uses to decide whether to show the "Admin"
// shortcut for the signed-in user. Falls back to false on any error.
export async function GET() {
  try {
    const u = await currentUser();
    if (!u) return Response.json({ isAdmin: false, email: null });
    const primary = u.emailAddresses?.find(
      (e) => e.id === u.primaryEmailAddressId,
    )?.emailAddress;
    const email = (primary || u.emailAddresses?.[0]?.emailAddress || "")
      .toLowerCase();
    if (!email) return Response.json({ isAdmin: false, email: null });
    const isAdmin = await isAdminEmail(email);
    return Response.json({ isAdmin, email });
  } catch (err) {
    console.warn("[GET /api/me/is-admin] failed:", err);
    return Response.json({ isAdmin: false, email: null });
  }
}
