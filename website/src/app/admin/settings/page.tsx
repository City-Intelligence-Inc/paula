import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mathitude-navy">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your admin preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-mathitude-navy">Account</CardTitle>
          <CardDescription>
            Your account is managed through Clerk. Use the profile button in the
            sidebar to update your details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Additional admin settings will be available here as the platform
            grows.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
