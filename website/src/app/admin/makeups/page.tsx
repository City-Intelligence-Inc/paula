"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

interface SessionRow {
  studentId: string;
  dateTime: string;
  date: string;
  time: string;
  status: string;
  offering?: string;
  duration?: number;
}

interface Credit {
  studentId: string;
  studentName: string;
  originalDateTime: string;
  date: string;
  time: string;
  offering: string;
  duration: number;
  tutorId: string | null;
  noticeDays: number | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  reason: string | null;
  makeupStatus: string;
  makeupSessionDateTime: string | null;
}

interface MakeupsData {
  policyDays: number;
  counts: { available: number; scheduled: number; forfeited: number };
  available: Credit[];
  scheduled: Credit[];
  forfeited: Credit[];
}

function fmt(dt: string): string {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MakeupsPage() {
  const fetchApi = useApi();
  const [policyDays, setPolicyDays] = useState(30);
  const [students, setStudents] = useState<Map<string, string>>(new Map());
  const [upcoming, setUpcoming] = useState<SessionRow[]>([]);
  const [data, setData] = useState<MakeupsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, stRes, mRes] = await Promise.all([
        fetchApi("/api/sessions"),
        fetchApi("/api/students"),
        fetchApi("/api/admin/makeups"),
      ]);
      const [sJson, stJson, mJson] = await Promise.all([
        sRes.json(),
        stRes.json(),
        mRes.json(),
      ]);
      if (!mRes.ok) throw new Error(mJson.error || "Failed to load makeups");

      const nameMap = new Map<string, string>();
      for (const st of stJson.students || []) {
        const name = `${st.firstName || ""} ${st.lastName || ""}`.trim();
        nameMap.set(st.id, name || st.id);
      }
      setStudents(nameMap);

      const nowIso = new Date().toISOString();
      const up = ((sJson.sessions || []) as SessionRow[])
        .filter((s) => s.status === "scheduled" && s.dateTime >= nowIso)
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
      setUpcoming(up);

      setData(mJson);
      setPolicyDays(mJson.policyDays || 30);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Makeup Sessions
          </h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
            Cancel a session with notice and the system records how many days
            ahead it was. <strong>{policyDays}+ days</strong> earns a makeup
            credit you can reschedule for free; less than that is forfeited.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div className="flex flex-wrap gap-2 text-sm">
          <Stat label="Available credits" value={data.counts.available} tone="good" />
          <Stat label="Makeups scheduled" value={data.counts.scheduled} tone="info" />
          <Stat label="Forfeited" value={data.counts.forfeited} tone="muted" />
        </div>
      )}

      {/* Available credits */}
      <Section title="Available makeup credits" desc="Eligible cancellations waiting to be rescheduled.">
        {data && data.available.length > 0 ? (
          <div className="space-y-3">
            {data.available.map((credit) => (
              <CreditCard
                key={`${credit.studentId}:${credit.originalDateTime}`}
                credit={credit}
                policyDays={policyDays}
                onScheduled={load}
              />
            ))}
          </div>
        ) : (
          <Empty>No makeup credits waiting.</Empty>
        )}
      </Section>

      {/* Upcoming sessions → cancel */}
      <Section title="Upcoming sessions" desc="Cancel a scheduled session and see whether it earns a credit.">
        {loading ? (
          <Empty>Loading…</Empty>
        ) : upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map((s) => (
              <UpcomingRow
                key={`${s.studentId}:${s.dateTime}`}
                session={s}
                studentName={students.get(s.studentId) || s.studentId}
                policyDays={policyDays}
                onCancelled={load}
              />
            ))}
          </div>
        ) : (
          <Empty>No upcoming scheduled sessions.</Empty>
        )}
      </Section>

      {/* History */}
      {data && (data.scheduled.length > 0 || data.forfeited.length > 0) && (
        <Section title="History" desc="Scheduled makeups and forfeited cancellations.">
          <div className="space-y-2">
            {data.scheduled.map((c) => (
              <div
                key={`sch:${c.studentId}:${c.originalDateTime}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-neutral-200 px-4 py-3 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-sky-500" />
                <span className="font-medium text-neutral-900">{c.studentName}</span>
                <span className="text-neutral-500">
                  {c.noticeDays}d notice · orig {fmt(c.date + "T" + c.time + ":00")}
                </span>
                <span className="ml-auto text-neutral-700">
                  Makeup → {c.makeupSessionDateTime ? fmt(c.makeupSessionDateTime) : "—"}
                </span>
              </div>
            ))}
            {data.forfeited.map((c) => (
              <div
                key={`fft:${c.studentId}:${c.originalDateTime}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
              >
                <XCircle className="h-4 w-4 text-neutral-400" />
                <span className="font-medium text-neutral-900">{c.studentName}</span>
                <span className="text-neutral-500">
                  {c.noticeDays}d notice · session {fmt(c.date + "T" + c.time + ":00")}
                </span>
                <span className="ml-auto rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  Forfeited (under {policyDays}d)
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "good" | "info" | "muted" }) {
  const styles = {
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    muted: "bg-neutral-50 text-neutral-600 border-neutral-200",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium", styles)}>
      <span className="tabular-nums">{value}</span>
      {label}
    </span>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
      <p className="mt-0.5 text-xs text-neutral-400">{desc}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-400">
      {children}
    </div>
  );
}

function UpcomingRow({
  session,
  studentName,
  policyDays,
  onCancelled,
}: {
  session: SessionRow;
  studentName: string;
  policyDays: number;
  onCancelled: () => void;
}) {
  const fetchApi = useApi();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [byParent, setByParent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Live preview of eligibility (whole days from now to the session).
  const previewDays = useMemo(() => {
    const ms = new Date(session.dateTime).getTime() - Date.now();
    return Math.floor(ms / (24 * 60 * 60 * 1000));
  }, [session.dateTime]);
  const wouldEarn = previewDays >= policyDays;

  async function cancel() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetchApi(
        `/api/sessions/${encodeURIComponent(session.studentId)}/${encodeURIComponent(session.dateTime)}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({
            reason: reason.trim() || undefined,
            cancelledBy: byParent ? "parent" : undefined,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Cancel failed");
      setResult(
        json.makeupEligible
          ? `Makeup credit earned — ${json.noticeDays} days notice.`
          : `Forfeited — only ${json.noticeDays} days notice (policy is ${json.policyDays}).`,
      );
      setTimeout(onCancelled, 900);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {result}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
        <CalendarClock className="h-4 w-4 text-neutral-400" />
        <span className="font-medium text-neutral-900">{studentName}</span>
        <span className="text-neutral-500">{fmt(session.dateTime)}</span>
        <span className="text-xs text-neutral-400 capitalize">
          {session.offering || "tutoring"}
        </span>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
            wouldEarn
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700",
          )}
        >
          {previewDays}d out · {wouldEarn ? "would earn credit" : "would forfeit"}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          {open ? "Close" : "Cancel…"}
        </button>
      </div>
      {open && (
        <div className="space-y-3 border-t border-neutral-100 px-4 py-3">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-[#7030A0] focus:outline-none"
          />
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={byParent}
              onChange={(e) => setByParent(e.target.checked)}
            />
            Cancelled by parent
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="rounded-md bg-[#7030A0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5d288a] disabled:opacity-50"
          >
            {busy ? "Cancelling…" : "Confirm cancellation"}
          </button>
        </div>
      )}
    </div>
  );
}

function CreditCard({
  credit,
  policyDays,
  onScheduled,
}: {
  credit: Credit;
  policyDays: number;
  onScheduled: () => void;
}) {
  const fetchApi = useApi();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function schedule() {
    if (!date || !time) {
      setErr("Pick a date and time.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetchApi("/api/sessions/makeup", {
        method: "POST",
        body: JSON.stringify({
          studentId: credit.studentId,
          originalDateTime: credit.originalDateTime,
          date,
          time,
          duration: credit.duration,
          tutorId: credit.tutorId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Schedule failed");
      onScheduled();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Schedule failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span className="font-medium text-neutral-900">{credit.studentName}</span>
        <span className="text-neutral-500">
          original {fmt(credit.originalDateTime)}
        </span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          {credit.noticeDays}d notice (≥{policyDays})
        </span>
        {credit.reason && (
          <span className="text-xs text-neutral-400">· {credit.reason}</span>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="ml-auto rounded-md bg-[#7030A0] px-3 py-1 text-xs font-semibold text-white hover:bg-[#5d288a]"
        >
          {open ? "Close" : "Schedule makeup"}
        </button>
      </div>
      {open && (
        <div className="flex flex-wrap items-end gap-3 border-t border-emerald-100 px-4 py-3">
          <div>
            <label className="block text-xs text-neutral-500">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-[#7030A0] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-[#7030A0] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={schedule}
            disabled={busy}
            className="rounded-md bg-[#7030A0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5d288a] disabled:opacity-50"
          >
            {busy ? "Scheduling…" : "Create makeup (no charge)"}
          </button>
          {err && <p className="w-full text-sm text-red-600">{err}</p>}
        </div>
      )}
    </div>
  );
}
