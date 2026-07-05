import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import { listAllAdmins } from "@/lib/server/admins";
import { listInvites, inviteIsActive } from "@/lib/server/invites";
import type { Parent, Student, Tutor } from "@/lib/types";

// GET /api/admin/users (FEATURE_LIST R-8) — every user the system knows,
// categorized by role, plus pending invitations. Read-only aggregate; the
// /admin/users page performs offboarding through the per-entity endpoints
// (tutors PUT/DELETE, parents DELETE, students PUT, admins DELETE).

export async function GET() {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Admin access required.");

  const c = ddb();
  const [admins, tutorsR, parentsR, studentsR, invites] = await Promise.all([
    listAllAdmins(),
    c.send(new ScanCommand({ TableName: Tables.tutors })),
    c.send(new ScanCommand({ TableName: Tables.parents })),
    c.send(new ScanCommand({ TableName: Tables.students })),
    listInvites(),
  ]);

  const tutors = ((tutorsR.Items as Tutor[]) || []).map((t) => ({
    id: t.id,
    name: `${t.firstName || ""} ${t.lastName || ""}`.trim(),
    email: t.email || "",
    active: t.active !== false,
    hasAccount: !!t.clerkUserId,
    studentCount: (t.assignedStudentIds || []).length,
  }));

  const students = ((studentsR.Items as Student[]) || []).map((s) => ({
    id: s.id,
    name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
    grade: s.grade || "",
    status: s.status || "active",
    email: s.studentEmail || "",
    familyId: s.familyId || "",
  }));

  const parents = ((parentsR.Items as Parent[]) || []).map((p) => ({
    id: p.id,
    name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
    email: p.email || "",
    familyId: p.familyId || "",
    relationship: p.relationship || "parent",
    hasAccount: !!p.clerkUserId,
  }));

  const now = new Date();
  return Response.json({
    viewerIsMaster: actor!.isMaster,
    admins: admins.all,
    tutors: tutors.sort((a, b) => a.name.localeCompare(b.name)),
    parents: parents.sort((a, b) => a.name.localeCompare(b.name)),
    students: students.sort((a, b) => a.name.localeCompare(b.name)),
    invites: invites.map((i) => ({
      token: i.token,
      email: i.email,
      role: i.role,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
      status: i.usedAt
        ? "used"
        : i.revokedAt
          ? "revoked"
          : inviteIsActive(i, now)
            ? "pending"
            : "expired",
      invitedBy: i.invitedBy,
    })),
  });
}
