"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { UserCheck, Mail, Phone, BookOpen, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { gradeLabel } from "@/lib/grades";

interface ScheduleSession {
  studentId: string;
  studentName: string;
  dateTime: string;
  time?: string;
  duration?: number;
  type?: string;
  status?: string;
  notes?: string;
}
interface ScheduleDay {
  date: string;
  sessions: ScheduleSession[];
}

function dayLabel(date: string): string {
  // date is YYYY-MM-DD; render as e.g. "Mon Jun 16". Parse as local date.
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function SevenDaySchedule() {
  const fetchApi = useApi();
  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/api/tutor/schedule?days=7")
      .then((r) => r.json())
      .then((j) => {
        setDays(j.days || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchApi]);

  const total = days.reduce((n, d) => n + d.sessions.length, 0);

  return (
    <Card data-guide="tutor-schedule" className="border border-neutral-200 rounded-lg overflow-hidden mb-8">
      <div className="p-4 border-b border-neutral-200 flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-[#7030A0]" />
        <h2 className="text-lg font-semibold text-neutral-900">
          Next 7 days
        </h2>
        {!loading && (
          <span className="ml-auto text-xs text-neutral-500">
            {total} session{total === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {loading ? (
        <div className="p-6 text-sm text-neutral-400">Loading schedule…</div>
      ) : total === 0 ? (
        <div className="p-6 text-sm text-neutral-400">
          No sessions scheduled in the next 7 days.
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {days
            .filter((d) => d.sessions.length > 0)
            .map((d) => (
              <div key={d.date} className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                  {dayLabel(d.date)}
                </p>
                <div className="space-y-1.5">
                  {d.sessions.map((s) => (
                    <Link
                      key={`${s.studentId}#${s.dateTime}`}
                      href={`/tutor/students/${s.studentId}`}
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="text-sm font-mono text-neutral-500 w-14 shrink-0">
                        {s.time || "--:--"}
                      </span>
                      <span className="text-sm font-medium text-neutral-900 flex-1 truncate">
                        {s.studentName}
                      </span>
                      <span className="text-xs text-neutral-400 shrink-0">
                        {s.type}
                        {s.duration ? ` · ${s.duration}m` : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}

interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Student {
  id: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  status?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
}

export default function TutorPortalPage() {
  const fetchApi = useApi();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/api/tutor/students")
      .then((r) => r.json())
      .then((j) => {
        setTutor(j.tutor || null);
        setStudents(j.students || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchApi]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
            <UserCheck className="h-7 w-7 text-[#7030A0]" />
            Tutor Portal
          </h1>
          {tutor ? (
            <p className="text-sm text-neutral-500 mt-2">
              Signed in as{" "}
              <span className="font-medium text-neutral-700">
                {tutor.firstName} {tutor.lastName}
              </span>
              {tutor.email ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-mono text-xs text-neutral-400">
                    {tutor.email}
                  </span>
                </>
              ) : null}
            </p>
          ) : !loading ? (
            <p className="text-sm text-neutral-500 mt-2">
              No tutor record matched your account. An admin needs to create a
              tutor record with your email address before you can see your
              students here.
            </p>
          ) : null}
          <div className="mt-4">
            <Link
              href="/tutor/resources"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7030A0] hover:text-[#5d288a]"
            >
              <BookOpen className="h-4 w-4" />
              Resource library
            </Link>
          </div>
        </div>

        {tutor && <SevenDaySchedule />}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
          </div>
        ) : !tutor ? (
          <Card className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="p-10 text-center">
              <p className="text-sm text-neutral-500">
                Ask an admin to add you as a tutor at{" "}
                <Link
                  href="/admin/tutors"
                  className="font-medium text-[#7030A0] hover:text-[#5d288a]"
                >
                  /admin/tutors
                </Link>
                .
              </p>
            </div>
          </Card>
        ) : students.length === 0 ? (
          <Card className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="p-10 text-center text-sm text-neutral-500">
              No students assigned to you yet. An admin can assign students to
              you from each student&apos;s detail page.
            </div>
          </Card>
        ) : (
          <>
            <div data-guide="tutor-students" className="mb-4 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                Your Students
              </h2>
              <p className="text-xs text-neutral-500">
                {students.length} assigned
              </p>
            </div>
            <div className="space-y-3">
              {students.map((s) => (
                <Card
                  key={s.id}
                  className="border border-neutral-200 rounded-lg overflow-hidden"
                >
                  <Link
                    href={`/tutor/students/${s.id}`}
                    className="block p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {gradeLabel(s.grade)}
                        </p>
                        {s.parentName && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                            <span>Parent: {s.parentName}</span>
                            {s.parentEmail && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {s.parentEmail}
                              </span>
                            )}
                            {s.parentPhone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {s.parentPhone}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {s.status && (
                        <Badge
                          className={
                            s.status === "active"
                              ? "bg-neutral-900/5 text-neutral-900 border-neutral-200"
                              : "bg-neutral-100 text-neutral-600 border-neutral-200"
                          }
                        >
                          {s.status}
                        </Badge>
                      )}
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
