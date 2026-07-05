import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { CardGate } from "@/components/dashboard/card-gate";
import { isAdminEmail } from "@/lib/server/admins";
import { familyCardStatus, findTutorByEmail } from "@/lib/server/access";

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
    const [isTutor, cardStatus] = await Promise.all([
      findTutorByEmail(userId, email),
      // Matches any linked email (R-2), not just the primary.
      familyCardStatus(userId, email),
    ]);

    if (!isTutor && !cardStatus.isFamilyMember) {
      redirect("/onboarding");
    }

    // B-5/C-1 "Contract & Credit Card Gate", enforced server-side: a family
    // with an unaccepted contract or no card on file gets the gate screens
    // instead of the portal. Covers the tokenized-invite path too (which has
    // no card step of its own).
    if (
      !isTutor &&
      cardStatus.isFamilyMember &&
      (!cardStatus.hasCard || cardStatus.needsContract)
    ) {
      return (
        <DashboardShell isAdmin={false}>
          <CardGate
            parentId={cardStatus.parentId ?? undefined}
            needsContract={cardStatus.needsContract}
            needsCard={!cardStatus.hasCard}
          />
        </DashboardShell>
      );
    }
  }

  return <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>;
}
