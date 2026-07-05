"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Shield,
  Trash2,
  UserPlus,
  AlertCircle,
  Crown,
  Copy,
  Check,
} from "lucide-react";

type AdminRole = "master_admin" | "admin";

interface AdminEntry {
  email: string;
  role: AdminRole;
  addedAt?: string;
  addedBy?: string;
}

interface AdminListData {
  bootstrap: AdminEntry[];
  additional: AdminEntry[];
  all: AdminEntry[];
  viewerIsMaster: boolean;
  viewerEmail: string;
}

function roleLabel(r: AdminRole): string {
  return r === "master_admin" ? "Master admin" : "Admin";
}

export default function AdminAdminsPage() {
  const fetchApi = useApi();
  const [data, setData] = useState<AdminListData | null>(null);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("admin");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<
    { url: string; emailSent: boolean } | null
  >(null);
  const [copied, setCopied] = useState(false);

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

  const canManage = data?.viewerIsMaster === true;

  async function add() {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    setInviteInfo(null);
    setCopied(false);
    try {
      const res = await fetchApi("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
      const added = email.trim().toLowerCase();
      setSuccess(
        json.inviteEmailSent
          ? `Added ${added} as ${roleLabel(newRole)}. We emailed them a sign-up link.`
          : `Added ${added} as ${roleLabel(newRole)}.`,
      );
      if (json.inviteUrl) {
        setInviteInfo({ url: json.inviteUrl, emailSent: !!json.inviteEmailSent });
      }
      setEmail("");
      setNewRole("admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(target: string, role: AdminRole) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetchApi("/api/admin/admins", {
        method: "PUT",
        body: JSON.stringify({ email: target, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
      setSuccess(`${target} is now ${roleLabel(role)}.`);
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
          Two tiers: <strong>master admins</strong> manage the admin list +
          all settings. <strong>Admins</strong> get full operator access but
          cannot add or remove other admins.
        </p>
      </div>

      {!loading && data && !canManage && (
        <div className="rounded-md border-0 badge-info px-3 py-2 text-sm flex items-start gap-2 slide-down-in">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            You&apos;re signed in as <strong>{data.viewerEmail}</strong> (Admin).
            Viewing the admin list is fine; adding, removing, or changing
            roles requires a master admin. Ask Paula or another master admin
            if you need access changed.
          </span>
        </div>
      )}

      {canManage && (
        <Card className="border border-[color:var(--color-border-warm)] rounded-lg">
          <CardContent className="py-4 space-y-3">
            <h2 className="font-medium text-neutral-900 flex items-center gap-2">
              <Crown className="h-4 w-4 text-mathitude-purple" />
              Add an admin
            </h2>
            <p className="text-sm text-neutral-500">
              We&apos;ll email them a personal sign-up link. They must use this
              exact email to access the portal. Pick a tier:
            </p>
            <div className="flex flex-col gap-2">
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
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="admin">Admin</option>
                  <option value="master_admin">Master admin</option>
                </select>
                <Button
                  onClick={add}
                  disabled={busy || !email.trim()}
                  className="bg-[#7030A0] hover:bg-[#5d288a] text-white uppercase tracking-wide"
                >
                  <UserPlus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-neutral-500">
                <strong>Admin</strong> can do everything except manage other
                admins. <strong>Master admin</strong> can also add/remove/
                promote/demote admins. Default is Admin — promote later if
                you trust them with this surface.
              </p>
            </div>
            {error && (
              <div className="rounded-md border-0 badge-error px-3 py-2 text-sm flex items-start gap-2 slide-down-in">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border-0 badge-success px-3 py-2 text-sm slide-down-in">
                {success}
              </div>
            )}
            {inviteInfo && (
              <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm slide-down-in space-y-2">
                <p className="text-neutral-600 text-xs">
                  {inviteInfo.emailSent
                    ? "Sign-up link (in case the email doesn't arrive — it's single-use and expires in 7 days):"
                    : "The invite email couldn't be sent. Copy this single-use sign-up link and share it directly:"}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteInfo.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs font-mono text-neutral-700 focus:outline-none focus:ring-2 focus:ring-mathitude-purple/30"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(inviteInfo.url);
                      setCopied(true);
                    }}
                  >
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 skeleton" />
          ))}
        </div>
      ) : (
        <div className="space-y-2 admin-stagger">
          {data?.bootstrap.map((entry) => (
            <Card
              key={entry.email}
              className="py-0 border border-[color:var(--color-border-warm)] rounded-lg"
            >
              <CardContent className="flex items-center gap-3 py-3">
                <Crown className="h-4 w-4 text-mathitude-purple shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {entry.email}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Bootstrap master admin
                  </p>
                </div>
                <Badge className="bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20">
                  Master · Protected
                </Badge>
              </CardContent>
            </Card>
          ))}
          {data?.additional.map((entry) => {
            const isMaster = entry.role === "master_admin";
            return (
              <Card
                key={entry.email}
                className="py-0 border border-[color:var(--color-border-warm)] rounded-lg"
              >
                <CardContent className="flex items-center gap-3 py-3 flex-wrap">
                  {isMaster ? (
                    <Crown className="h-4 w-4 text-mathitude-purple shrink-0" />
                  ) : (
                    <Shield className="h-4 w-4 text-neutral-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {entry.email}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {isMaster ? "Master admin" : "Admin"}
                      {entry.addedBy ? ` · added by ${entry.addedBy}` : ""}
                    </p>
                  </div>
                  {canManage ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={entry.role}
                        onChange={(e) =>
                          changeRole(entry.email, e.target.value as AdminRole)
                        }
                        disabled={busy}
                        className="rounded-md border border-neutral-200 px-2 py-1 text-xs bg-white"
                        title="Change role"
                      >
                        <option value="admin">Admin</option>
                        <option value="master_admin">Master admin</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[color:var(--color-state-error)] hover:bg-[color:var(--color-state-error-soft)]"
                        onClick={() => remove(entry.email)}
                        disabled={busy}
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Badge
                      className={
                        isMaster
                          ? "bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20"
                          : "bg-neutral-100 text-neutral-700 border-neutral-200"
                      }
                    >
                      {isMaster ? "Master admin" : "Admin"}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {data && data.additional.length === 0 && (
            <p className="text-sm text-neutral-500">
              No additional admins yet.{" "}
              {canManage
                ? "Add one above."
                : "Only bootstrap master admins on file right now."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
