"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { BookOpen, Calendar, FolderOpen, Newspaper, CreditCard, ArrowRight, Sparkles } from "lucide-react";

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
    description: "Book a free 30-minute introductory session with Paula to discuss your student's needs.",
    href: "/dashboard/schedule",
    icon: Calendar,
    cta: "Pick a time",
  },
  {
    title: "Save Your Payment Method",
    description: "Securely save your card so Paula can charge for sessions without needing to ask each time.",
    href: "/dashboard/billing",
    icon: CreditCard,
    cta: "Add a card",
  },
  {
    title: "Explore Resources",
    description: "Paula's published books, YouTube tutorials, downloadable puzzles, and curated math tools.",
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
  const firstName = user?.firstName || "there";

  return (
    <div className="page-enter">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-mathitude-purple" />
          <span className="text-sm font-medium text-mathitude-purple">Welcome to your portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight" style={{ fontFamily: "var(--font-original-surfer)" }}>
          Hi {firstName}, ready to do some math?
        </h1>
        <p className="mt-3 text-neutral-500 max-w-xl">
          This is your Mathitude home base. Here&apos;s how to get started:
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
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
      </div>

      <div className="mt-10 p-5 rounded-lg bg-neutral-50 border border-neutral-200">
        <p className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">Need help?</span>{" "}
          Call us at{" "}
          <a href="tel:5102052633" className="font-medium text-neutral-900 hover:underline underline-offset-4">510.205.2633</a>
          {" "}or email{" "}
          <a href="mailto:info@mathitude.com" className="font-medium text-neutral-900 hover:underline underline-offset-4">info@mathitude.com</a>
        </p>
      </div>
    </div>
  );
}
