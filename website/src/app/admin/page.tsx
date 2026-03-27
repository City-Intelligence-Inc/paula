"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Student } from "@/lib/types";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/students")
      .then((res) => res.json())
      .then((json) => {
        setStudents(json.students || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-mathitude-navy">Students</h1>
          <p className="text-sm text-gray-500 mt-1">Loading students...</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-mathitude-teal border-t-transparent" />
        </div>
      </div>
    );
  }

  const filtered = students.filter(
    (s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.parentName.toLowerCase().includes(search.toLowerCase()) ||
      s.grade.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = students.filter((s) => s.status === "active").length;
  const waitlistCount = students.filter((s) => s.status === "waitlist").length;

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
        {students.length === 0 && !search && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No students yet. Add your first student to get started.</p>
          </div>
        )}

        {filtered.map((student) => (
          <Card key={student.id} className="py-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
              {/* Name & Grade */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-mathitude-navy truncate">
                    {student.firstName} {student.lastName}
                  </h3>
                  <Badge
                    className={
                      student.status === "active"
                        ? "bg-mathitude-teal/10 text-mathitude-teal border-mathitude-teal/20"
                        : "bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20"
                    }
                  >
                    {student.status === "active" ? "Active" : student.status === "waitlist" ? "Waitlist" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Grade {student.grade}
                </p>
              </div>

              {/* Session type */}
              <div className="sm:text-center sm:min-w-[120px]">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Session Type
                </p>
                <p className="text-sm font-medium text-mathitude-navy">
                  {student.sessionType === "individual" ? "Individual" : "Group"}
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

        {filtered.length === 0 && students.length > 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No students found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
