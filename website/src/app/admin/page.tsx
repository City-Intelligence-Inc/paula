"use client";

import { useEffect, useState } from "react";
  const fetchApi = useApi();
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { Clock, User, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

function SessionCard({ session }: { session: ScheduleSession }) {
  const isGroup = session.type === "group";
  const startFormatted = formatTime(session.time);
  const endFormatted = computeEndTime(session.time, session.duration);

  return (
    <Card
      className={`py-0 overflow-hidden border border-neutral-200 rounded-lg`}
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
              <h4 className="font-semibold text-neutral-900 text-sm truncate">
                {isGroup ? `Group Session` : `Student: ${session.studentId}`}
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
          <div className="mt-2 pt-2 border-t border-neutral-100">
            <p className="text-xs text-neutral-400 mb-1">Students:</p>
            <div className="flex flex-wrap gap-1">
              {session.students.map((name) => (
                <span
                  key={name}
                  className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full"
                >
                  {name}
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
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/api/sessions")
      .then((res) => res.json())
      .then((json) => {
        // Filter out notes — only show real sessions
        const allSessions = json.sessions || [];
        const realSessions = allSessions.filter(
          (s: Record<string, unknown>) => s.type !== "note"
        ) as ScheduleSession[];
        setSessions(realSessions);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
    <div className="space-y-6">
      {/* First-time admin guide */}
      <div className="mb-8 p-5 rounded-lg bg-neutral-50 border border-neutral-200">
        <h2 className="text-sm font-medium text-neutral-900 mb-2">Quick Start Guide</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <Link href="/admin/students" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
            <span className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600">1</span>
            Add your students
          </Link>
          <Link href="/admin/calendar" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
            <span className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600">2</span>
            Set up the calendar
          </Link>
          <Link href="/admin/payments" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
            <span className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600">3</span>
            Review payments
          </Link>
          <Link href="/admin/pages" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
            <span className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600">4</span>
            Edit page content
          </Link>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Weekly Schedule
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {totalSessions} sessions &middot; {individualCount} individual &middot;{" "}
          {groupCount} group
        </p>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-sm">No sessions scheduled yet.</p>
        </div>
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
                  <div className="space-y-3">
                    {schedule[day].map((session, idx) => (
                      <SessionCard key={`${session.studentId}-${session.dateTime}-${idx}`} session={session} />
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
