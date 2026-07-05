"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Clock, Copy as CopyIcon, User, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CommandDeck } from "@/components/admin/command-deck";

interface ScheduleSession {
  studentId: string;
  dateTime: string;
  date: string;
  time: string;
  duration: number;
  type: "individual" | "group";
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  students?: string[];
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const dayIndex = date.getDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return dayNames[dayIndex];
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function computeEndTime(time: string, duration: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + duration;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  const ampm = endH >= 12 ? "PM" : "AM";
  const hour = endH % 12 || 12;
  return `${hour}:${endM.toString().padStart(2, "0")} ${ampm}`;
}

function SessionCard({
  session,
  studentNameById,
}: {
  session: ScheduleSession;
  studentNameById: Record<string, string>;
}) {
  const isGroup = session.type === "group";
  const startFormatted = formatTime(session.time);
  const endFormatted = computeEndTime(session.time, session.duration);
  const studentLabel =
    studentNameById[session.studentId] || "Student";

  return (
    <Card
      className={`py-0 overflow-hidden border border-[color:var(--color-border-warm)] rounded-lg transition-all hover-lift`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isGroup ? (
                <Users className="h-4 w-4 text-neutral-400 shrink-0" />
              ) : (
                <User className="h-4 w-4 text-neutral-400 shrink-0" />
              )}
              <h4
                className="font-semibold text-neutral-900 text-sm truncate"
                title={session.studentId}
              >
                {isGroup ? "Group session" : studentLabel}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Clock className="h-3 w-3" />
              {startFormatted} - {endFormatted}
            </div>
          </div>
          <Badge
            className={
              isGroup
                ? "bg-neutral-100 text-neutral-600 border-neutral-200"
                : "bg-neutral-900/5 text-neutral-900 border-neutral-200"
            }
          >
            {isGroup ? "Group" : "1-on-1"}
          </Badge>
        </div>

        {isGroup && session.students && session.students.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[color:var(--color-border-warm)]">
            <p className="text-xs text-neutral-400 mb-1">Students:</p>
            <div className="flex flex-wrap gap-1">
              {session.students.map((sid) => (
                <span
                  key={sid}
                  title={sid}
                  className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full"
                >
                  {studentNameById[sid] || "Student"}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-neutral-400 mt-2">{session.duration} min &middot; {session.status}</p>
      </div>
    </Card>
  );
}

export default function AdminSchedulePage() {
  const fetchApi = useApi();
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [studentNameById, setStudentNameById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [copyResult, setCopyResult] = useState<string | null>(null);

  // D-2: duplicate last week's schedule into this week (admin copies the
  // whole schedule; tutors have the same button scoped to their own sessions
  // on the tutor portal). Idempotent server-side.
  const copyLastWeek = async () => {
    if (!window.confirm("Copy all of last week's sessions into this week?")) return;
    setCopying(true);
    setCopyResult(null);
    try {
      const res = await fetchApi("/api/sessions/copy-last-week", { method: "POST" });
      const j = await res.json();
      setCopyResult(
        res.ok
          ? `${j.created} copied${j.skipped ? `, ${j.skipped} already on the books` : ""}`
          : j.error || "Copy failed",
      );
      if (res.ok && j.created > 0) {
        const r = await fetchApi("/api/sessions").then((x) => x.json());
        setSessions(
          ((r.sessions || []) as Record<string, unknown>[]).filter(
            (s) => s.type !== "note",
          ) as unknown as ScheduleSession[],
        );
      }
    } catch {
      setCopyResult("Copy failed");
    } finally {
      setCopying(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchApi("/api/sessions").then((res) => res.json()),
      fetchApi("/api/students").then((res) => res.json()),
    ])
      .then(([sessJson, stuJson]) => {
        const allSessions = sessJson.sessions || [];
        const realSessions = allSessions.filter(
          (s: Record<string, unknown>) => s.type !== "note"
        ) as ScheduleSession[];
        setSessions(realSessions);

        // Build {studentId → "Jane Smith"} so cards render human names
        // instead of stu_jane_smith_abc.
        const map: Record<string, string> = {};
        for (const s of (stuJson.students || []) as Array<{
          id: string;
          firstName?: string;
          lastName?: string;
        }>) {
          const name = `${s.firstName || ""} ${s.lastName || ""}`.trim();
          if (name) map[s.id] = name;
        }
        setStudentNameById(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchApi]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Weekly Schedule
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Loading schedule...</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Group sessions by day of week from the date field
  const schedule: Record<string, ScheduleSession[]> = {};
  for (const day of days) {
    schedule[day] = [];
  }
  for (const session of sessions) {
    const day = getDayOfWeek(session.date);
    if (schedule[day]) {
      schedule[day].push(session);
    }
  }
  // Sort each day's sessions by time
  for (const day of days) {
    schedule[day].sort((a, b) => a.time.localeCompare(b.time));
  }

  const totalSessions = sessions.length;
  const individualCount = sessions.filter((s) => s.type === "individual").length;
  const groupCount = sessions.filter((s) => s.type === "group").length;

  return (
    <div className="space-y-8">
      {/* Command deck — Paula's morning briefing */}
      <CommandDeck />

      {/* Weekly schedule header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
            Weekly Schedule
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {totalSessions} sessions &middot; {individualCount} individual &middot;{" "}
            {groupCount} group
          </p>
        </div>
        <div className="flex items-center gap-3">
          {copyResult && (
            <span className="text-xs text-neutral-500">{copyResult}</span>
          )}
          <button
            onClick={copyLastWeek}
            disabled={copying}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border-warm)] px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <CopyIcon className="h-3.5 w-3.5" />
            {copying ? "Copying…" : "Copy last week"}
          </button>
        </div>
      </div>

      {sessions.length === 0 && (
        <Card className="border border-dashed border-[color:var(--color-border-warm)] rounded-lg bg-[color:var(--color-surface-card)]/50">
          <div className="text-center py-12 px-4">
            <p className="text-sm text-neutral-700 font-medium">Quiet week.</p>
            <p className="text-xs text-neutral-500 mt-1">
              Once sessions are scheduled, they&apos;ll group here by day.
            </p>
            <a
              href="/admin/sessions/new"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-mathitude-purple hover:text-[#5d288a]"
            >
              Log a session →
            </a>
          </div>
        </Card>
      )}

      {sessions.length > 0 && (
        <>
          {/* Legend */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-neutral-900" />
              <span className="text-xs text-neutral-600">Individual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-neutral-400" />
              <span className="text-xs text-neutral-600">Group</span>
            </div>
          </div>

          {/* Schedule tabs */}
          <Tabs defaultValue="Monday">
            <TabsList className="w-full justify-start overflow-x-auto">
              {days.map((day) => (
                <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                  <span className="ml-1 text-xs text-neutral-400">
                    ({schedule[day].length})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {days.map((day) => (
              <TabsContent key={day} value={day} className="mt-4">
                {schedule[day].length > 0 ? (
                  <div className="space-y-3 admin-stagger">
                    {schedule[day].map((session, idx) => (
                      <SessionCard
                        key={`${session.studentId}-${session.dateTime}-${idx}`}
                        session={session}
                        studentNameById={studentNameById}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-neutral-500">
                    <p className="text-sm">No sessions scheduled for {day}.</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}
