"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { SortableTh, useSort } from "@/components/admin/sortable-th";

type CalSortKey =
  | "name"
  | "fallStart"
  | "winterBreakStart"
  | "winterBreakEnd"
  | "springBreakStart"
  | "springBreakEnd"
  | "lastDay"
  | "status";

interface SchoolCalendar {
  name: string;
  location: string;
  note?: string;
  fallStart: string;
  winterBreakStart: string;
  winterBreakEnd: string;
  springBreakStart: string;
  springBreakEnd: string;
  lastDay: string;
  status: "Researched" | "Pending";
}

const initialSchools: SchoolCalendar[] = [
  {
    name: "Nueva School",
    location: "Hillsborough",
    note: "Mathitude staff presenting at STEM fair",
    fallStart: "2026-08-24",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-15",
    springBreakEnd: "2027-03-26",
    lastDay: "2027-06-04",
    status: "Researched",
  },
  {
    name: "Castilleja School",
    location: "Palo Alto",
    note: "Sarah's alma mater",
    fallStart: "2026-08-26",
    winterBreakStart: "2026-12-19",
    winterBreakEnd: "2027-01-05",
    springBreakStart: "2027-03-16",
    springBreakEnd: "2027-03-27",
    lastDay: "2027-06-05",
    status: "Researched",
  },
  {
    name: "Menlo School",
    location: "Atherton",
    fallStart: "2026-08-25",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-14",
    springBreakEnd: "2027-03-25",
    lastDay: "2027-06-04",
    status: "Researched",
  },
  {
    name: "Sacred Heart Prep",
    location: "Atherton",
    fallStart: "2026-08-19",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-14",
    springBreakEnd: "2027-03-25",
    lastDay: "2027-06-03",
    status: "Researched",
  },
  {
    name: "Woodside Priory",
    location: "Portola Valley",
    fallStart: "2026-08-26",
    winterBreakStart: "2026-12-19",
    winterBreakEnd: "2027-01-05",
    springBreakStart: "2027-03-16",
    springBreakEnd: "2027-03-27",
    lastDay: "2027-06-05",
    status: "Pending",
  },
  {
    name: "Crystal Springs Uplands",
    location: "Hillsborough",
    fallStart: "2026-08-24",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-14",
    springBreakEnd: "2027-03-25",
    lastDay: "2027-06-04",
    status: "Pending",
  },
  {
    name: "Harker School",
    location: "San Jose",
    fallStart: "2026-08-19",
    winterBreakStart: "2026-12-19",
    winterBreakEnd: "2027-01-05",
    springBreakStart: "2027-03-16",
    springBreakEnd: "2027-03-27",
    lastDay: "2027-06-05",
    status: "Researched",
  },
  {
    name: "Pinewood School",
    location: "Los Altos",
    fallStart: "2026-08-25",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-14",
    springBreakEnd: "2027-03-25",
    lastDay: "2027-06-04",
    status: "Pending",
  },
  {
    name: "Keys School",
    location: "Palo Alto",
    fallStart: "2026-08-25",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-15",
    springBreakEnd: "2027-03-26",
    lastDay: "2027-06-05",
    status: "Pending",
  },
  {
    name: "Woodland School",
    location: "Portola Valley",
    fallStart: "2026-08-24",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-14",
    springBreakEnd: "2027-03-25",
    lastDay: "2027-06-04",
    status: "Researched",
  },
  {
    name: "Phillips Brooks School",
    location: "Menlo Park",
    fallStart: "2026-08-26",
    winterBreakStart: "2026-12-19",
    winterBreakEnd: "2027-01-05",
    springBreakStart: "2027-03-16",
    springBreakEnd: "2027-03-27",
    lastDay: "2027-06-05",
    status: "Pending",
  },
  {
    name: "German International School",
    location: "Mountain View",
    fallStart: "2026-08-17",
    winterBreakStart: "2026-12-19",
    winterBreakEnd: "2027-01-05",
    springBreakStart: "2027-03-23",
    springBreakEnd: "2027-04-03",
    lastDay: "2027-06-12",
    status: "Pending",
  },
];

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function weeksBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const diff = e.getTime() - s.getTime();
  return Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}

function majorityDate(dates: string[]): string {
  const valid = dates.filter((d) => d);
  if (valid.length === 0) return "";
  const counts: Record<string, number> = {};
  for (const d of valid) {
    counts[d] = (counts[d] || 0) + 1;
  }
  // Find the date with the highest count, tie-break by earliest date
  let best = valid[0];
  let bestCount = counts[best];
  for (const [date, count] of Object.entries(counts)) {
    if (count > bestCount || (count === bestCount && date < best)) {
      best = date;
      bestCount = count;
    }
  }
  return best;
}

