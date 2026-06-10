import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AdminShell } from "@/components/admin/shell";
import { currentUserEmail } from "@/lib/server/ddb";
import { isAdminEmail } from "@/lib/server/admins";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/admin");
  }

  // Admin-only. Non-admin signed-in users (parents, tutors) land on their
  // own dashboard rather than seeing the admin shell.
  const email = await currentUserEmail();
  const ok = email ? await isAdminEmail(email) : false;
  if (!ok) {
    redirect("/dashboard");
  }

  return <AdminShell>{children}</AdminShell>;
}
