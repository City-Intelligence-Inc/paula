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
import { GetCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { currentUser } from "@clerk/nextjs/server";
import { ddb, Tables, requireUser, currentUserEmail } from "./ddb";
import { isAdminEmail, isMasterAdminEmail } from "./admins";
import {
  getStripe,
  isStripeConfigured,
  resolveDefaultPaymentMethod,
} from "./stripe";
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

export async function findTutorByEmail(userId: string, email: string): Promise<Tutor | null> {
  return findTutor(userId, email);
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

// Pure field-projection helpers live in field-projection.ts (dependency-free so
// they're unit-testable under node --test). Re-exported here so existing call
// sites can keep importing them from access.
export {
  stripPricingFromStudent,
  stripContactFromStudent,
  stripPricingFromSession,
} from "./field-projection";

// Every email on the signed-in Clerk account, lowercased (R-2: parents and
// students may have multiple email addresses linked to one user account).
// Always includes the passed-in email as a fallback when Clerk is unreachable.
export async function allUserEmails(email: string): Promise<Set<string>> {
  const emails = new Set<string>();
  const e = (email || "").trim().toLowerCase();
  if (e) emails.add(e);
  try {
    const cu = await currentUser().catch(() => null);
    for (const addr of cu?.emailAddresses || []) {
      if (addr.emailAddress) emails.add(addr.emailAddress.toLowerCase());
    }
  } catch {}
  return emails;
}

// Resolve the students a signed-in family member can see:
//   parentOf — children in the caregiver's family (parents table match by
//              clerkUserId or any linked email → familyId → students), plus
//              legacy students that carry a linked email as parentEmail.
//   self     — the student themself, when a linked email is a student's
//              own studentEmail (R-7: scoped to exactly their record).
export async function studentsForFamilyMember(
  userId: string,
  email: string,
): Promise<{ parentOf: Student[]; self: Student | null }> {
  try {
    const [emails, parentsRes, studentsRes] = await Promise.all([
      allUserEmails(email),
      ddb().send(new ScanCommand({ TableName: Tables.parents })),
      ddb().send(new ScanCommand({ TableName: Tables.students })),
    ]);
    const has = (v?: string) => !!v && emails.has(v.trim().toLowerCase());
    const parents = (parentsRes.Items || []) as {
      familyId?: string;
      email?: string;
      clerkUserId?: string;
    }[];
    const students = (studentsRes.Items || []) as Student[];

    const familyIds = new Set(
      parents
        .filter((p) => p.clerkUserId === userId || has(p.email))
        .map((p) => p.familyId)
        .filter(Boolean) as string[],
    );
    const parentOf = students.filter(
      (s) =>
        (s.familyId && familyIds.has(s.familyId)) || has(s.parentEmail),
    );
    const self = students.find((s) => has(s.studentEmail)) || null;
    return { parentOf, self };
  } catch (err) {
    console.warn("[studentsForFamilyMember] failed:", err);
    return { parentOf: [], self: null };
  }
}

// B-5/C-1 "subscription-style gate": does this family member's family have a
// card on file? The signal is `cardOnFile` (stamped by finalize-new-card when
// a card is actually saved — stripeCustomerId alone only means a save
// STARTED). Parents from before that marker existed get one live Stripe
// lookup; a found card stamps `cardOnFile` so the check never repeats
// (self-healing, no legacy lockout). Returns the matched parent id so the
// gate screen can save a card against the right record.
export async function familyCardStatus(
  userId: string,
  email: string,
): Promise<{
  hasCard: boolean;
  parentId: string | null;
  isFamilyMember: boolean;
  // C-1 contract gate: true when the family has a contract on file that no
  // parent has accepted yet. Families without a contract skip this step.
  needsContract: boolean;
}> {
  try {
    const [emails, parentsRes] = await Promise.all([
      allUserEmails(email),
      ddb().send(new ScanCommand({ TableName: Tables.parents })),
    ]);
    const has = (v?: string) => !!v && emails.has(v.trim().toLowerCase());
    const parents = (parentsRes.Items || []) as {
      id: string;
      familyId?: string;
      email?: string;
      clerkUserId?: string;
      stripeCustomerId?: string;
      cardOnFile?: boolean;
    }[];
    const mine = parents.filter((p) => p.clerkUserId === userId || has(p.email));
    const { parentOf, self } = await studentsForFamilyMember(userId, email);
    // Students (R-7) never manage cards or accept contracts — no gate.
    if (mine.length === 0 && !!self && parentOf.length === 0) {
      return { hasCard: true, parentId: null, isFamilyMember: true, needsContract: false };
    }
    if (mine.length === 0 && parentOf.length === 0) {
      return { hasCard: true, parentId: null, isFamilyMember: false, needsContract: false };
    }
    const familyIds = new Set(
      mine.map((p) => p.familyId).filter(Boolean) as string[],
    );
    const familyParents = parents.filter(
      (p) => (p.familyId && familyIds.has(p.familyId)) || mine.includes(p),
    );

    // C-1 contract gate: on file but not yet accepted by anyone in the family.
    let needsContract = false;
    const familyId =
      [...familyIds][0] || parentOf.find((s) => s.familyId)?.familyId;
    if (familyId) {
      const fr = await ddb().send(
        new GetCommand({ TableName: Tables.families, Key: { id: familyId } }),
      );
      const fam = fr.Item as
        | { contractUrl?: string; contractAcceptedAt?: string }
        | undefined;
      needsContract = !!fam?.contractUrl && !fam?.contractAcceptedAt;
    }

    if (familyParents.some((p) => p.cardOnFile === true)) {
      return { hasCard: true, parentId: mine[0]?.id ?? null, isFamilyMember: true, needsContract };
    }

    // Legacy rows: card saved before the cardOnFile marker existed. One live
    // Stripe lookup per parent, stamped on success so it never runs again.
    const candidates = familyParents.filter(
      (p) => p.stripeCustomerId && p.cardOnFile === undefined,
    );
    if (candidates.length > 0 && (await isStripeConfigured())) {
      const stripe = await getStripe();
      for (const p of candidates) {
        const pm = await resolveDefaultPaymentMethod(
          stripe,
          p.stripeCustomerId!,
        ).catch(() => null);
        if (pm) {
          ddb()
            .send(
              new UpdateCommand({
                TableName: Tables.parents,
                Key: { id: p.id },
                UpdateExpression: "SET cardOnFile = :t",
                ExpressionAttributeValues: { ":t": true },
              }),
            )
            .catch(() => {});
          return { hasCard: true, parentId: mine[0]?.id ?? null, isFamilyMember: true, needsContract };
        }
      }
    }

    // Legacy student-level Stripe customer (pre-family imports) — trust it.
    if (parentOf.some((s) => !!s.stripeCustomerId)) {
      return { hasCard: true, parentId: mine[0]?.id ?? null, isFamilyMember: true, needsContract };
    }

    return { hasCard: false, parentId: mine[0]?.id ?? null, isFamilyMember: true, needsContract };
  } catch (err) {
    // Fail open — an infra hiccup must not lock families out of the portal.
    console.warn("[familyCardStatus] failed:", err);
    return { hasCard: true, parentId: null, isFamilyMember: true, needsContract: false };
  }
}

// Gate check: is this email known to the system as a parent (either directly
// via the parents table, or as a student's parentEmail)?
export async function isKnownParentEmail(email: string): Promise<boolean> {
  const e = email.trim().toLowerCase();
  try {
    const [parentsRes, studentsRes] = await Promise.all([
      ddb().send(new ScanCommand({
        TableName: Tables.parents,
        ProjectionExpression: "email",
      })),
      ddb().send(new ScanCommand({
        TableName: Tables.students,
        ProjectionExpression: "parentEmail",
      })),
    ]);
    const inParents = (parentsRes.Items || []).some(
      (p) => typeof p.email === "string" && p.email.trim().toLowerCase() === e,
    );
    if (inParents) return true;
    return (studentsRes.Items || []).some(
      (s) => typeof s.parentEmail === "string" && s.parentEmail.trim().toLowerCase() === e,
    );
  } catch {
    return false;
  }
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
