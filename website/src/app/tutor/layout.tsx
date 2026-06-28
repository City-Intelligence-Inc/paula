import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/server/admins";
import { findTutorByEmail } from "@/lib/server/access";
import { sendAdminNotification } from "@/lib/server/notify";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses?.find(
    (e) => e.id === user.primaryEmailAddressId,
  )?.emailAddress;
  const email = (primaryEmail || user?.emailAddresses?.[0]?.emailAddress || "")
    .toLowerCase();

  const isAdmin = email ? await isAdminEmail(email) : false;
  if (isAdmin) return <>{children}</>;

  if (email) {
    const tutor = await findTutorByEmail(userId, email);
    if (tutor) return <>{children}</>;

    sendAdminNotification({
      subject: "⚠️ Unauthorized login attempt (tutor portal)",
      html: `<p>Someone tried to access the Mathitude tutor portal but is not in the system.</p>
<p><strong>Email:</strong> ${email}</p>`,
      text: `Unauthorized tutor portal attempt.\n\nEmail: ${email}`,
    }).catch(() => {});
  }

  redirect("/unauthorized");
}
