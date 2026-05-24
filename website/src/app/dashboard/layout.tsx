import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { isAdminEmail } from "@/lib/server/admins";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses?.find(
    (e) => e.id === user.primaryEmailAddressId,
  )?.emailAddress;
  const email = (primaryEmail || user?.emailAddresses?.[0]?.emailAddress || "")
    .toLowerCase();
  // Don't force-redirect admins anymore — Paula sometimes needs to see
  // exactly what a parent sees (debugging billing, copy-checking a session
  // page). Instead we pass `isAdmin` to the shell so the sidebar can show
  // a "Back to Admin Portal" cross-link. Admins still land on /admin from
  // the navbar Admin shortcut and from sign-in.
  const isAdmin = email ? await isAdminEmail(email) : false;

  return <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>;
}
