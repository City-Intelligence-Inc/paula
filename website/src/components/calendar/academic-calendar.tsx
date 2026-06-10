"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACADEMIC_YEAR,
  type DayKind,
  eventsInMonth,
  getDayStatus,
  parseLocalDate,
  toISODate,
} from "@/lib/academic-calendar";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Cell styling per day kind — mirrors the PDF's legend colors, tuned to the
// Mathitude purple palette.
const KIND_STYLES: Record<DayKind, string> = {
  "year-start": "bg-emerald-500 text-white font-semibold",
  "year-end": "bg-[#B0263C] text-white font-semibold",
  holiday: "bg-[#7030A0]/12 text-[#5d288a] font-medium",
  "summer-saturday": "bg-sky-100 text-sky-800",
  "closed-sunday": "bg-neutral-100 text-neutral-400",
  open: "bg-white text-neutral-800",
};

const FIRST = parseLocalDate(ACADEMIC_YEAR.firstMonth);
const LAST = parseLocalDate(ACADEMIC_YEAR.lastMonth);

function clampMonth(year: number, month: number): { year: number; month: number } {
  const v = year * 12 + month;
  const min = FIRST.getFullYear() * 12 + FIRST.getMonth();
  const max = LAST.getFullYear() * 12 + LAST.getMonth();
  const c = Math.min(Math.max(v, min), max);
  return { year: Math.floor(c / 12), month: c % 12 };
}

interface LegendItem {
  kind: DayKind;
  label: string;
}
const LEGEND: LegendItem[] = [
  { kind: "year-start", label: "Academic year start" },
  { kind: "year-end", label: "Academic year end" },
  { kind: "holiday", label: "Holiday closure" },
  { kind: "closed-sunday", label: "Closed Sundays" },
  { kind: "summer-saturday", label: "Summer Saturday closure" },
];

function Swatch({ kind }: { kind: DayKind }) {
  return (
    <span
      className={cn(
        "inline-block h-3.5 w-3.5 rounded-sm border border-black/5",
        KIND_STYLES[kind],
      )}
    />
  );
}

