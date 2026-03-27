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
  type: "individual" | "group";
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
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
