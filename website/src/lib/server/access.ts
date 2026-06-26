// Shared actor resolution + authorization helpers.
//
// RBAC history (see ddb.ts): admin status is decided by the env-backed admin
// list (BOOTSTRAP_ADMIN_EMAILS + the DDB-managed list), NOT by the
// user-roles table — that table still has a "no row → admin" legacy fallback
// which we must NOT lean on for tutor restriction. So we resolve the actor
// here from the reliable sources:
//   master_admin / admin  → admins.ts (isMasterAdminEmail / isAdminEmail)
//   tutor                 → a matching row in the tutors table
//   parent                → signed-in but neither of the above
//
// Endpoints call resolveActor() then authorize with the small helpers below.
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { currentUser } from "@clerk/nextjs/server";
import { ddb, Tables, requireUser, currentUserEmail } from "./ddb";
import { isAdminEmail, isMasterAdminEmail } from "./admins";
import type { Student, Tutor, Session, TutorScope } from "@/lib/types";

export type ActorRole = "master_admin" | "admin" | "tutor" | "parent";

export interface Actor {
  userId: string;
  email: string;
  role: ActorRole;
  isAdmin: boolean; // master_admin || admin
  isMaster: boolean;
  tutor: Tutor | null;
}

export interface ResolvedActor {
  actor: Actor | null;
  response: Response | null;
}

export async function resolveActor(): Promise<ResolvedActor> {
  const base = await requireUser();
  if (base.response) return { actor: null, response: base.response };
  const userId = base.userId!;
  const email = await currentUserEmail();

  if (email && (await isMasterAdminEmail(email))) {
    return {
      actor: { userId, email, role: "master_admin", isAdmin: true, isMaster: true, tutor: null },
      response: null,
    };
  }
  if (email && (await isAdminEmail(email))) {
    return {
      actor: { userId, email, role: "admin", isAdmin: true, isMaster: false, tutor: null },
      response: null,
    };
  }

  const tutor = await findTutor(userId, email);
  if (tutor) {
    return {
      actor: { userId, email, role: "tutor", isAdmin: false, isMaster: false, tutor },
      response: null,
    };
  }

  return {
    actor: { userId, email, role: "parent", isAdmin: false, isMaster: false, tutor: null },
    response: null,
  };
}

async function findTutor(userId: string, email: string): Promise<Tutor | null> {
  try {
    const cu = await currentUser().catch(() => null);
    const emails = new Set<string>();
    if (email) emails.add(email);
    for (const e of cu?.emailAddresses || []) {
      if (e.emailAddress) emails.add(e.emailAddress.toLowerCase());
    }
    const r = await ddb().send(new ScanCommand({ TableName: Tables.tutors }));
    const tutors = (r.Items as Tutor[]) || [];
    return (
      tutors.find((t) => t.clerkUserId === userId) ||
      tutors.find((t) => t.email && emails.has(t.email.toLowerCase())) ||
      null
    );
  } catch (err) {
    console.warn("[findTutor] failed:", err);
    return null;
  }
}

export const forbidden = (msg = "Forbidden") =>
  Response.json({ error: msg }, { status: 403 });

// What scope does this tutor have on this student?
//   "none"    — not assigned to the student (no access)
//   "full"    — private tutor: sees everything
//   "limited" — class/group instructor: group sessions + own notes only
export function tutorScopeForStudent(
  student: Pick<Student, "tutorIds" | "tutorAccess">,
  tutorId: string,
): "none" | TutorScope {
  if (!(student.tutorIds || []).includes(tutorId)) return "none";
  const entry = (student.tutorAccess || []).find((a) => a.tutorId === tutorId);
  return entry?.scope === "limited" ? "limited" : "full";
}

// Pricing/billing fields a tutor must never see (5/17 Paula — pricing blind
// to tutors). Master admin + admin keep them.
export function stripPricingFromStudent<T extends Record<string, unknown>>(
  student: T,
): T {
  const { rate: _r, stripeCustomerId: _s, primaryPayerParentId: _p, ...rest } =
    student as Record<string, unknown>;
  void _r;
  void _s;
  void _p;
  return rest as T;
}

export function stripPricingFromSession<T extends Record<string, unknown>>(
  session: T,
): T {
  const { rate: _r, amountCents: _a, payers: _p, ...rest } =
    session as Record<string, unknown>;
  void _r;
  void _a;
  void _p;
  return rest as T;
}

// Filter a student's sessions/notes down to what a "limited" class instructor
// is allowed to see: group sessions only, plus notes they authored themselves.
export function filterSessionsForLimitedTutor(
  sessions: Session[],
  tutorUserId: string,
): Session[] {
  return sessions.filter((s) => {
    if (s.type === "note") {
      return (s as Session & { createdBy?: string }).createdBy === tutorUserId;
    }
    return s.type === "group";
  });
}

// Session-note field visibility (FEATURE_LIST N-8/N-9). Staff (admin +
// tutors) see all four columns; parents and students receive ONLY the two
// shared, family-facing fields. This strips the staff-only fields server-side
// so they never cross the wire to a family member — never rely on the client
// to hide them.
export function stripStaffOnlyNoteFields<T extends object>(note: T): T {
  const { sessionPlan: _sp, privateNotes: _pn, ...rest } = note as Record<
    string,
    unknown
  >;
  void _sp;
  void _pn;
  return rest as T;
}

// Apply note visibility for a resolved actor: staff get the full note,
// parents/students get the family-facing subset.
export function noteForActor<T extends object>(
  actor: Pick<Actor, "isAdmin" | "role">,
  note: T,
): T {
  if (actor.isAdmin || actor.role === "tutor") return note;
  return stripStaffOnlyNoteFields(note);
}
