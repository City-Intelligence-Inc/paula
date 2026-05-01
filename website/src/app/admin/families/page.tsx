"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { client } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Plus, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Family } from "@/lib/types";

export default function AdminFamiliesPage() {
  const fetchApi = useApi();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    client(fetchApi)
      .families.list()
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Families
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Households grouped for billing &amp; communication
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

      {!loading && !error && families.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-sm">
            No families yet. Run the import or add one manually.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {families.map((family) => (
          <Card
            key={family.id}
            className="py-0 overflow-hidden border border-neutral-200 rounded-lg"
          >
            <div className="flex items-center gap-4 p-4">
              <HomeIcon className="h-5 w-5 text-neutral-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 truncate">
                  {family.id}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {family.address
                    ? `${family.address.city}, ${family.address.state}`
                    : "No address on file"}
                </p>
              </div>
              <Link
                href={`/admin/families/${family.id}`}
                className="text-xs text-neutral-500 hover:text-neutral-900"
              >
                View →
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
