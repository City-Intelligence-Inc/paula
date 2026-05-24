import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  CreditCard,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Bell,
  Upload,
  FileText,
} from "lucide-react";

const SETTINGS_CARDS: {
  href: string;
  icon: typeof CreditCard;
  title: string;
  description: string;
}[] = [
  {
    href: "/admin/financials",
    icon: DollarSign,
    title: "Financials",
    description:
      "Revenue, pending invoices, overdue accounts, and unbilled session totals.",
  },
  {
    href: "/admin/admins",
    icon: ShieldCheck,
    title: "Admins",
    description:
      "Add or remove people who can access the staff portal. Bootstrap admins are protected.",
  },
  {
    href: "/admin/settings/stripe",
    icon: CreditCard,
    title: "Stripe",
    description:
      "Add or rotate API keys, configure the webhook signing secret.",
  },
  {
    href: "/admin/notifications",
    icon: Bell,
    title: "Notifications",
    description:
      "Recent card updates, billing changes, and admin activity log.",
  },
  {
    href: "/admin/import",
    icon: Upload,
    title: "Data import",
    description:
      "Bulk-import students, families, and sessions from spreadsheets.",
  },
  {
    href: "/admin/pages",
    icon: FileText,
    title: "Page content",
    description: "Edit content on the public marketing pages.",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Master controls for the Mathitude portal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SETTINGS_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block transition-shadow hover:shadow-sm"
          >
            <Card className="border border-neutral-200 rounded-lg bg-white hover:border-mathitude-purple/40 h-full">
              <CardContent className="flex items-start gap-4 py-4">
                <div className="rounded-lg bg-mathitude-purple/5 p-2.5 shrink-0">
                  <card.icon className="h-5 w-5 text-mathitude-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900">{card.title}</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    {card.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0 mt-1" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border border-neutral-200 rounded-lg bg-white">
        <CardHeader>
          <CardTitle className="text-neutral-900">Account</CardTitle>
          <CardDescription>
            Your account is managed through Clerk. Use the profile button in
            the sidebar to update your details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">
            Need a tutor or parent role assigned? Use{" "}
            <Link href="/admin/admins" className="text-mathitude-purple underline">
              Admins
            </Link>{" "}
            to grant portal access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
