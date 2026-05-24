"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Mail,
  Receipt,
  AlertCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { titleCase } from "@/lib/title-case";

interface TodaySession {
  studentId: string;
  studentName: string | null;
  dateTime: string;
  time: string;
  type: string;
  status: string;
  duration: number;
  tutorId?: string;
}

interface TodayData {
  today: { date: string; weekday: string };
  todaySessions: TodaySession[];
  thisWeek: {
    paidCents: number;
    lastWeekPaidCents: number;
    deltaCents: number;
  };
  pendingConsultations: number;
  unbilled: { cents: number; count: number };
  attention: { overdueOrFailedCents: number; overdueOrFailedCount: number };
}

function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function greetingFor(name: string | undefined): string {
  const hour = new Date().getHours();
  const slot =
    hour < 5
      ? "Up late"
      : hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : hour < 22
            ? "Good evening"
            : "Burning the candle";
  return name ? `${slot}, ${name}.` : `${slot}.`;
}

function formatTime12(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function CommandDeck() {
  const fetchApi = useApi();
  const { user } = useUser();
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const firstName = titleCase(user?.firstName || "");

  useEffect(() => {
    fetchApi("/api/admin/today")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        setData(json);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
      .finally(() => setLoading(false));
  }, [fetchApi]);

  // Skeleton while loading — preserves layout so cards don't pop in.
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="h-7 w-72 skeleton" />
          <div className="h-4 w-48 skeleton" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-md border-0 badge-error px-3 py-2 text-sm slide-down-in">
        Couldn&apos;t load Today data: {error || "no data"}
      </div>
    );
  }

  const delta = data.thisWeek.deltaCents;
  const deltaPositive = delta > 0;
  const deltaNeutral = delta === 0;
  const deltaPct =
    data.thisWeek.lastWeekPaidCents > 0
      ? Math.round((delta / data.thisWeek.lastWeekPaidCents) * 100)
      : null;

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
          {greetingFor(firstName)}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {data.today.weekday},{" "}
          {new Date(data.today.date + "T00:00:00").toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })}
          {" · "}
          {data.todaySessions.length === 0
            ? "Nothing scheduled."
            : `${data.todaySessions.length} session${
                data.todaySessions.length === 1 ? "" : "s"
              } today.`}
        </p>
      </header>

      {/* 5-card command deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 admin-stagger">
        {/* Today's sessions */}
        <Card className="border border-[color:var(--color-border-warm)] rounded-lg hover-lift">
          <CardContent className="py-4 flex flex-col h-full">
            <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
              <Calendar className="h-3 w-3" />
              Today
            </div>
            <p className="text-3xl font-semibold text-neutral-900 mt-1 leading-none font-tabular">
              {data.todaySessions.length}
            </p>
            <p className="text-xs text-neutral-500 mt-1">sessions</p>
            <Link
              href="/admin"
              className="mt-auto pt-3 text-xs font-medium text-mathitude-purple hover:text-[#5d288a] inline-flex items-center gap-1"
            >
              See schedule <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* This week revenue + delta */}
        <Card className="border border-[color:var(--color-border-warm)] rounded-lg hover-lift">
          <CardContent className="py-4 flex flex-col h-full">
            <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
              <Receipt className="h-3 w-3" />
              This week
            </div>
            <p className="text-2xl font-semibold text-neutral-900 mt-1 leading-none font-tabular">
              {dollars(data.thisWeek.paidCents)}
            </p>
            <p
              className={`text-xs mt-1 inline-flex items-center gap-1 ${
                deltaNeutral
                  ? "text-neutral-500"
                  : deltaPositive
                    ? "text-[color:var(--color-state-success)]"
                    : "text-[color:var(--color-state-error)]"
              }`}
            >
              {deltaNeutral ? null : deltaPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {deltaNeutral
                ? "Same as last week"
                : `${deltaPositive ? "+" : ""}${dollars(Math.abs(delta))}${
                    deltaPct !== null ? ` (${deltaPct > 0 ? "+" : ""}${deltaPct}%)` : ""
                  } vs last week`}
            </p>
            <Link
              href="/admin/financials"
              className="mt-auto pt-3 text-xs font-medium text-mathitude-purple hover:text-[#5d288a] inline-flex items-center gap-1"
            >
              Financials <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Pending consultations */}
        <Card className="border border-[color:var(--color-border-warm)] rounded-lg hover-lift">
          <CardContent className="py-4 flex flex-col h-full">
            <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
              <Mail className="h-3 w-3" />
              Consultations
            </div>
            <p className="text-3xl font-semibold text-neutral-900 mt-1 leading-none font-tabular">
              {data.pendingConsultations}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {data.pendingConsultations === 0
                ? "All caught up"
                : "to reply to"}
            </p>
            <Link
              href="/admin/consultations"
              className="mt-auto pt-3 text-xs font-medium text-mathitude-purple hover:text-[#5d288a] inline-flex items-center gap-1"
            >
              Review inbox <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Unbilled completed sessions */}
        <Card className="border border-[color:var(--color-border-warm)] rounded-lg hover-lift">
          <CardContent className="py-4 flex flex-col h-full">
            <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
              <Clock className="h-3 w-3" />
              Unbilled
            </div>
            <p className="text-2xl font-semibold text-neutral-900 mt-1 leading-none font-tabular">
              {dollars(data.unbilled.cents)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {data.unbilled.count} session{data.unbilled.count === 1 ? "" : "s"}
              {" "}to charge
            </p>
            <Link
              href="/admin/billing"
              className="mt-auto pt-3 text-xs font-medium text-mathitude-purple hover:text-[#5d288a] inline-flex items-center gap-1"
            >
              Billing queue <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Overdue + failed — only show if there's actually something to act on */}
        <Card
          className={`border rounded-lg hover-lift ${
            data.attention.overdueOrFailedCount > 0
              ? "border-[color:var(--color-state-error)]/30 bg-[color:var(--color-state-error-soft)]/40"
              : "border-[color:var(--color-border-warm)]"
          }`}
        >
          <CardContent className="py-4 flex flex-col h-full">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500">
              <AlertCircle className="h-3 w-3" />
              Attention
            </div>
            <p
              className={`text-2xl font-semibold mt-1 leading-none font-tabular ${
                data.attention.overdueOrFailedCount > 0
                  ? "text-[color:var(--color-state-error)]"
                  : "text-neutral-900"
              }`}
            >
              {data.attention.overdueOrFailedCount > 0
                ? dollars(data.attention.overdueOrFailedCents)
                : "All clear"}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {data.attention.overdueOrFailedCount === 0
                ? "No failed charges"
                : `${data.attention.overdueOrFailedCount} payment${
                    data.attention.overdueOrFailedCount === 1 ? "" : "s"
                  } overdue or failed`}
            </p>
            <Link
              href="/admin/payments"
              className="mt-auto pt-3 text-xs font-medium text-mathitude-purple hover:text-[#5d288a] inline-flex items-center gap-1"
            >
              Payments <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Today's session strip — only renders if there's anything today. */}
      {data.todaySessions.length > 0 && (
        <Card className="border border-[color:var(--color-border-warm)] rounded-lg">
          <CardContent className="py-3">
            <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Today&apos;s schedule
            </p>
            <ul className="divide-y divide-[color:var(--color-border-warm)]">
              {data.todaySessions.map((s, i) => (
                <li
                  key={`${s.studentId}-${s.dateTime}-${i}`}
                  className="flex items-center gap-3 py-2 text-sm"
                >
                  <span className="font-tabular text-neutral-700 w-20">
                    {formatTime12(s.time)}
                  </span>
                  <span className="flex-1 text-neutral-900 truncate" title={s.studentId}>
                    {s.studentName || "Student"}
                    {s.type === "group" && (
                      <span className="ml-2 text-xs text-neutral-500">
                        · group
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-neutral-500 font-tabular">
                    {s.duration} min
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
