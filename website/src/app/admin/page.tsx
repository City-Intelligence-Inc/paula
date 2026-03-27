"use client";

import { useState } from "react";
import { Search, Plus, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Student {
  id: number;
  name: string;
  grade: string;
  status: "Active" | "Waitlist";
  nextSession: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
}

const students: Student[] = [
  {
    id: 1,
    name: "Aarav Patel",
    grade: "5th",
    status: "Active",
    nextSession: "Mon 3:30 PM",
    parentName: "Priya Patel",
    parentPhone: "(408) 555-1201",
    parentEmail: "priya.p@email.com",
  },
  {
    id: 2,
    name: "Sofia Martinez",
    grade: "7th",
    status: "Active",
    nextSession: "Tue 4:00 PM",
    parentName: "Maria Martinez",
    parentPhone: "(650) 555-2302",
    parentEmail: "maria.m@email.com",
  },
  {
    id: 3,
    name: "Ethan Chen",
    grade: "4th",
    status: "Active",
    nextSession: "Mon 4:30 PM",
    parentName: "Wei Chen",
    parentPhone: "(408) 555-3403",
    parentEmail: "wei.c@email.com",
  },
  {
    id: 4,
    name: "Olivia Thompson",
    grade: "6th",
    status: "Waitlist",
    nextSession: "---",
    parentName: "Sarah Thompson",
    parentPhone: "(510) 555-4504",
    parentEmail: "sarah.t@email.com",
  },
  {
    id: 5,
    name: "Rohan Gupta",
    grade: "8th",
    status: "Active",
    nextSession: "Wed 3:00 PM",
    parentName: "Anita Gupta",
    parentPhone: "(408) 555-5605",
    parentEmail: "anita.g@email.com",
  },
  {
    id: 6,
    name: "Emma Wilson",
    grade: "3rd",
    status: "Active",
    nextSession: "Thu 4:00 PM",
    parentName: "Jessica Wilson",
    parentPhone: "(650) 555-6706",
    parentEmail: "jessica.w@email.com",
  },
  {
    id: 7,
    name: "Liam Nakamura",
    grade: "5th",
    status: "Active",
    nextSession: "Tue 3:30 PM",
    parentName: "Yuki Nakamura",
    parentPhone: "(408) 555-7807",
    parentEmail: "yuki.n@email.com",
  },
  {
    id: 8,
    name: "Isabella Rivera",
    grade: "6th",
    status: "Waitlist",
    nextSession: "---",
    parentName: "Carlos Rivera",
    parentPhone: "(510) 555-8908",
    parentEmail: "carlos.r@email.com",
  },
  {
    id: 9,
    name: "Noah Kim",
    grade: "4th",
    status: "Active",
    nextSession: "Wed 4:30 PM",
    parentName: "Jae Kim",
    parentPhone: "(408) 555-9009",
    parentEmail: "jae.k@email.com",
  },
  {
    id: 10,
    name: "Zara Ahmed",
    grade: "7th",
    status: "Active",
    nextSession: "Fri 3:00 PM",
    parentName: "Fatima Ahmed",
    parentPhone: "(650) 555-1110",
    parentEmail: "fatima.a@email.com",
  },
  {
    id: 11,
    name: "Aiden O'Brien",
    grade: "5th",
    status: "Active",
    nextSession: "Thu 3:30 PM",
    parentName: "Megan O'Brien",
    parentPhone: "(408) 555-1211",
    parentEmail: "megan.o@email.com",
  },
  {
    id: 12,
    name: "Priya Sharma",
    grade: "8th",
    status: "Active",
    nextSession: "Sat 10:00 AM",
    parentName: "Deepak Sharma",
    parentPhone: "(510) 555-1312",
    parentEmail: "deepak.s@email.com",
  },
  {
    id: 13,
    name: "Lucas Park",
    grade: "3rd",
    status: "Waitlist",
    nextSession: "---",
    parentName: "Soo-Min Park",
    parentPhone: "(408) 555-1413",
    parentEmail: "soomin.p@email.com",
  },
];

export default function AdminStudentsPage() {
  const [search, setSearch] = useState("");

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.parentName.toLowerCase().includes(search.toLowerCase()) ||
      s.grade.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = students.filter((s) => s.status === "Active").length;
  const waitlistCount = students.filter((s) => s.status === "Waitlist").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mathitude-navy">Students</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCount} active &middot; {waitlistCount} on waitlist
          </p>
        </div>
        <Button className="bg-mathitude-teal hover:bg-mathitude-teal/90 text-white">
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search students, parents, or grades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-mathitude-teal focus:outline-none focus:ring-2 focus:ring-mathitude-teal/20"
        />
      </div>

      {/* Student cards */}
      <div className="space-y-3">
        {filtered.map((student) => (
          <Card key={student.id} className="py-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
              {/* Name & Grade */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-mathitude-navy truncate">
                    {student.name}
                  </h3>
                  <Badge
                    className={
                      student.status === "Active"
                        ? "bg-mathitude-teal/10 text-mathitude-teal border-mathitude-teal/20"
                        : "bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20"
                    }
                  >
                    {student.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Grade {student.grade}
                </p>
              </div>

              {/* Next session */}
              <div className="sm:text-center sm:min-w-[120px]">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Next Session
                </p>
                <p className="text-sm font-medium text-mathitude-navy">
                  {student.nextSession}
                </p>
              </div>

              <Separator
                orientation="vertical"
                className="hidden sm:block h-10"
              />

              {/* Parent contact */}
              <div className="sm:min-w-[200px]">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Parent Contact
                </p>
                <p className="text-sm font-medium text-mathitude-navy">
                  {student.parentName}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="h-3 w-3" />
                    {student.parentPhone}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Mail className="h-3 w-3" />
                    {student.parentEmail}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No students found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
