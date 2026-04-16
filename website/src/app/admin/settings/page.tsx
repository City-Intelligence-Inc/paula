import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your admin preferences
        </p>
      </div>

      <Card className="border border-neutral-200 rounded-lg bg-white">
        <CardHeader>
          <CardTitle className="text-neutral-900">Account</CardTitle>
          <CardDescription>
            Your account is managed through Clerk. Use the profile button in the
            sidebar to update your details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">
            Additional admin settings will be available here as the platform
            grows.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
