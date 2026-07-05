"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { UsersRound, MailPlus, ShieldCheck, UserCheck, Home, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { gradeShort } from "@/lib/grades";

// R-8: every user in the system, categorized by role, with email invitations
// (role set at invite time — C-1 tokenized links) and safe offboarding of
// inactive clients and former employees.

interface AdminRow {
  email: string;
  role: "master_admin" | "admin";
}
interface TutorRow {
  id: string;
  name: string;
  email: string;
  active: boolean;
  hasAccount: boolean;
  studentCount: number;
}
interface ParentRow {
  id: string;
  name: string;
  email: string;
  familyId: string;
  relationship: string;
  hasAccount: boolean;
}
interface StudentRow {
  id: string;
  name: string;
  grade: string;
  status: string;
  email: string;
  familyId: string;
}
interface InviteRow {
  token: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "used" | "expired" | "revoked";
  invitedBy: string;
}

interface UsersResponse {
  viewerIsMaster: boolean;
  admins: AdminRow[];
  tutors: TutorRow[];
  parents: ParentRow[];
  students: StudentRow[];
  invites: InviteRow[];
}

const ROLE_LABELS: Record<string, string> = {
  parent: "Parent",
  tutor: "Tutor",
  student: "Student",
  office: "Office staff",
};

function SectionHeader({
  icon: Icon,
  title,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200">
      <Icon className="h-4 w-4 text-mathitude-purple" />
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      <span className="text-xs text-neutral-400">{count}</span>
    </div>
  );
}

