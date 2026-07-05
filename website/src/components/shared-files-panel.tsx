"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Trash2, UploadCloud } from "lucide-react";
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
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

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

  // F-1: drag-and-drop (or picked) files go straight to S3 via a presigned
  // URL, then register as a shared-file entry — which also notifies the team.
  async function upload(list: FileList | File[]) {
    const file = Array.from(list)[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setUploading(file.name);
    try {
      const pre = await fetchApi("/api/files/presign", {
        method: "POST",
        body: JSON.stringify({
          studentId,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });
      const preJ = await pre.json();
      if (!pre.ok) throw new Error(preJ.error || "Upload not available");
      const put = await fetch(preJ.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": preJ.contentType },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      const reg = await fetchApi(`/api/students/${studentId}/files`, {
        method: "POST",
        body: JSON.stringify({ name: file.name, url: preJ.s3Url, audience }),
      });
      const regJ = await reg.json();
      if (!reg.ok) throw new Error(regJ.error || "Could not register file");
      setFiles(regJ.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(null);
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
                  href={
                    f.url.startsWith("s3://")
                      ? `/api/files/object?sid=${encodeURIComponent(studentId)}&fid=${encodeURIComponent(f.id)}`
                      : f.url
                  }
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
        {/* F-1: drag-and-drop straight into AWS storage */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
          }}
          className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-sm cursor-pointer transition-colors ${
            dragOver
              ? "border-[#7030A0] bg-[#7030A0]/5 text-[#7030A0]"
              : "border-neutral-200 text-neutral-400 hover:border-neutral-300"
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          {uploading
            ? `Uploading ${uploading}…`
            : "Drop a file here or click to upload"}
          <input
            type="file"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              if (e.target.files?.length) upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

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
