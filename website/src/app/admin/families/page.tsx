"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/ui/card";
import { Plus, Search, Users, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { titleCase } from "@/lib/title-case";

type FamSortKey = "name" | "students" | "primary";
type FamSortDir = "asc" | "desc";

interface FamilyParent {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}
interface FamilyStudent {
  id: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  status?: string;
}
interface FamilyEnriched {
  id: string;
  primaryPayerId?: string;
  address?: { street?: string; city?: string; state?: string; zip?: string };
  parents: FamilyParent[];
  students: FamilyStudent[];
  primary?: FamilyParent;
}

function familyName(f: FamilyEnriched): string {
  const last = titleCase(f.primary?.lastName);
  const first = titleCase(f.primary?.firstName);
  if (last && last !== "(unknown)" && last !== first) return `${last} family`;
  if (first) return `${first} family`;
  return f.id.replace(/^fam_/, "").replace(/_/g, " ");
}

export default function AdminFamiliesPage() {
  const fetchApi = useApi();
  const [families, setFamilies] = useState<FamilyEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<FamSortKey>("name");
  const [sortDir, setSortDir] = useState<FamSortDir>("asc");

  useEffect(() => {
    let cancelled = false;
    fetchApi("/api/families")
      .then(async (res) => {
        if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setFamilies(data.families || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchApi]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const matched = q
      ? families.filter((f) => {
          const hay = [
            familyName(f),
            f.primary?.email,
            ...f.students.map((s) => `${s.firstName} ${s.lastName}`),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        })
      : [...families];

    matched.sort((a, b) => {
      let r = 0;
      switch (sortKey) {
        case "students":
          r = a.students.length - b.students.length;
          break;
        case "primary":
          r = (a.primary?.email || "").localeCompare(b.primary?.email || "");
          break;
        case "name":
        default:
          r = familyName(a).localeCompare(familyName(b));
      }
      return sortDir === "asc" ? r : -r;
    });
    return matched;
  }, [families, search, sortKey, sortDir]);

  const studentTotal = families.reduce((sum, f) => sum + f.students.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Families
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {families.length} {families.length === 1 ? "household" : "households"}
            {" · "}
            {studentTotal} {studentTotal === 1 ? "student" : "students"}
          </p>
        </div>
        <Button
          asChild
          className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
        >
          <Link href="/admin/families/new">
            <Plus className="h-4 w-4" />
            Add Family
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by family name, parent email, or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
          />
        </div>
        <div className="relative inline-flex items-center">
          <ArrowUpDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as FamSortKey)}
            className="rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          >
            <option value="name">Sort: Name</option>
            <option value="students"># of students</option>
            <option value="primary">Parent email</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
          className="rounded-lg border border-neutral-200 bg-white py-2.5 px-3 text-sm text-neutral-700 hover:bg-neutral-50"
          title="Toggle sort direction"
        >
          {sortDir === "asc" ? "A→Z" : "Z→A"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      )}

      {error && !loading && (
        <Card className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load families: {error}
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-sm">
            {search
              ? "No families match your search."
              : "No families yet. Run the import or add one manually."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((family) => {
            const name = familyName(family);
            const subtitle = family.primary?.email || family.id;
            return (
              <Link
                key={family.id}
                href={`/admin/families/${family.id}`}
                className="group block"
              >
                <Card className="py-0 overflow-hidden border border-neutral-200 rounded-lg transition-all group-hover:border-neutral-400 group-hover:shadow-sm h-full">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {name}
                        </h3>
                        <p className="text-xs text-neutral-500 truncate">
                          {subtitle}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-full px-2 py-0.5 shrink-0">
                        <Users className="h-3 w-3" />
                        {family.students.length}
                      </span>
                    </div>

                    {family.students.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {family.students.map((s) => {
                          const fn = titleCase(s.firstName);
                          const grade = s.grade ? `· G${s.grade}` : "";
                          return (
                            <span
                              key={s.id}
                              className="inline-flex items-center text-xs text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-md px-2 py-0.5"
                            >
                              {fn} {grade}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
