"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { SchoolLogin } from "@/lib/types";

const inputClass =
  "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300";

// Client-only id for freshly-added rows; the server re-stamps real ids on save.
let _seq = 0;
function draftId() {
  _seq += 1;
  return `draft_${_seq}`;
}

function blank(): SchoolLogin {
  return {
    id: draftId(),
    portal: "",
    url: "",
    username: "",
    password: "",
    notes: "",
    updatedAt: "",
  };
}

export function SchoolLoginsPanel({ studentId }: { studentId: string }) {
  const fetchApi = useApi();
  const [rows, setRows] = useState<SchoolLogin[]>([]);
  const [baseline, setBaseline] = useState<string>("[]");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/students/${studentId}/credentials`);
      if (!res.ok) throw new Error(`(${res.status})`);
      const json = await res.json();
      const creds: SchoolLogin[] = json.credentials || [];
      setRows(creds);
      setBaseline(JSON.stringify(creds));
    } catch (e) {
      setError(`Couldn't load credentials ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = JSON.stringify(rows) !== baseline;

  function update(id: string, patch: Partial<SchoolLogin>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function copy(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {
      // clipboard blocked — no-op
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetchApi(`/api/students/${studentId}/credentials`, {
        method: "PUT",
        body: JSON.stringify({ credentials: rows }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `(${res.status})`);
      }
      const json = await res.json();
      const creds: SchoolLogin[] = json.credentials || [];
      setRows(creds);
      setBaseline(JSON.stringify(creds));
    } catch (e) {
      setError(`Save failed ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border border-neutral-200 rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-5 w-5 text-neutral-400" />
          <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
            School portal logins
          </h2>
          <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 bg-neutral-100 border border-neutral-200 rounded-full px-2 py-0.5">
            <Lock className="h-3 w-3" />
            Admin only
          </span>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          &quot;Ghost-student&quot; access — sign in to the student&apos;s school
          accounts to track assignments and communications. Visible only to
          admins; never shown to tutors or parents.
        </p>

        {error && (
          <div className="mb-4 text-sm text-[#B0263C] bg-[#B0263C]/5 border border-[#B0263C]/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-neutral-400">
            <p className="text-sm">Loading…</p>
          </div>
        ) : (
          <>
            {rows.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 border border-dashed border-neutral-200 rounded-md">
                <p className="text-sm">No school logins stored yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((r) => {
                  const shown = !!reveal[r.id];
                  return (
                    <div
                      key={r.id}
                      className="border border-neutral-200 rounded-md p-4 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">
                            Portal / platform
                          </label>
                          <input
                            className={inputClass}
                            placeholder="Clever, Google Classroom, Big Ideas…"
                            value={r.portal}
                            onChange={(e) =>
                              update(r.id, { portal: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">
                            Login URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              className={inputClass}
                              placeholder="https://…"
                              value={r.url || ""}
                              onChange={(e) =>
                                update(r.id, { url: e.target.value })
                              }
                            />
                            {r.url && (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-300"
                                title="Open portal"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">
                            Username
                          </label>
                          <div className="flex gap-2">
                            <input
                              className={inputClass}
                              placeholder="student@school.org"
                              value={r.username}
                              onChange={(e) =>
                                update(r.id, { username: e.target.value })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => copy(`${r.id}-u`, r.username)}
                              className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-300"
                              title="Copy username"
                            >
                              {copied === `${r.id}-u` ? (
                                <Check className="h-4 w-4 text-[#0F7B6C]" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">
                            Password
                          </label>
                          <div className="flex gap-2">
                            <input
                              className={`${inputClass} font-mono`}
                              type={shown ? "text" : "password"}
                              placeholder="••••••••"
                              value={r.password}
                              onChange={(e) =>
                                update(r.id, { password: e.target.value })
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setReveal((p) => ({ ...p, [r.id]: !shown }))
                              }
                              className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-300"
                              title={shown ? "Hide" : "Reveal"}
                            >
                              {shown ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => copy(`${r.id}-p`, r.password)}
                              className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-300"
                              title="Copy password"
                            >
                              {copied === `${r.id}-p` ? (
                                <Check className="h-4 w-4 text-[#0F7B6C]" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">
                          Notes
                        </label>
                        <input
                          className={inputClass}
                          placeholder="Security question answers, PIN, etc."
                          value={r.notes || ""}
                          onChange={(e) =>
                            update(r.id, { notes: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-neutral-400">
                          {r.updatedAt
                            ? `Updated ${new Date(r.updatedAt).toLocaleDateString()}`
                            : "Not saved yet"}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(r.id)}
                          className="inline-flex items-center gap-1 text-xs text-[#B0263C] hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRows((prev) => [...prev, blank()])}
                className="rounded-md border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add login
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-end gap-3">
              {dirty && (
                <span className="text-xs text-[#B8851A]">Unsaved changes</span>
              )}
              <Button
                type="button"
                onClick={save}
                disabled={saving || !dirty}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
