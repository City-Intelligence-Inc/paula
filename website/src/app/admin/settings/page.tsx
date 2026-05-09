import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CreditCard, ChevronRight } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your admin preferences
        </p>
      </div>

      <Link
        href="/admin/settings/stripe"
        className="block transition-shadow hover:shadow-sm"
      >
        <Card className="border border-neutral-200 rounded-lg bg-white hover:border-mathitude-purple/40">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-mathitude-purple/5 p-2.5">
              <CreditCard className="h-5 w-5 text-mathitude-purple" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900">Stripe</p>
              <p className="text-sm text-neutral-500">
                Add or rotate API keys, configure the webhook signing secret.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          </CardContent>
        </Card>
      </Link>

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
            Additional admin settings will appear here as the platform grows.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
