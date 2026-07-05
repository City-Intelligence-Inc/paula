"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { BookOpen, Calendar, FolderOpen, Newspaper, CreditCard, ArrowRight, ShieldCheck, NotebookPen } from "lucide-react";
import { useApi } from "@/hooks/use-api";

interface FamilyOverview {
  students: {
    id: string;
    firstName: string;
    lastName: string;
    grade?: string;
    sharedFiles?: { id: string; name: string; url: string }[];
  }[];
  notes: { studentId: string; dateTime: string }[];
  upcomingSessions: {
    studentId: string;
    studentName: string;
    dateTime: string;
    duration: number;
    type: string;
  }[];
}

function formatSessionTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const steps = [
  {
    title: "Browse Course Materials",
    description: "Find enrichment worksheets, videos, and activities organized by your student's grade level.",
    href: "/dashboard/courses",
    icon: BookOpen,
    cta: "Browse by grade",
  },
  {
    title: "Schedule a Meet & Greet",
    description: "Book a free 30-minute introductory session with Mathitude to discuss your student's needs.",
    href: "/dashboard/schedule",
    icon: Calendar,
    cta: "Pick a time",
  },
  {
    title: "Save Your Payment Method",
    description: "Securely save your card so Mathitude can charge for sessions without needing to ask each time.",
    href: "/dashboard/billing",
    icon: CreditCard,
    cta: "Add a card",
  },
  {
    title: "Explore Resources",
    description: "Mathitude's published books, YouTube tutorials, downloadable puzzles, and curated math tools.",
    href: "/dashboard/resources",
    icon: FolderOpen,
    cta: "See resources",
  },
  {
    title: "Upcoming Events",
    description: "Math festivals, workshops, and Mathitude announcements you won't want to miss.",
    href: "/dashboard/events",
    icon: Newspaper,
    cta: "View events",
  },
];

export default function DashboardPage() {
  const { user } = useUser();
  const fetchApi = useApi();
  const firstName = user?.firstName || "there";
  const [overview, setOverview] = useState<FamilyOverview | null>(null);
  // #9: let parents dismiss the setup checklist (the staff/admin tour already
  // has a skip). Persisted so it stays hidden across visits; reversible.
  const CHECKLIST_HIDDEN_KEY = "mathitude_dashboard_checklist_hidden";
  const [checklistHidden, setChecklistHidden] = useState(false);
  useEffect(() => {
    try {
      setChecklistHidden(localStorage.getItem(CHECKLIST_HIDDEN_KEY) === "1");
    } catch {}
  }, []);
  function setChecklistVisibility(hidden: boolean) {
    setChecklistHidden(hidden);
    try {
      if (hidden) localStorage.setItem(CHECKLIST_HIDDEN_KEY, "1");
      else localStorage.removeItem(CHECKLIST_HIDDEN_KEY);
    } catch {}
  }

  // Live family data (D-3) — children, next sessions, latest notes. Only
  // renders when the signed-in user maps to a family; staff and unlinked
  // accounts just see the checklist.
  useEffect(() => {
    fetchApi("/api/me/notes")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: FamilyOverview | null) => {
        if (j && Array.isArray(j.students) && j.students.length > 0) {
          setOverview(j);
        }
      })
      .catch(() => {});
  }, [fetchApi]);

  return (
    <div className="page-enter">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight" style={{ fontFamily: "var(--font-original-surfer)" }}>
          Welcome back, {firstName}.
        </h1>
        <p className="mt-3 text-neutral-500 max-w-xl">
          Your Mathitude home base. Here&apos;s how to get started:
        </p>
      </div>

      {overview && (
        <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-lg border border-neutral-200 bg-white">
            <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
              <Calendar className="w-3 h-3" />
              Upcoming sessions
            </div>
            {overview.upcomingSessions.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">
                Nothing on the calendar yet.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {overview.upcomingSessions.map((s) => (
                  <li
                    key={`${s.studentId}#${s.dateTime}`}
                    className="flex items-baseline gap-2 text-sm"
                  >
                    <span className="font-medium text-neutral-900">
                      {s.studentName}
                    </span>
                    <span className="text-neutral-500">
                      {formatSessionTime(s.dateTime)} · {s.duration} min
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-5 rounded-lg border border-neutral-200 bg-white">
            <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
              <NotebookPen className="w-3 h-3" />
              Session notes
            </div>
            <ul className="mt-2 space-y-1.5">
              {overview.students.map((st) => {
                const latest = overview.notes.find((n) => n.studentId === st.id);
                return (
                  <li key={st.id} className="flex items-baseline gap-2 text-sm">
                    <span className="font-medium text-neutral-900">
                      {st.firstName} {st.lastName}
                    </span>
                    <span className="text-neutral-500">
                      {latest
                        ? `last note ${new Date(latest.dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        : "no notes yet"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/notes"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#7030A0] hover:underline underline-offset-4"
            >
              Read notes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Step 0 — always complete, non-interactive */}
        <div className="flex items-center gap-5 p-5 rounded-lg border border-green-200 bg-green-50">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-green-600">Step 0</span>
            <h2 className="text-base font-medium text-neutral-900 mt-0.5">
              Approved by the Mathitude team
            </h2>
            <p className="text-sm text-green-700 mt-0.5">
              Your account has been set up and verified. You&apos;re good to go.
            </p>
          </div>
          <div className="shrink-0 text-sm font-medium text-green-600">
            Done ✓
          </div>
        </div>

        {!checklistHidden &&
          steps.map((step, i) => (
            <Link
              key={step.href}
              href={step.href}
              className="group flex items-center gap-5 p-5 rounded-lg border border-neutral-200 bg-white hover:shadow-sm hover:border-neutral-300 transition-all"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <step.icon className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-400">Step {i + 1}</span>
                </div>
                <h2 className="text-base font-medium text-neutral-900 mt-0.5">
                  {step.title}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">{step.description}</p>
              </div>
              <div className="shrink-0 flex items-center gap-1 text-sm font-medium text-neutral-400 group-hover:text-neutral-900 transition-colors">
                <span className="hidden sm:inline">{step.cta}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}

        {checklistHidden ? (
          <button
            type="button"
            onClick={() => setChecklistVisibility(false)}
            className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-4"
          >
            Show setup steps
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setChecklistVisibility(true)}
            className="text-sm text-neutral-400 hover:text-neutral-700 underline underline-offset-4"
          >
            Skip for now
          </button>
        )}
      </div>

      <div className="mt-10 p-5 rounded-lg bg-neutral-50 border border-neutral-200">
        <p className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">Need help?</span>{" "}
          Email{" "}
          <a href="mailto:info@mathitude.com" className="font-medium text-neutral-900 hover:underline underline-offset-4">info@mathitude.com</a>
        </p>
      </div>
    </div>
  );
}
