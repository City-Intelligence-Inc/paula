"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Home,
  GraduationCap,
  CalendarPlus,
  KeyRound,
  Pencil,
  Database,
  Check,
  Loader2,
  Play,
  Trash2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// Guided Demo runner — built for demoing the portal to Paula.
//
// Each "process" animates its complete end-to-end steps and, where marked,
// makes a REAL API call that writes to DynamoDB. So the demo isn't a mockup:
// a family, a sibling, a session, school logins, and a profile edit actually
// land in the database, and the View links open the real records. Created
// rows are clearly labelled "DEMO …" and a Clean up button deactivates them.

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type StepState = "pending" | "running" | "done" | "error";

interface Step {
  label: string;
  // Steps that hit the database are badged so Paula can see the real writes.
  write?: boolean;
  // Returns a short result string shown next to the step. Throwing marks error.
  run: () => Promise<string | void>;
}

interface UiStep {
  label: string;
  write: boolean;
  state: StepState;
  detail?: string;
}

interface Process {
  id: string;
  title: string;
  desc: string;
  Icon: typeof Home;
  buildSteps: () => Step[];
  // Where to view the result after running.
  resultHref?: () => string | null;
  resultLabel?: string;
}

// Shared state across processes for one demo run (the family/student created
// in process 1 is reused by 2–5, exactly like real usage).
interface DemoState {
  familyId?: string;
  studentId?: string;
  studentName?: string;
  siblingId?: string;
  tag: string; // unique suffix so repeated runs don't collide
}

