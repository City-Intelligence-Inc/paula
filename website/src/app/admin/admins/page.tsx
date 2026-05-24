"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Trash2, UserPlus, AlertCircle } from "lucide-react";

interface AdminListData {
  bootstrap: string[];
  additional: string[];
  all: string[];
}

export default function AdminAdminsPage() {
  const fetchApi = useApi();
  const [data, setData] = useState<AdminListData | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi("/api/admin/admins");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add() {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetchApi("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
      setSuccess(`Added ${email.trim().toLowerCase()} as admin.`);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(target: string) {
    if (!confirm(`Remove ${target} from admin?`)) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetchApi(
        `/api/admin/admins?email=${encodeURIComponent(target)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
      setSuccess(`Removed ${target}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Admins
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Anyone in this list can sign in and access the staff portal. Bootstrap
          admins are protected — they can&apos;t be removed from the UI.
        </p>
      </div>

      <Card className="border border-neutral-200 rounded-lg">
        <CardContent className="py-4 space-y-3">
          <h2 className="font-medium text-neutral-900">Add an admin</h2>
          <p className="text-sm text-neutral-500">
            The user must sign in with this exact email address to access the
            portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mathitude-purple/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
            />
            <Button
              onClick={add}
              disabled={busy || !email.trim()}
              className="bg-[#7030A0] hover:bg-[#5d288a] text-white uppercase tracking-wide"
            >
              <UserPlus className="h-4 w-4" />
              Add admin
            </Button>
          </div>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Card className="border border-neutral-200 rounded-lg">
          <CardContent className="py-6 text-sm text-neutral-500">
            Loading admins…
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data?.bootstrap.map((em) => (
            <Card
              key={em}
              className="py-0 border border-neutral-200 rounded-lg"
            >
              <CardContent className="flex items-center gap-3 py-3">
                <ShieldCheck className="h-4 w-4 text-mathitude-purple shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {em}
                  </p>
                  <p className="text-xs text-neutral-500">Bootstrap admin</p>
                </div>
                <Badge className="bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20">
                  Protected
                </Badge>
              </CardContent>
            </Card>
          ))}
          {data?.additional.map((em) => (
            <Card
              key={em}
              className="py-0 border border-neutral-200 rounded-lg"
            >
              <CardContent className="flex items-center gap-3 py-3">
                <ShieldCheck className="h-4 w-4 text-neutral-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {em}
                  </p>
                  <p className="text-xs text-neutral-500">Added via portal</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => remove(em)}
                  disabled={busy}
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
          {data && data.additional.length === 0 && (
            <p className="text-sm text-neutral-500">
              No additional admins yet. Add one above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
