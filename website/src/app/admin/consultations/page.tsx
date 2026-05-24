"use client";

import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Search } from "lucide-react";
import { downloadCsv } from "@/lib/csv";

interface Consultation {
  id: string;
  bookingId?: string;
  parentName?: string;
  email?: string;
  phone?: string;
  offering?: string;
  studentInfo?: string;
  notes?: string;
  source?: string;
  createdAt?: string;
  status?: string;
}

const OFFERING_LABELS: Record<string, string> = {
  "private-tutoring": "Private tutoring",
  "small-group": "Small group engagement",
  "parent-advisories": "Parent advisories",
  speaking: "Speaking engagement",
  "school-stem": "School STEM workshop",
  "math-festival": "Math festival advisory",
  general: "Something else",
};

function offeringLabel(o?: string): string {
  if (!o) return "—";
  return OFFERING_LABELS[o] || o;
}

function exportConsultations(rows: Consultation[]) {
  downloadCsv(
    rows as unknown as Record<string, unknown>[],
    [
      { key: "createdAt", header: "Submitted" },
      { key: "parentName", header: "Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      {
        key: "offering",
        header: "Interest",
        value: (r) => offeringLabel((r as unknown as Consultation).offering),
      },
      { key: "studentInfo", header: "Student info" },
      { key: "notes", header: "Message" },
      { key: "source", header: "Source page" },
      { key: "id", header: "ID" },
    ],
    "consultations",
  );
}

export default function AdminConsultationsPage() {
  const fetchApi = useApi();
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchApi("/api/admin/consultations")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        setItems(json.consultations || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [fetchApi]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((c) => {
      const hay = [c.parentName, c.email, c.studentInfo, c.notes, c.offering]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Consultation requests
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Every submission from{" "}
            <code className="text-xs bg-neutral-100 rounded px-1 py-0.5">
              /contact
            </code>
            . An email also fires to the configured admin address when a new
            request comes in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportConsultations(filtered)}
          disabled={filtered.length === 0}
          className="self-start rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by name, email, student, message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-md border-0 badge-error px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-neutral-500 py-12 text-center">
          {search ? "No consultations match your search." : "No consultation requests yet."}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.id} className="py-0 border border-[color:var(--color-border-warm)] rounded-lg">
              <CardContent className="py-4 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-neutral-900 truncate">
                      {c.parentName || "(no name)"}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 flex-wrap">
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="inline-flex items-center gap-1 hover:text-neutral-900"
                        >
                          <Mail className="h-3 w-3" />
                          {c.email}
                        </a>
                      )}
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="inline-flex items-center gap-1 hover:text-neutral-900"
                        >
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </a>
                      )}
                      {c.createdAt && (
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20 shrink-0">
                    {offeringLabel(c.offering)}
                  </Badge>
                </div>
                {c.studentInfo && (
                  <p className="text-sm text-neutral-700">
                    <span className="text-xs text-neutral-500 uppercase tracking-wide mr-2">
                      Student
                    </span>
                    {c.studentInfo}
                  </p>
                )}
                {c.notes && (
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                    <span className="text-xs text-neutral-500 uppercase tracking-wide mr-2">
                      Message
                    </span>
                    {c.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
