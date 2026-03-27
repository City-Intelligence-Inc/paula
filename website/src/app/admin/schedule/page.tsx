"use client";

import { useState } from "react";
import { Clock, User, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Session {
  id: number;
  time: string;
  endTime: string;
  student: string;
  type: "individual" | "group";
  grade: string;
  groupStudents?: string[];
}

const schedule: Record<string, Session[]> = {
  Monday: [
    {
      id: 1,
      time: "3:00 PM",
      endTime: "3:45 PM",
      student: "Group A (3rd-4th)",
      type: "group",
      grade: "3rd-4th",
      groupStudents: ["Emma Wilson", "Noah Kim", "Lucas Park"],
    },
    {
      id: 2,
      time: "3:30 PM",
      endTime: "4:15 PM",
      student: "Aarav Patel",
      type: "individual",
      grade: "5th",
    },
    {
      id: 3,
      time: "4:30 PM",
      endTime: "5:15 PM",
      student: "Ethan Chen",
      type: "individual",
      grade: "4th",
    },
  ],
  Tuesday: [
    {
      id: 4,
      time: "3:30 PM",
      endTime: "4:15 PM",
      student: "Liam Nakamura",
      type: "individual",
      grade: "5th",
    },
    {
      id: 5,
      time: "4:00 PM",
      endTime: "4:45 PM",
      student: "Sofia Martinez",
      type: "individual",
      grade: "7th",
    },
  ],
  Wednesday: [
    {
      id: 6,
      time: "3:00 PM",
      endTime: "3:45 PM",
      student: "Rohan Gupta",
      type: "individual",
      grade: "8th",
    },
    {
      id: 7,
      time: "3:30 PM",
      endTime: "4:30 PM",
      student: "Group B (7th-8th)",
      type: "group",
      grade: "7th-8th",
      groupStudents: ["Rohan Gupta", "Zara Ahmed", "Priya Sharma"],
    },
    {
      id: 8,
      time: "4:30 PM",
      endTime: "5:15 PM",
      student: "Noah Kim",
      type: "individual",
      grade: "4th",
    },
  ],
  Thursday: [
    {
      id: 9,
      time: "3:30 PM",
      endTime: "4:15 PM",
      student: "Aiden O'Brien",
      type: "individual",
      grade: "5th",
    },
    {
      id: 10,
      time: "4:00 PM",
      endTime: "4:45 PM",
      student: "Emma Wilson",
      type: "individual",
      grade: "3rd",
    },
  ],
  Friday: [
    {
      id: 11,
      time: "3:00 PM",
      endTime: "3:45 PM",
      student: "Zara Ahmed",
      type: "individual",
      grade: "7th",
    },
    {
      id: 12,
      time: "3:30 PM",
      endTime: "4:30 PM",
      student: "Group C (5th-6th)",
      type: "group",
      grade: "5th-6th",
      groupStudents: ["Aarav Patel", "Liam Nakamura", "Aiden O'Brien"],
    },
  ],
  Saturday: [
    {
      id: 13,
      time: "10:00 AM",
      endTime: "10:45 AM",
      student: "Priya Sharma",
      type: "individual",
      grade: "8th",
    },
    {
      id: 14,
      time: "10:30 AM",
      endTime: "11:30 AM",
      student: "Group D (Mixed)",
      type: "group",
      grade: "Mixed",
      groupStudents: ["Ethan Chen", "Sofia Martinez", "Isabella Rivera"],
    },
    {
      id: 15,
      time: "11:30 AM",
      endTime: "12:15 PM",
      student: "Aarav Patel",
      type: "individual",
      grade: "5th",
    },
  ],
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function SessionCard({ session }: { session: Session }) {
  const isGroup = session.type === "group";

  return (
    <Card
      className={`py-0 overflow-hidden border-l-4 ${
        isGroup
          ? "border-l-mathitude-purple"
          : "border-l-mathitude-teal"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isGroup ? (
                <Users className="h-4 w-4 text-mathitude-purple shrink-0" />
              ) : (
                <User className="h-4 w-4 text-mathitude-teal shrink-0" />
              )}
              <h4 className="font-semibold text-mathitude-navy text-sm truncate">
                {session.student}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {session.time} - {session.endTime}
            </div>
          </div>
          <Badge
            className={
              isGroup
                ? "bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20"
                : "bg-mathitude-teal/10 text-mathitude-teal border-mathitude-teal/20"
            }
          >
            {isGroup ? "Group" : "1-on-1"}
          </Badge>
        </div>

        {isGroup && session.groupStudents && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Students:</p>
            <div className="flex flex-wrap gap-1">
              {session.groupStudents.map((name) => (
                <span
                  key={name}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">Grade {session.grade}</p>
      </div>
    </Card>
  );
}

export default function AdminSchedulePage() {
  const totalSessions = Object.values(schedule).flat().length;
  const individualCount = Object.values(schedule)
    .flat()
    .filter((s) => s.type === "individual").length;
  const groupCount = Object.values(schedule)
    .flat()
    .filter((s) => s.type === "group").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-mathitude-navy">
          Weekly Schedule
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalSessions} sessions &middot; {individualCount} individual &middot;{" "}
          {groupCount} group
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-mathitude-teal" />
          <span className="text-xs text-gray-600">Individual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-mathitude-purple" />
          <span className="text-xs text-gray-600">Group</span>
        </div>
      </div>

      {/* Schedule tabs */}
      <Tabs defaultValue="Monday">
        <TabsList className="w-full justify-start overflow-x-auto">
          {days.map((day) => (
            <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 3)}</span>
              {schedule[day] && (
                <span className="ml-1 text-xs text-gray-400">
                  ({schedule[day].length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((day) => (
          <TabsContent key={day} value={day} className="mt-4">
            {schedule[day] && schedule[day].length > 0 ? (
              <div className="space-y-3">
                {schedule[day].map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">No sessions scheduled for {day}.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
