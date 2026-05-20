"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { BookOpen, ExternalLink, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Resource {
  id: string;
  title: string;
  description?: string;
  url?: string;
  category?: string;
  gradeMin?: string;
  gradeMax?: string;
  tags?: string[];
}

const categoryOrder = [
  "books",
  "instructions",
  "tools",
  "puzzles",
  "videos",
  "products",
];

function categoryLabel(c: string): string {
  return (
    {
      books: "Books / Textbooks",
      instructions: "Standard Instructions",
      tools: "Interactive Tools",
      puzzles: "Puzzles",
      videos: "Videos",
      products: "Recommended Products",
    } as Record<string, string>
  )[c] || c;
}

export default function TutorResourcesPage() {
  const fetchApi = useApi();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/api/resources")
      .then((r) => r.json())
      .then((j) => {
        setItems(j.resources || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchApi]);

  const grouped: Record<string, Resource[]> = {};
  for (const r of items) {
    const k = r.category || "tools";
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(r);
  }

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/tutor"
          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-3 w-3" /> Tutor portal
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-[#7030A0]" />
          Resource Library
        </h1>
        <p className="text-sm text-neutral-500 mt-2">
          Textbook links, recommended products, standard instructions, and
          activity references — curated by Paula. Read-only.
        </p>

        <div className="mt-8 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <Card className="border border-neutral-200 rounded-lg overflow-hidden">
              <div className="p-10 text-center text-sm text-neutral-500">
                No resources have been added yet. Ask Paula to add them at
                /admin/resources.
              </div>
            </Card>
          ) : (
            sortedCategories.map((cat) => (
              <section key={cat}>
                <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-[#7030A0] mb-3">
                  {categoryLabel(cat)}
                </h2>
                <div className="space-y-2">
                  {grouped[cat].map((r) => (
                    <Card
                      key={r.id}
                      className="border border-neutral-200 rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-neutral-900">
                              {r.title}
                            </h3>
                            {r.description && (
                              <p className="mt-1.5 text-sm text-neutral-600">
                                {r.description}
                              </p>
                            )}
                            {(r.gradeMin || r.gradeMax) && (
                              <p className="mt-1 text-xs text-neutral-400">
                                Grade range: {r.gradeMin || "?"}–
                                {r.gradeMax || "?"}
                              </p>
                            )}
                            {r.tags && r.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {r.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[10px] font-medium text-neutral-500 bg-neutral-100 rounded-full px-2 py-0.5"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {r.url && (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#7030A0] hover:text-[#5d288a] shrink-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
