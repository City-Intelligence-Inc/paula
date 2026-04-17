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
  createdAt: string;
  updatedAt: string;
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
  content?: string; // for session notes
  students?: string[]; // for group sessions, list of student IDs
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

export interface Parent {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  stripeCustomerId?: string;
  clerkUserId?: string;
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