function medianDate(dates: string[]): string {
  const valid = dates.filter((d) => d).sort();
  if (valid.length === 0) return "";
  return valid[Math.floor(valid.length / 2)];
}

export default function AdminCalendarPage() {
  const [schools, setSchools] = useState<SchoolCalendar[]>(initialSchools);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateSchool = (
    index: number,
    field: keyof SchoolCalendar,
    value: string
  ) => {
    setSchools((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setSaved(false);
  };

  const toggleStatus = (index: number) => {
    setSchools((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        status:
          updated[index].status === "Researched" ? "Pending" : "Researched",
      };
      return updated;
    });
    setSaved(false);
  };

  const researchedCount = schools.filter(
    (s) => s.status === "Researched"
  ).length;

  const sort = useSort<CalSortKey>("name");
  const sortedRows = useMemo(() => {
    const indexed = schools.map((s, i) => [s, i] as const);
    indexed.sort(
      sort.compare<readonly [SchoolCalendar, number]>(([s], k) => {
        if (k === "name") return s.name;
        return s[k] || "";
      }),
    );
    return indexed;
  }, [schools, sort]);

  // Compute Mathitude calendar from majority/median dates
  const mathitudeCalendar = useMemo(() => {
    const fallStarts = schools.map((s) => s.fallStart);
    const winterBreakStarts = schools.map((s) => s.winterBreakStart);
    const winterBreakEnds = schools.map((s) => s.winterBreakEnd);
    const springBreakStarts = schools.map((s) => s.springBreakStart);
    const springBreakEnds = schools.map((s) => s.springBreakEnd);
    const lastDays = schools.map((s) => s.lastDay);

    const fallStart = medianDate(fallStarts);
    const winterBreakStart = majorityDate(winterBreakStarts);
    const winterBreakEnd = majorityDate(winterBreakEnds);
    const springBreakStart = medianDate(springBreakStarts);
    const springBreakEnd = medianDate(springBreakEnds);
    const lastDay = medianDate(lastDays);

    const fallWeeks = weeksBetween(fallStart, winterBreakStart);
    const winterWeeks = weeksBetween(winterBreakEnd, springBreakStart);
    const springWeeks = weeksBetween(springBreakEnd, lastDay);

    return {
      fall: {
        start: fallStart,
        end: winterBreakStart,
        weeks: fallWeeks,
        label: "Fall Quarter",
      },
      winter: {
        start: winterBreakEnd,
        end: springBreakStart,
        weeks: winterWeeks,
        label: "Winter Quarter",
      },
      spring: {
        start: springBreakEnd,
        end: lastDay,
        weeks: springWeeks,
        label: "Spring Quarter",
      },
      winterBreak: {
        start: winterBreakStart,
        end: winterBreakEnd,
      },
      springBreak: {
        start: springBreakStart,
        end: springBreakEnd,
      },
    };
  }, [schools]);

  const handleSave = () => {
    setSaving(true);
    // Simulate save — would POST to backend later
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Academic Calendar 2026-2027
          </h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-xl">
            Align Mathitude&apos;s schedule with the majority of schools.
            Students on contract will be charged whether or not school is in
            session.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-neutral-500">
            {researchedCount} of {schools.length} researched
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : saved ? "Saved" : "Save Calendar"}
          </button>
        </div>
      </div>

      {/* School Calendar Table */}
      <div className="overflow-x-auto">
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50">
                {(
                  [
                    ["name", "School"],
                    ["fallStart", "Fall Start"],
                    ["winterBreakStart", "Winter Break Start"],
                    ["winterBreakEnd", "Winter Break End"],
                    ["springBreakStart", "Spring Break Start"],
                    ["springBreakEnd", "Spring Break End"],
                    ["lastDay", "Last Day"],
                    ["status", "Status"],
                  ] as [CalSortKey, string][]
                ).map(([k, label]) => (
                  <SortableTh
                    key={k}
                    sortKey={k}
                    activeKey={sort.key}
                    dir={sort.dir}
                    onClick={sort.toggle}
                    align={k === "status" ? "center" : "left"}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </SortableTh>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {sortedRows.map(([school, index]) => (
                <tr key={school.name} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-neutral-900 whitespace-nowrap">
                        {school.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {school.location}
                        {school.note && (
                          <span className="text-neutral-400">
                            {" "}
                            &middot; {school.note}
                          </span>
                        )}
                      </p>
                    </div>
                  </td>
                  {(
                    [
                      "fallStart",
                      "winterBreakStart",
                      "winterBreakEnd",
                      "springBreakStart",
                      "springBreakEnd",
                      "lastDay",
                    ] as const
                  ).map((field) => (
                    <td key={field} className="px-3 py-3">
                      <input
                        type="date"
                        value={school[field]}
                        onChange={(e) =>
                          updateSchool(index, field, e.target.value)
                        }
                        className="border border-neutral-200 rounded-md px-2 py-1.5 text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 w-[140px]"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    <button onClick={() => toggleStatus(index)}>
                      <Badge
                        className={
                          school.status === "Researched"
                            ? "bg-neutral-900/5 text-neutral-900 hover:bg-neutral-900/10 border-transparent cursor-pointer"
                            : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border-transparent cursor-pointer"
                        }
                      >
                        {school.status}
                      </Badge>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mathitude Recommended Calendar */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 tracking-tight mb-1">
          Recommended Mathitude Calendar
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          Derived from the majority and median dates across all {schools.length}{" "}
          schools.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            mathitudeCalendar.fall,
            mathitudeCalendar.winter,
            mathitudeCalendar.spring,
          ].map((quarter) => (
            <Card
              key={quarter.label}
              className="border border-neutral-200 rounded-lg p-0"
            >
              <div className="p-5">
                <h3 className="font-semibold text-neutral-900 tracking-tight text-lg">
                  {quarter.label}
                </h3>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Start</span>
                    <span className="font-medium text-neutral-900">
                      {formatDateDisplay(quarter.start)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">End</span>
                    <span className="font-medium text-neutral-900">
                      {formatDateDisplay(quarter.end)}
                    </span>
                  </div>
                  <div className="border-t border-neutral-100 pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Teaching weeks</span>
                      <span className="font-medium text-neutral-900">
                        {quarter.weeks}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Contract Billing Periods */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 tracking-tight mb-1">
          Contract Billing Periods
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          Billing is continuous through breaks. Students on contract are charged
          whether or not school is in session.
        </p>

        <Card className="border border-neutral-200 rounded-lg p-0">
          <div className="divide-y divide-neutral-200">
            <div className="grid grid-cols-4 gap-4 px-5 py-3 bg-neutral-50 text-sm font-medium text-neutral-900">
              <span>Period</span>
              <span>Dates</span>
              <span>Weeks</span>
              <span>Notes</span>
            </div>
            <div className="grid grid-cols-4 gap-4 px-5 py-3 text-sm">
              <span className="text-neutral-900 font-medium">
                Fall Billing
              </span>
              <span className="text-neutral-600">
                {formatDateDisplay(mathitudeCalendar.fall.start)} &ndash;{" "}
                {formatDateDisplay(mathitudeCalendar.winterBreak.start)}
              </span>
              <span className="text-neutral-600">
                {mathitudeCalendar.fall.weeks} weeks
              </span>
              <span className="text-neutral-500">
                Through Thanksgiving &amp; finals
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 px-5 py-3 text-sm">
              <span className="text-neutral-900 font-medium">
                Winter Billing
              </span>
              <span className="text-neutral-600">
                {formatDateDisplay(mathitudeCalendar.winter.start)} &ndash;{" "}
                {formatDateDisplay(mathitudeCalendar.springBreak.start)}
              </span>
              <span className="text-neutral-600">
                {mathitudeCalendar.winter.weeks} weeks
              </span>
              <span className="text-neutral-500">
                Includes Presidents&apos; Day week
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 px-5 py-3 text-sm">
              <span className="text-neutral-900 font-medium">
                Spring Billing
              </span>
              <span className="text-neutral-600">
                {formatDateDisplay(mathitudeCalendar.spring.start)} &ndash;{" "}
                {formatDateDisplay(mathitudeCalendar.spring.end)}
              </span>
              <span className="text-neutral-600">
                {mathitudeCalendar.spring.weeks} weeks
              </span>
              <span className="text-neutral-500">Through end of year</span>
            </div>
            <div className="grid grid-cols-4 gap-4 px-5 py-3 text-sm bg-neutral-50">
              <span className="text-neutral-900 font-medium">
                Total Teaching
              </span>
              <span className="text-neutral-600">
                {formatDateDisplay(mathitudeCalendar.fall.start)} &ndash;{" "}
                {formatDateDisplay(mathitudeCalendar.spring.end)}
              </span>
              <span className="text-neutral-900 font-medium">
                {mathitudeCalendar.fall.weeks +
                  mathitudeCalendar.winter.weeks +
                  mathitudeCalendar.spring.weeks}{" "}
                weeks
              </span>
              <span className="text-neutral-500">Excluding breaks</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
