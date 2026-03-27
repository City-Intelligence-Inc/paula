// ── User & Auth ──────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'PARENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  familyId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ── Students ─────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  familyId: string;
  familyName?: string;
  notes?: string;
  nextSession?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Families ─────────────────────────────────────────────────────────────────

export interface Family {
  id: string;
  name: string;
  parents: Parent[];
  students: Student[];
  activePackage?: Package;
  createdAt: string;
  updatedAt: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Session {
  id: string;
  studentId: string;
  studentName?: string;
  tutorName?: string;
  date: string;
  duration: number; // minutes
  status: SessionStatus;
  subject?: string;
  internalNote?: string;
  clientNote?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Billing / Packages ───────────────────────────────────────────────────────

export type PackageStatus = 'active' | 'inactive';

export interface Package {
  id: string;
  familyId: string;
  familyName?: string;
  name: string;
  totalSessions: number;
  usedSessions: number;
  pricePerSession: number;
  status: PackageStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  familyId: string;
  familyName?: string;
  amount: number;
  date: string;
  description: string;
  status: 'paid' | 'pending' | 'failed';
  createdAt: string;
}

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalStudents: number;
  sessionsToday: number;
  sessionsThisWeek: number;
  monthlyRevenue: number;
}

// ── Portal (Parent) ──────────────────────────────────────────────────────────

export interface PortalDashboard {
  upcomingSessions: Session[];
  recentSessions: Session[];
  packages: Package[];
  nextBillingDate?: string;
}
