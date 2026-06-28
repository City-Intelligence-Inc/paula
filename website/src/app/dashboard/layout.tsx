import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { isAdminEmail } from "@/lib/server/admins";
import { isKnownParentEmail, findTutorByEmail } from "@/lib/server/access";

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

  const isAdmin = email ? await isAdminEmail(email) : false;

  if (!isAdmin && email) {
    const [isTutor, isParent] = await Promise.all([
      findTutorByEmail(userId, email),
      isKnownParentEmail(email),
    ]);

    if (!isTutor && !isParent) {
      redirect("/onboarding");
    }
  }

  return <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>;
}
