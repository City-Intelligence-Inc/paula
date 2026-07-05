"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Trash2 } from "lucide-react";
import type { SharedFile } from "@/lib/types";

// F-1: staff/tutor management panel for a student's shared file links.
// Entries with audience "family" appear on the family's notes page; "staff"
// entries stay internal (lesson plans, originals, etc.).

export function SharedFilesPanel({ studentId }: { studentId: string }) {
  const fetchApi = useApi();
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [audience, setAudience] = useState<"family" | "staff">("family");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchApi(`/api/students/${studentId}/files`)
      .then((r) => r.json())
      .then((j: { files?: SharedFile[] }) => {
        if (!cancelled) setFiles(j.files || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function add() {
    if (!name.trim() || !url.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetchApi(`/api/students/${studentId}/files`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), url: url.trim(), audience }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to add");
      setFiles(j.files || []);
      setName("");
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(fileId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchApi(
        `/api/students/${studentId}/files?fileId=${encodeURIComponent(fileId)}`,
        { method: "DELETE" },
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to remove");
      setFiles(j.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border border-neutral-200 rounded-lg">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-mathitude-purple" />
          Shared files
        </CardTitle>
        <p className="text-sm text-neutral-500">
          Link worksheets, recaps, or folders (Google Drive, Dropbox, …).
          Family links show on the family&apos;s notes page; staff links stay
          internal.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {files.length === 0 ? (
          <p className="text-sm text-neutral-400">No files shared yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-2 text-sm">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#7030A0] hover:underline underline-offset-2 truncate"
                >
                  {f.name}
                </a>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    f.audience === "family"
                      ? "bg-[#7030A0]/5 text-[#7030A0] border border-[#7030A0]/10"
                      : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                  }`}
                >
                  {f.audience}
                </span>
                <span className="text-xs text-neutral-400 truncate">
                  {f.addedByName}
                </span>
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  disabled={busy}
                  className="ml-auto text-neutral-300 hover:text-red-500"
                  aria-label={`Remove ${f.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name — e.g. Fractions worksheet"
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm sm:w-56"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/…"
            className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm"
          />
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as "family" | "staff")}
            className="rounded-md border border-neutral-200 bg-white px-2 py-2 text-sm"
          >
            <option value="family">Family</option>
            <option value="staff">Staff only</option>
          </select>
          <Button
            onClick={add}
            disabled={busy || !name.trim() || !url.trim()}
            variant="outline"
            size="sm"
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