export function AcademicCalendar() {
  const [view, setView] = useState<"month" | "week">("month");
  // Default to the academic-year start month.
  const [cursor, setCursor] = useState({
    year: FIRST.getFullYear(),
    month: FIRST.getMonth(),
  });
  // Anchor day for the week view (defaults to the 1st of the cursor month).
  const [weekAnchor, setWeekAnchor] = useState(() => toISODate(FIRST));

  const todayISO = useMemo(() => toISODate(new Date()), []);

  const atStart =
    cursor.year === FIRST.getFullYear() && cursor.month === FIRST.getMonth();
  const atEnd =
    cursor.year === LAST.getFullYear() && cursor.month === LAST.getMonth();

  function shiftMonth(delta: number) {
    setCursor((c) => clampMonth(c.year, c.month + delta));
  }

  function shiftWeek(delta: number) {
    const d = parseLocalDate(weekAnchor);
    d.setDate(d.getDate() + delta * 7);
    const clamped = clampMonth(d.getFullYear(), d.getMonth());
    // Keep the week anchor inside the academic-year window.
    if (
      d.getFullYear() * 12 + d.getMonth() <
      FIRST.getFullYear() * 12 + FIRST.getMonth()
    ) {
      setWeekAnchor(toISODate(FIRST));
    } else if (
      d.getFullYear() * 12 + d.getMonth() >
      LAST.getFullYear() * 12 + LAST.getMonth()
    ) {
      const lastDay = new Date(LAST.getFullYear(), LAST.getMonth() + 1, 0);
      setWeekAnchor(toISODate(lastDay));
    } else {
      setWeekAnchor(toISODate(d));
    }
    setCursor(clamped);
  }

  // Build the 6-row month grid (Sunday-first), including adjacent-month days.
  const monthCells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startOffset = first.getDay(); // 0 = Sunday
    const gridStart = new Date(cursor.year, cursor.month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [cursor]);

  // The 7 days of the anchored week (Sunday-first).
  const weekCells = useMemo(() => {
    const anchor = parseLocalDate(weekAnchor);
    const sunday = new Date(anchor);
    sunday.setDate(anchor.getDate() - anchor.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, [weekAnchor]);

  const monthEvents = useMemo(
    () => eventsInMonth(cursor.year, cursor.month),
    [cursor],
  );

  const headingLabel =
    view === "month"
      ? `${MONTH_NAMES[cursor.month]} ${cursor.year}`
      : weekRangeLabel(weekCells[0], weekCells[6]);

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (view === "month" ? shiftMonth(-1) : shiftWeek(-1))}
            disabled={view === "month" && atStart}
            aria-label="Previous"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2
            className="min-w-[12rem] text-center text-2xl text-[#7030A0] sm:text-left"
            style={{ fontFamily: "var(--font-original-surfer)" }}
          >
            {headingLabel}
          </h2>
          <button
            type="button"
            onClick={() => (view === "month" ? shiftMonth(1) : shiftWeek(1))}
            disabled={view === "month" && atEnd}
            aria-label="Next"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="inline-flex self-start rounded-md border border-neutral-200 p-0.5 sm:self-auto">
          {(["month", "week"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setView(v);
                if (v === "week") {
                  setWeekAnchor(toISODate(new Date(cursor.year, cursor.month, 1)));
                }
              }}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                view === v
                  ? "bg-[#7030A0] text-white"
                  : "text-neutral-600 hover:bg-neutral-50",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200">
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-[#7030A0] text-white">
          {WEEKDAYS.map((d, i) => (
            <div
              key={i}
              className="py-2 text-center text-xs font-semibold uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        {view === "month" ? (
          <div className="grid grid-cols-7">
            {monthCells.map((d, i) => {
              const inMonth = d.getMonth() === cursor.month;
              const status = getDayStatus(d);
              const iso = toISODate(d);
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[64px] border-b border-r border-neutral-100 p-1.5 sm:min-h-[88px]",
                    KIND_STYLES[status.kind],
                    !inMonth && "opacity-30",
                    iso === todayISO && "ring-2 ring-inset ring-[#7030A0]",
                  )}
                >
                  <div className="text-right text-sm leading-none">
                    {d.getDate()}
                  </div>
                  {inMonth && status.label && status.kind !== "closed-sunday" && (
                    <div className="mt-1 line-clamp-2 text-[10px] leading-tight sm:text-[11px]">
                      {status.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {weekCells.map((d, i) => {
              const status = getDayStatus(d);
              const iso = toISODate(d);
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[150px] border-b border-r border-neutral-100 p-2",
                    KIND_STYLES[status.kind],
                    iso === todayISO && "ring-2 ring-inset ring-[#7030A0]",
                  )}
                >
                  <div className="text-sm font-semibold">{d.getDate()}</div>
                  {status.label && status.kind !== "closed-sunday" ? (
                    <div className="mt-2 text-xs leading-snug">{status.label}</div>
                  ) : status.closed ? (
                    <div className="mt-2 text-xs leading-snug">{status.label}</div>
                  ) : (
                    <div className="mt-2 text-[11px] text-neutral-400">Open</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
        {LEGEND.map((item) => (
          <div key={item.kind} className="flex items-center gap-2 text-sm text-neutral-600">
            <Swatch kind={item.kind} />
            {item.label}
          </div>
        ))}
      </div>

      {/* This month's events */}
      {view === "month" && monthEvents.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {MONTH_NAMES[cursor.month]} at a glance
          </h3>
          <ul className="mt-3 divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {monthEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="flex items-center gap-2.5 text-sm text-neutral-800">
                  <Swatch
                    kind={
                      ev.kind === "holiday" ? "holiday" : (ev.kind as DayKind)
                    }
                  />
                  <span className="font-medium">{ev.title}</span>
                  {ev.note && (
                    <span className="text-neutral-400">· {ev.note}</span>
                  )}
                </span>
                <span className="shrink-0 text-sm text-neutral-500">
                  {formatEventRange(ev.start, ev.end)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function weekRangeLabel(start: Date, end: Date): string {
  const s = `${MONTH_NAMES[start.getMonth()].slice(0, 3)} ${start.getDate()}`;
  const e =
    start.getMonth() === end.getMonth()
      ? `${end.getDate()}`
      : `${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getDate()}`;
  return `${s} – ${e}, ${end.getFullYear()}`;
}

function formatEventRange(start: string, end?: string): string {
  const s = parseLocalDate(start);
  const sLabel = `${MONTH_NAMES[s.getMonth()].slice(0, 3)} ${s.getDate()}`;
  if (!end || end === start) return sLabel;
  const e = parseLocalDate(end);
  const eLabel =
    s.getMonth() === e.getMonth()
      ? `${e.getDate()}`
      : `${MONTH_NAMES[e.getMonth()].slice(0, 3)} ${e.getDate()}`;
  return `${sLabel} – ${eLabel}`;
}