export default function AdminUsersPage() {
  const fetchApi = useApi();
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("parent");
  const [invFirst, setInvFirst] = useState("");
  const [invLast, setInvLast] = useState("");
  const [invStudentId, setInvStudentId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchApi("/api/admin/users")
      .then((r) => r.json())
      .then((j) => {
        setData(j);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchApi]);
  useEffect(load, [load]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetchApi("/api/admin/invites", {
        method: "POST",
        body: JSON.stringify({
          email: invEmail,
          role: invRole,
          firstName: invFirst,
          lastName: invLast,
          studentId: invRole === "student" ? invStudentId : undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setInviteMsg(j.error || "Invite failed");
      } else if (j.emailError) {
        setInviteMsg(`Invite created, but the email failed to send (${j.emailError}). Copy the link from the pending list below.`);
      } else {
        setInviteMsg(`Invitation sent to ${invEmail}.`);
        setInvEmail("");
        setInvFirst("");
        setInvLast("");
      }
      load();
    } catch {
      setInviteMsg("Invite failed");
    } finally {
      setInviting(false);
    }
  };

  const revoke = async (token: string) => {
    if (!window.confirm("Revoke this invitation? The link will stop working.")) return;
    await fetchApi(`/api/admin/invites?token=${encodeURIComponent(token)}`, {
      method: "DELETE",
    });
    load();
  };

  const offboardTutor = async (t: TutorRow) => {
    if (!window.confirm(`Deactivate tutor ${t.name}? They lose portal access but their session history stays.`)) return;
    await fetchApi(`/api/admin/tutors/${t.id}`, {
      method: "PUT",
      body: JSON.stringify({ active: false }),
    });
    load();
  };

  const reactivateTutor = async (t: TutorRow) => {
    await fetchApi(`/api/admin/tutors/${t.id}`, {
      method: "PUT",
      body: JSON.stringify({ active: true }),
    });
    load();
  };

  const offboardStudent = async (s: StudentRow) => {
    if (!window.confirm(`Mark ${s.name} inactive? Their history is kept; they drop out of active rosters and billing.`)) return;
    await fetchApi(`/api/students/${s.id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "inactive" }),
    });
    load();
  };

  const removeAdmin = async (a: AdminRow) => {
    if (!window.confirm(`Remove ${a.email} from staff access?`)) return;
    await fetchApi(`/api/admin/admins?email=${encodeURIComponent(a.email)}`, {
      method: "DELETE",
    });
    load();
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
      </div>
    );
  }

  const pendingInvites = data.invites.filter((i) => i.status === "pending");
  const activeStudents = data.students.filter((s) => s.status !== "inactive");
  const inactiveStudents = data.students.filter((s) => s.status === "inactive");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
          <UsersRound className="h-6 w-6 text-mathitude-purple" />
          Users
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Everyone with access, by role. Invite new users by email — their role
          is set when the invitation is created.
        </p>
      </div>

      {/* Invite by email (R-8 / C-1) */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MailPlus className="h-4 w-4 text-mathitude-purple" />
          <h2 className="text-sm font-semibold text-neutral-900">
            Invite a new user
          </h2>
        </div>
        <form onSubmit={sendInvite} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-neutral-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={invEmail}
              onChange={(e) => setInvEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              placeholder="parent@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Role</label>
            <select
              value={invRole}
              onChange={(e) => setInvRole(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="parent">Parent</option>
              <option value="tutor">Tutor</option>
              <option value="office">Office staff</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">First name</label>
            <input
              value={invFirst}
              onChange={(e) => setInvFirst(e.target.value)}
              className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Last name</label>
            <input
              value={invLast}
              onChange={(e) => setInvLast(e.target.value)}
              className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          {invRole === "student" && (
            <div>
              <label className="block text-xs text-neutral-500 mb-1">
                Link to student
              </label>
              <select
                value={invStudentId}
                onChange={(e) => setInvStudentId(e.target.value)}
                required
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm max-w-52"
              >
                <option value="">Choose student…</option>
                {activeStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({gradeShort(s.grade)})
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button type="submit" disabled={inviting}>
            {inviting ? "Sending…" : "Send invitation"}
          </Button>
        </form>
        {inviteMsg && (
          <p className="text-xs text-neutral-500 mt-2">{inviteMsg}</p>
        )}
        <p className="text-xs text-neutral-400 mt-2">
          Links are single-use and expire after 7 days. The invitee&apos;s email
          is locked to the address you enter here.
        </p>
      </Card>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <Card className="overflow-hidden py-0">
          <SectionHeader icon={MailPlus} title="Pending invitations" count={pendingInvites.length} />
          <div className="divide-y divide-neutral-100">
            {pendingInvites.map((i) => (
              <div key={i.token} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-sm text-neutral-900 flex-1 truncate">
                  {i.email}
                </span>
                <Badge className="bg-neutral-100 text-neutral-600 border-neutral-200">
                  {ROLE_LABELS[i.role] || i.role}
                </Badge>
                <span className="text-xs text-neutral-400">
                  expires {new Date(i.expiresAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register?token=${i.token}`)}
                  className="text-xs font-medium text-mathitude-purple hover:underline"
                >
                  Copy link
                </button>
                <button
                  onClick={() => revoke(i.token)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Admins / office staff */}
      <Card className="overflow-hidden py-0">
        <SectionHeader icon={ShieldCheck} title="Admins & office staff" count={data.admins.length} />
        <div className="divide-y divide-neutral-100">
          {data.admins.map((a) => (
            <div key={a.email} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-sm text-neutral-900 flex-1 truncate">{a.email}</span>
              <Badge
                className={
                  a.role === "master_admin"
                    ? "bg-mathitude-purple/10 text-mathitude-purple border-transparent"
                    : "bg-neutral-100 text-neutral-600 border-neutral-200"
                }
              >
                {a.role === "master_admin" ? "Super admin" : "Office staff"}
              </Badge>
              {data.viewerIsMaster && a.role !== "master_admin" && (
                <button
                  onClick={() => removeAdmin(a)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="px-4 py-2.5 text-xs text-neutral-400 border-t border-neutral-100">
          Roles are managed in detail under{" "}
          <Link href="/admin/admins" className="text-mathitude-purple hover:underline">
            Admins
          </Link>
          .
        </p>
      </Card>

      {/* Tutors */}
      <Card className="overflow-hidden py-0">
        <SectionHeader icon={UserCheck} title="Tutors" count={data.tutors.length} />
        <div className="divide-y divide-neutral-100">
          {data.tutors.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-neutral-900">{t.name}</span>
                <span className="text-xs text-neutral-400 ml-2">{t.email}</span>
              </div>
              <span className="text-xs text-neutral-400">
                {t.studentCount} student{t.studentCount === 1 ? "" : "s"}
              </span>
              {!t.active && (
                <Badge className="bg-neutral-100 text-neutral-500 border-neutral-200">
                  Deactivated
                </Badge>
              )}
              {t.active ? (
                <button
                  onClick={() => offboardTutor(t)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => reactivateTutor(t)}
                  className="text-xs font-medium text-mathitude-purple hover:underline"
                >
                  Reactivate
                </button>
              )}
            </div>
          ))}
          {data.tutors.length === 0 && (
            <p className="px-4 py-4 text-sm text-neutral-400">No tutors yet.</p>
          )}
        </div>
      </Card>

      {/* Parents */}
      <Card className="overflow-hidden py-0">
        <SectionHeader icon={Home} title="Parents & caregivers" count={data.parents.length} />
        <div className="divide-y divide-neutral-100">
          {data.parents.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-neutral-900">{p.name}</span>
                <span className="text-xs text-neutral-400 ml-2">{p.email}</span>
              </div>
              <Badge className="bg-neutral-100 text-neutral-600 border-neutral-200">
                {p.relationship}
              </Badge>
              {!p.hasAccount && (
                <span className="text-xs text-neutral-400">no login yet</span>
              )}
              <Link
                href={`/admin/families/${p.familyId}`}
                className="text-xs font-medium text-mathitude-purple hover:underline"
              >
                Family
              </Link>
            </div>
          ))}
          {data.parents.length === 0 && (
            <p className="px-4 py-4 text-sm text-neutral-400">No parents yet.</p>
          )}
        </div>
        <p className="px-4 py-2.5 text-xs text-neutral-400 border-t border-neutral-100">
          Caregivers are removed from their family page (primary payers must be
          reassigned first).
        </p>
      </Card>

      {/* Students */}
      <Card className="overflow-hidden py-0">
        <SectionHeader icon={GraduationCap} title="Students" count={data.students.length} />
        <div className="divide-y divide-neutral-100">
          {[...activeStudents, ...inactiveStudents].map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/students/${s.id}`}
                  className="text-sm text-neutral-900 hover:underline"
                >
                  {s.name}
                </Link>
                <span className="text-xs text-neutral-400 ml-2">
                  {gradeShort(s.grade)}
                  {s.email ? ` · ${s.email}` : ""}
                </span>
              </div>
              {s.status === "inactive" ? (
                <Badge className="bg-neutral-100 text-neutral-500 border-neutral-200">
                  Inactive
                </Badge>
              ) : (
                <button
                  onClick={() => offboardStudent(s)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Mark inactive
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
