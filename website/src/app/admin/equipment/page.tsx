"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Package, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EquipmentItem {
  id: string;
  title: string;
  url: string;
  category?: string;
  notes?: string;
  addedAt: string;
}

export default function AdminEquipmentPage() {
  const fetchApi = useApi();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", category: "", notes: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi("/api/admin/equipment")
      .then((r) => r.json())
      .then((j) => {
        setItems(j.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchApi]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.url.trim()) {
      setError("Title and link are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetchApi("/api/admin/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "add", ...form }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not add");
      setItems(j.items || []);
      setForm({ title: "", url: "", category: "", notes: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetchApi("/api/admin/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "delete", id }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) setItems(j.items || []);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
          <Package className="h-6 w-6 text-[#7030A0]" />
          Equipment & supplies
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Internal Amazon (and other) links for tutoring supplies — for you and
          remote employees. Not shown to families or tutors.
        </p>
      </div>

      <Card className="border border-neutral-200 rounded-lg">
        <form onSubmit={addItem} className="p-4 grid gap-3 sm:grid-cols-2">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="What is it? (e.g. Magnetic tiles, 100-pc)"
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
          />
          <input
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="Link (Amazon, etc.)"
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
          />
          <input
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="Category (optional — e.g. Manipulatives)"
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
          />
          <input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional — e.g. tried 3, settled on this)"
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
          />
          <div className="sm:col-span-2 flex items-center gap-3">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#7030A0] text-white hover:bg-[#5d288a]"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Adding…" : "Add link"}
            </Button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      </Card>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No equipment links yet. Add your first above.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <Card key={it.id} className="py-0 border border-neutral-200 rounded-lg">
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-neutral-900">{it.title}</p>
                    {it.category && (
                      <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 rounded-full px-2 py-0.5 uppercase tracking-wide">
                        {it.category}
                      </span>
                    )}
                  </div>
                  {it.notes && (
                    <p className="text-sm text-neutral-500 mt-0.5">{it.notes}</p>
                  )}
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#7030A0] hover:text-[#5d288a] break-all"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {it.url}
                  </a>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(it.id)}
                  className="text-red-600 hover:bg-red-50 text-xs shrink-0"
                  title="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
