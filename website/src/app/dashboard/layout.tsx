import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";

// Mirrors ADMIN_EMAILS in src/components/sections/navbar.tsx — admins land
// on /admin instead of the parent dashboard when they sign in.
const ADMIN_EMAILS = new Set(["phamilton@mathitude.com", "ari@coframe.com"]);

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
  if (ADMIN_EMAILS.has(email)) {
    redirect("/admin");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
