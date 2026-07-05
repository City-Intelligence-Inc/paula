"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// R-8 hard offboarding — a typed-confirmation delete, shown ONLY to the
// super admin (the API re-checks). The caller supplies the exact phrase the
// admin must type, so a stray click can never delete a client record.

export function DangerDelete({
  entityLabel,
  confirmPhrase,
  description,
  endpoint,
  onDeleted,
  disabled,
  disabledReason,
}: {
  entityLabel: string; // e.g. "student" | "family"
  confirmPhrase: string; // e.g. the student's full name
  description: string;
  endpoint: string; // DELETE target
  onDeleted: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const fetchApi = useApi();
  const [isMaster, setIsMaster] = useState(false);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi("/api/me/is-admin")
      .then((r) => r.json())
      .then((j: { isMaster?: boolean }) => setIsMaster(!!j.isMaster))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isMaster) return null;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchApi(endpoint, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Delete failed");
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <Card className="border border-red-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-red-700">
            Offboard this {entityLabel}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500 max-w-lg">{description}</p>
        </div>
        {!open && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            disabled={disabled}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete {entityLabel}
          </Button>
        )}
      </div>
      {disabled && disabledReason && (
        <p className="mt-2 text-xs text-neutral-500">{disabledReason}</p>
      )}
      {open && !disabled && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-600">
            Type <code className="rounded bg-neutral-100 px-1.5 py-0.5">{confirmPhrase}</code> to confirm:
          </span>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            placeholder={confirmPhrase}
          />
          <Button
            size="sm"
            onClick={run}
            disabled={busy || typed.trim() !== confirmPhrase}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {busy ? "Deleting…" : "Permanently delete"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOpen(false);
              setTyped("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
