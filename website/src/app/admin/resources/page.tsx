"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { BookOpen, Plus, Trash2, ExternalLink, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

const inputClass =
  "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300";

const categories = [
  { value: "books", label: "Books / Textbooks" },
  { value: "videos", label: "Videos" },
  { value: "puzzles", label: "Puzzles" },
  { value: "tools", label: "Interactive Tools" },
  { value: "products", label: "Recommended Products (Amazon)" },
  { value: "instructions", label: "Standard Instructions" },
];

function categoryLabel(c?: string): string {
  return categories.find((x) => x.value === c)?.label || c || "—";
}

export default function AdminResourcesPage() {
  const fetchApi = useApi();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    category: "tools",
    gradeMin: "",
    gradeMax: "",
    tagsInput: "",
  });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchApi("/api/resources");
      const j = await r.json();
      setItems(j.resources || []);
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const tags = form.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const r = await fetchApi("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          url: form.url,
          category: form.category,
          gradeMin: form.gradeMin,
          gradeMax: form.gradeMax,
          tags,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || "Create failed");
        return;
      }
      setForm({
        title: "",
        description: "",
        url: "",
        category: "tools",
        gradeMin: "",
        gradeMax: "",
        tagsInput: "",
      });
      setAdding(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: Resource) {
    if (!confirm(`Remove "${item.title}"?`)) return;
    const r = await fetchApi(`/api/resources?id=${encodeURIComponent(item.id)}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Delete failed");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#7030A0]" />
            Resource Library
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Standard links, textbook access, recommended Amazon products, and
            instructions — so tutors don&apos;t cut and paste every time.
            Tutors see this read-only at /tutor/resources.
          </p>
        </div>
        {!adding && (
          <Button
            onClick={() => setAdding(true)}
            className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Resource
          </Button>
        )}
      </div>

      {adding && (
        <Card className="border border-neutral-200 rounded-lg overflow-hidden">
          <form onSubmit={handleAdd} className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              New Resource
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  className={inputClass + " resize-none"}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Link (URL)
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, url: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="https://…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className={inputClass}
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.tagsInput}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tagsInput: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="algebra, pre-k, fractals"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Grade min
                </label>
                <input
                  type="text"
                  value={form.gradeMin}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, gradeMin: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="K, 3, 9, …"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Grade max
                </label>
                <input
                  type="text"
                  value={form.gradeMax}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, gradeMax: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="2, 5, 12, 16"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
              >
                {saving ? "Saving..." : "Add Resource"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className="border border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="p-10 text-center text-sm text-neutral-500">
            No resources yet. Add textbook links, recommended products,
            standard instructions — anything you&apos;d otherwise paste from
            memory each time.
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <Card
              key={r.id}
              className="border border-neutral-200 rounded-lg overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-neutral-900">
                        {r.title}
                      </h3>
                      <span className="text-xs text-[#7030A0] bg-[#7030A0]/5 border border-[#7030A0]/10 rounded-full px-2 py-0.5">
                        {categoryLabel(r.category)}
                      </span>
                      {(r.gradeMin || r.gradeMax) && (
                        <span className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-full px-2 py-0.5">
                          Grade {r.gradeMin || "?"}–{r.gradeMax || "?"}
                        </span>
                      )}
                    </div>
                    {r.description && (
                      <p className="mt-1.5 text-sm text-neutral-600">
                        {r.description}
                      </p>
                    )}
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#7030A0] hover:text-[#5d288a]"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {r.url.length > 60 ? r.url.slice(0, 60) + "…" : r.url}
                      </a>
                    )}
                    {r.tags && r.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Tag className="h-3 w-3 text-neutral-400" />
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleDelete(r)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md shrink-0"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