export default function GuidedDemoPage() {
  const fetchApi = useApi();
  const [steps, setSteps] = useState<Record<string, UiStep[]>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [cleaning, setCleaning] = useState(false);
  const [cleanMsg, setCleanMsg] = useState<string | null>(null);
  const demo = useRef<DemoState>({ tag: "" });

  const post = useCallback(
    async (path: string, body: unknown) => {
      const res = await fetchApi(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      return json;
    },
    [fetchApi],
  );

  const put = useCallback(
    async (path: string, body: unknown) => {
      const res = await fetchApi(path, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      return json;
    },
    [fetchApi],
  );

  // ---- Process definitions -------------------------------------------------
  const PROCESSES: Process[] = [
    {
      id: "create-family",
      title: "1 · Create a family",
      desc: "New household with the first parent and first student, linked automatically.",
      Icon: Home,
      resultHref: () =>
        demo.current.familyId ? `/admin/families/${demo.current.familyId}` : null,
      resultLabel: "View the family",
      buildSteps: () => {
        const tag = `${Date.now().toString().slice(-5)}`;
        demo.current = { tag };
        return [
          {
            label: "Capture parent details — Priya Sharma (DEMO)",
            run: async () => "priya.sharma.demo@example.com",
          },
          {
            label: "Capture first student — Aanya Sharma, Grade 5",
            run: async () => "Grade 5 · individual · $90",
          },
          {
            label: "Create household + parent + student in DynamoDB",
            write: true,
            run: async () => {
              const json = await post("/api/students", {
                firstName: "Aanya",
                lastName: `Sharma DEMO ${tag}`,
                grade: "5",
                status: "active",
                parentName: `Priya Sharma DEMO ${tag}`,
                parentEmail: `priya.${tag}@example.com`,
                parentPhone: "650-555-0142",
                sessionType: "individual",
                rate: 90,
              });
              demo.current.studentId = json.student?.id;
              demo.current.familyId = json.student?.familyId;
              demo.current.studentName = "Aanya Sharma";
              return `family ${json.student?.familyId}`;
            },
          },
          {
            label: "Family is now live — parent, student, and billing linked",
            run: async () => "ready to bill",
          },
        ];
      },
    },
    {
      id: "add-sibling",
      title: "2 · Add a sibling",
      desc: "Add a second child months later — reuses the same household and saved card.",
      Icon: GraduationCap,
      resultHref: () =>
        demo.current.familyId ? `/admin/families/${demo.current.familyId}` : null,
      resultLabel: "View the family",
      buildSteps: () => [
        {
          label: "Open the existing Sharma family",
          run: async () => {
            if (!demo.current.familyId)
              throw new Error("Run step 1 first to create the family.");
            return demo.current.familyId;
          },
        },
        {
          label: "Capture second student — Rohan Sharma, Grade 2",
          run: async () => "Grade 2 · individual · $90",
        },
        {
          label: "Add sibling to the same family in DynamoDB (no re-entering the card)",
          write: true,
          run: async () => {
            const json = await post("/api/students", {
              firstName: "Rohan",
              lastName: `Sharma DEMO ${demo.current.tag}`,
              grade: "2",
              status: "active",
              familyId: demo.current.familyId,
              sessionType: "individual",
              rate: 90,
            });
            demo.current.siblingId = json.student?.id;
            return `student ${json.student?.id}`;
          },
        },
      ],
    },
    {
      id: "log-session",
      title: "3 · Log a tutoring session",
      desc: "Record a completed session so it flows into the billing queue.",
      Icon: CalendarPlus,
      resultHref: () => "/admin/billing",
      resultLabel: "Open the billing queue",
      buildSteps: () => [
        {
          label: "Pick the student — Aanya Sharma",
          run: async () => {
            if (!demo.current.studentId)
              throw new Error("Run step 1 first to create the student.");
            return demo.current.studentName || demo.current.studentId;
          },
        },
        {
          label: "Set today's date, 60 minutes, marked completed",
          run: async () => "60 min · completed",
        },
        {
          label: "Write the session to DynamoDB",
          write: true,
          run: async () => {
            const d = new Date();
            const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            await post("/api/sessions", {
              studentId: demo.current.studentId,
              date,
              time: "16:00",
              duration: 60,
              type: "individual",
              status: "completed",
              notes: "DEMO session — factoring practice, went well.",
            });
            return `session on ${date}`;
          },
        },
        {
          label: "Session now waiting in the billing queue",
          run: async () => "ready to approve & charge",
        },
      ],
    },
    {
      id: "school-logins",
      title: "4 · Store school logins",
      desc: "Save the student's school portal credentials securely (admin-only).",
      Icon: KeyRound,
      resultHref: () =>
        demo.current.studentId
          ? `/admin/students/${demo.current.studentId}`
          : null,
      resultLabel: "View the student",
      buildSteps: () => [
        {
          label: "Open Aanya's student record",
          run: async () => {
            if (!demo.current.studentId)
              throw new Error("Run step 1 first to create the student.");
            return demo.current.studentId;
          },
        },
        {
          label: "Enter the Clever portal login (ghost-student access)",
          run: async () => "clever.com · aanya.s",
        },
        {
          label: "Save credentials to DynamoDB (encrypted at rest, admin-only)",
          write: true,
          run: async () => {
            await put(`/api/students/${demo.current.studentId}/credentials`, {
              credentials: [
                {
                  portal: "Clever",
                  url: "https://clever.com",
                  username: "aanya.sharma",
                  password: "DemoPass!23",
                  notes: "DEMO — district SSO",
                },
              ],
            });
            return "1 login stored";
          },
        },
      ],
    },
    {
      id: "update-student",
      title: "5 · Update the student",
      desc: "Edit the profile — promote a grade and bump the default rate.",
      Icon: Pencil,
      resultHref: () =>
        demo.current.studentId
          ? `/admin/students/${demo.current.studentId}`
          : null,
      resultLabel: "View the student",
      buildSteps: () => [
        {
          label: "Open Aanya's student record",
          run: async () => {
            if (!demo.current.studentId)
              throw new Error("Run step 1 first to create the student.");
            return demo.current.studentId;
          },
        },
        {
          label: "Promote to Grade 6 and set the rate to $100",
          run: async () => "Grade 6 · $100",
        },
        {
          label: "Save the edit to DynamoDB",
          write: true,
          run: async () => {
            await put(`/api/students/${demo.current.studentId}`, {
              grade: "6",
              rate: 100,
            });
            return "profile updated";
          },
        },
      ],
    },
  ];

  // ---- Runner --------------------------------------------------------------
  const runProcess = useCallback(
    async (proc: Process): Promise<boolean> => {
      const built = proc.buildSteps();
      setSteps((s) => ({
        ...s,
        [proc.id]: built.map((b) => ({
          label: b.label,
          write: !!b.write,
          state: "pending" as StepState,
        })),
      }));
      setRunning(proc.id);
      await wait(300);
      let ok = true;
      for (let i = 0; i < built.length; i++) {
        setSteps((s) => ({
          ...s,
          [proc.id]: s[proc.id].map((u, idx) =>
            idx === i ? { ...u, state: "running" } : u,
          ),
        }));
        await wait(550);
        try {
          const detail = await built[i].run();
          setSteps((s) => ({
            ...s,
            [proc.id]: s[proc.id].map((u, idx) =>
              idx === i
                ? { ...u, state: "done", detail: detail || undefined }
                : u,
            ),
          }));
        } catch (err) {
          ok = false;
          setSteps((s) => ({
            ...s,
            [proc.id]: s[proc.id].map((u, idx) =>
              idx === i
                ? { ...u, state: "error", detail: String((err as Error).message) }
                : u,
            ),
          }));
          break;
        }
        await wait(250);
      }
      setRunning(null);
      if (ok) setDoneIds((d) => new Set(d).add(proc.id));
      return ok;
    },
    [],
  );

  const runAll = useCallback(async () => {
    setCleanMsg(null);
    for (const proc of PROCESSES) {
      const ok = await runProcess(proc);
      if (!ok) break;
      await wait(450);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runProcess]);

  const cleanup = useCallback(async () => {
    const ids = [demo.current.studentId, demo.current.siblingId].filter(
      Boolean,
    ) as string[];
    if (ids.length === 0) {
      setCleanMsg("Nothing to clean up yet — run the demo first.");
      return;
    }
    setCleaning(true);
    setCleanMsg(null);
    try {
      for (const id of ids) {
        await put(`/api/students/${id}`, { status: "inactive" });
      }
      setCleanMsg(
        `Deactivated ${ids.length} demo student${ids.length > 1 ? "s" : ""}. The records remain in the DB marked inactive.`,
      );
    } catch (err) {
      setCleanMsg(`Cleanup failed: ${String((err as Error).message)}`);
    } finally {
      setCleaning(false);
    }
  }, [put]);

  const busy = running !== null || cleaning;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-mathitude-purple">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Guided demo
          </span>
        </div>
        <h1
          className="mt-2 text-3xl text-neutral-900"
          style={{ fontFamily: "var(--font-original-surfer)" }}
        >
          Watch the portal work, end to end
        </h1>
        <p className="mt-2 text-sm text-neutral-600 max-w-2xl leading-relaxed">
          Five real processes, animated step by step. Steps marked{" "}
          <span className="inline-flex items-center gap-1 align-middle rounded bg-mathitude-purple/10 text-mathitude-purple text-[11px] font-medium px-1.5 py-0.5">
            <Database className="h-3 w-3" />
            DB write
          </span>{" "}
          actually create records in the database — the View links open the
          real thing. Demo data is labelled “DEMO …”.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            onClick={runAll}
            disabled={busy}
            className="bg-mathitude-purple text-white hover:bg-[#5d288a] rounded-md uppercase tracking-wide"
          >
            <Play className="h-4 w-4" />
            {running ? "Running…" : "Run all 5 processes"}
          </Button>
          <Button
            onClick={cleanup}
            disabled={busy}
            variant="outline"
            className="rounded-md border-neutral-300 text-neutral-700 hover:bg-neutral-50"
          >
            <Trash2 className="h-4 w-4" />
            {cleaning ? "Cleaning…" : "Clean up demo data"}
          </Button>
          {cleanMsg && (
            <span className="text-sm text-neutral-500">{cleanMsg}</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {PROCESSES.map((proc) => {
          const uiSteps = steps[proc.id];
          const isDone = doneIds.has(proc.id);
          const href = isDone ? proc.resultHref?.() : null;
          return (
            <Card
              key={proc.id}
              className="border border-neutral-200 rounded-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-mathitude-purple/10 text-mathitude-purple shrink-0">
                      <proc.Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">
                        {proc.title}
                      </h2>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        {proc.desc}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => runProcess(proc)}
                    disabled={busy}
                    variant="outline"
                    className="rounded-md border-neutral-300 text-neutral-700 hover:bg-neutral-50 shrink-0"
                  >
                    {running === proc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Run
                  </Button>
                </div>

                {uiSteps && (
                  <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
                    {uiSteps.map((u, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <span className="shrink-0">
                          {u.state === "done" ? (
                            <Check className="h-4 w-4 text-[#0F7B6C]" />
                          ) : u.state === "running" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-mathitude-purple" />
                          ) : u.state === "error" ? (
                            <span className="text-[#B0263C] font-bold">×</span>
                          ) : (
                            <span className="block h-4 w-4 rounded-full border border-neutral-300" />
                          )}
                        </span>
                        <span
                          className={
                            u.state === "pending"
                              ? "text-neutral-400"
                              : u.state === "error"
                                ? "text-[#B0263C]"
                                : "text-neutral-800"
                          }
                        >
                          {u.label}
                        </span>
                        {u.write && (
                          <span className="inline-flex items-center gap-1 rounded bg-mathitude-purple/10 text-mathitude-purple text-[10px] font-medium px-1.5 py-0.5">
                            <Database className="h-2.5 w-2.5" />
                            DB write
                          </span>
                        )}
                        {u.detail && (
                          <span className="text-xs text-neutral-400 truncate">
                            — {u.detail}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {href && (
                  <div className="mt-4">
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1 text-sm font-medium text-mathitude-purple hover:text-[#5d288a]"
                    >
                      {proc.resultLabel || "View"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
