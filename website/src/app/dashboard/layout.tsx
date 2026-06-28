import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { isAdminEmail } from "@/lib/server/admins";
import { isKnownParentEmail, findTutorByEmail } from "@/lib/server/access";
import { sendAdminNotification } from "@/lib/server/notify";

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
      // Fire-and-forget — don't block the redirect on email delivery
      sendAdminNotification({
        subject: "⚠️ Unauthorized login attempt",
        html: `<p>Someone signed into Mathitude who has not been added to the system.</p>
<p><strong>Email:</strong> ${email}</p>
<p>If this person should have access, add them as a parent or tutor in the admin portal first.</p>`,
        text: `Unauthorized login attempt.\n\nEmail: ${email}\n\nIf this person should have access, add them as a parent or tutor in the admin portal first.`,
      }).catch(() => {});

      redirect("/unauthorized");
    }
  }

  return <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>;
}
