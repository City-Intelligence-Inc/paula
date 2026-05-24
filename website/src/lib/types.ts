export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  status: "active" | "waitlist" | "inactive";
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  sessionType: "individual" | "group";
  rate: number;
  notes?: string;
  stripeCustomerId?: string;
  familyId?: string;
  tutorIds?: string[];
  primaryPayerParentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type SessionOffering =
  | "tutoring"
  | "group-parent-ed"
  | "stem-fair"
  | "family-advising"
  | "speaking";

export interface SessionPayerSplit {
  // Family OR parent OR free-form counterparty name (for non-family payers
  // like a school paying for a STEM-fair appearance).
  familyId?: string;
  parentId?: string;
  counterpartyName?: string;
  pct: number; // 0–100
}

export interface Session {
  studentId: string;
  dateTime: string; // ISO string, sort key
  date: string; // YYYY-MM-DD for GSI
  time: string; // HH:MM for GSI
  duration: number; // minutes
  type: "individual" | "group" | "note";
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  privateNotes?: string;
  content?: string; // for session notes
  students?: string[]; // for group sessions, list of student IDs
  // Post-session form extensions (5/17 spec):
  offering?: SessionOffering;
  tutorId?: string;
  // Session lead — the tutor who actually delivered this session, when it
  // differs from the student's assigned tutor (substitute, paired tutor,
  // Paula stepping in). Rate is then resolved against this person for
  // tutor-specific pricing per the 5/17 spec.
  sessionLeadId?: string;
  rate?: number; // dollars (legacy) or cents (when amountCents is set)
  amountCents?: number; // canonical charge total
  payers?: SessionPayerSplit[]; // null/empty = single primary payer fallback
}

export interface Payment {
  studentId: string;
  createdAt: string;
  amount: number; // cents
  paymentStatus: "paid" | "pending" | "overdue" | "failed";
  description: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
}

export interface MathitudeEvent {
  id: string;
  date: string;
  title: string;
  time: string;
  location: string;
  description: string;
  type: "festival" | "workshop" | "announcement";
  featured: boolean;
}

export interface Resource {
  category: "books" | "videos" | "puzzles" | "tools";
  id: string;
  title: string;
  description: string;
  linkText?: string;
  href?: string;
  tags?: string[];
}

// ---------------------------------------------------------
// v3.0 entities — see infra/SCHEMA.md
// Additive. Existing Student/Session shapes above still work
// until the Week 4 import migrates them onto the new tables.
// ---------------------------------------------------------

export interface Family {
  id: string;
  primaryPayerId: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type GuardianRelationship =
  | "parent"
  | "stepparent"
  | "grandparent"
  | "aunt"
  | "uncle"
  | "nanny"
  | "guardian"
  | "other";

export interface Parent {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  stripeCustomerId?: string;
  clerkUserId?: string;
  // Relationship to the children in the family. Defaults to "parent" for
  // backwards-compatibility with rows that pre-date this field. "parent"
  // (and "stepparent") cannot be removed from the UI — only secondary
  // caregivers (nanny, aunt, uncle, grandparent, guardian, other) can be.
  relationship?: GuardianRelationship;
  createdAt: string;
  updatedAt: string;
}

export interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  clerkUserId?: string;
  assignedStudentIds: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SessionStatus =
  | "scheduled"
  | "completed"
  | "billed"
  | "paid"
  | "hold"
  | "failed"
  | "cancelled";

export type UserRole = "admin" | "tutor" | "parent";

export interface User {
  clerkUserId: string;
  role: UserRole;
  linkedEntityId?: string;
  createdAt: string;
}
