"use client";

import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/use-api";
import {
  Bell,
  CreditCard,
  Calendar,
  CheckCircle2,
  User,
  UserCheck,
  BookOpen,
  CheckCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  createdAt: string;
  kind: string;
  summary?: string;
  details?: Record<string, unknown>;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  last4?: string;
  brand?: string;
  paymentMethodId?: string;
  studentId?: string;
  studentName?: string;
  dateTime?: string;
  email?: string;
  name?: string;
  rsvp?: string;
  recipients?: string[];
  ok?: boolean;
  error?: string;
  read?: boolean;
}

const KIND_ICON: Record<string, string> = {
  "payment_method.updated": "card",
  "card.removed": "card",
  "card.default_changed": "card",
  "card.saved_changes": "card",
  "session.invite_sent": "calendar",
  "session.rsvp": "check",
  "session.logged": "calendar",
  "student.created": "student",
  "tutor.created": "tutor",
  "tutor.removed": "tutor",
  "resource.added": "book",
  "resource.removed": "book",
  "admin.added": "tutor",
  "admin.removed": "tutor",
  "family.parent_added": "student",
  "family.parent_removed": "student",
  "consultation.received": "check",
};

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// "12 minutes ago" / "yesterday" / "3 days ago" — quick at-a-glance.
function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day} days ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsPage() {
  const fetchApi = useApi();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  async function load() {
    setLoading(true);
    try {
      const r = await fetchApi("/api/admin/notifications");
      const j = await r.json();
      setItems(j.notifications || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = useMemo(
    () => items.filter((n) => n.read !== true).length,
    [items],
  );
  const visible = useMemo(
    () => (filter === "unread" ? items.filter((n) => n.read !== true) : items),
    [items, filter],
  );

  async function markRead(id: string, read: boolean) {
    // Optimistic: flip locally then post.
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read } : n)),
    );
    try {
      await fetchApi("/api/admin/notifications", {
        method: "POST",
        body: JSON.stringify({ id, read }),
      });
    } catch {
      // Revert on failure
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: !read } : n)),
      );
    }
  }

  async function markAllRead() {
    if (unreadCount === 0) return;
    setBusy(true);
    const snapshot = items;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const r = await fetchApi("/api/admin/notifications", { method: "PUT" });
      if (!r.ok) throw new Error("failed");
    } catch {
      setItems(snapshot);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
            <Bell className="h-5 w-5 text-mathitude-purple" />
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-mathitude-purple text-white text-xs font-medium px-2 h-5 min-w-[20px] font-tabular">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Recent payment-method changes, session logs, and other admin
            events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-neutral-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === "all"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === "unread"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || unreadCount === 0}
            onClick={markAllRead}
            className="border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-md text-xs"
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 skeleton" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="border border-dashed border-[color:var(--color-border-warm)] rounded-lg bg-[color:var(--color-surface-card)]/50">
          <div className="p-10 text-center">
            <p className="text-sm text-neutral-700 font-medium">
              {filter === "unread"
                ? "Inbox zero. Nice."
                : "No notifications yet."}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {filter === "unread"
                ? "Every notification has been reviewed."
                : "When a parent updates their card or you log a session, it shows up here."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2 admin-stagger">
          {visible.map((n) => {
            const isUnread = n.read !== true;
            return (
              <Card
                key={n.id}
                className={`border rounded-lg overflow-hidden transition-colors ${
                  isUnread
                    ? "border-mathitude-purple/30 bg-mathitude-purple/[0.03]"
                    : "border-[color:var(--color-border-warm)]"
                }`}
              >
                <div className="p-4 flex items-start gap-3">
                  {/* Unread dot */}
                  <div className="shrink-0 mt-1.5 w-2 flex justify-center">
                    {isUnread ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-mathitude-purple" />
                    ) : null}
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {(() => {
                      const icon = KIND_ICON[n.kind];
                      const cls = `h-4 w-4 ${
                        isUnread
                          ? "text-mathitude-purple"
                          : "text-neutral-400"
                      }`;
                      if (icon === "card") return <CreditCard className={cls} />;
                      if (icon === "calendar") return <Calendar className={cls} />;
                      if (icon === "check") return <CheckCircle2 className={cls} />;
                      if (icon === "student") return <User className={cls} />;
                      if (icon === "tutor") return <UserCheck className={cls} />;
                      if (icon === "book") return <BookOpen className={cls} />;
                      return <Bell className="h-4 w-4 text-neutral-400" />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    {n.kind === "payment_method.updated" ? (
                      <p className="text-sm text-neutral-900">
                        <span className="font-medium">{n.parentName}</span>{" "}
                        updated their payment method —{" "}
                        <span className="font-medium capitalize">{n.brand}</span>{" "}
                        ending in{" "}
                        <span className="font-tabular font-medium">{n.last4}</span>
                      </p>
                    ) : n.kind === "session.invite_sent" ? (
                      <p className="text-sm text-neutral-900">
                        Calendar invite sent for{" "}
                        <span className="font-medium">
                          {n.studentName || "(student)"}
                        </span>
                        {n.recipients && n.recipients.length > 0 ? (
                          <>
                            {" "}
                            to{" "}
                            <span className="text-neutral-600">
                              {n.recipients.length} recipient
                              {n.recipients.length === 1 ? "" : "s"}
                            </span>
                          </>
                        ) : null}
                        {n.ok === false && n.error ? (
                          <span className="ml-2 text-[color:var(--color-state-error)] text-xs">
                            (failed: {n.error})
                          </span>
                        ) : null}
                      </p>
                    ) : n.kind === "session.rsvp" ? (
                      <p className="text-sm text-neutral-900">
                        <span className="font-medium">{n.name || n.email}</span>{" "}
                        RSVPed{" "}
                        <span
                          className={
                            n.rsvp === "yes"
                              ? "font-medium text-[color:var(--color-state-success)]"
                              : n.rsvp === "no"
                                ? "font-medium text-neutral-500"
                                : "font-medium text-[color:var(--color-state-warning)]"
                          }
                        >
                          {n.rsvp?.toUpperCase()}
                        </span>{" "}
                        for session on{" "}
                        <span className="text-neutral-600">
                          {n.dateTime?.slice(0, 16)}
                        </span>
                      </p>
                    ) : n.summary ? (
                      <p className="text-sm text-neutral-900">{n.summary}</p>
                    ) : (
                      <p className="text-sm text-neutral-900 font-mono text-xs">
                        {n.kind}
                      </p>
                    )}
                    <p className="text-xs text-neutral-500 mt-1">
                      <span title={fmt(n.createdAt)}>
                        {relative(n.createdAt)}
                      </span>
                      {n.parentEmail ? ` · ${n.parentEmail}` : ""}
                      {n.email && !n.parentEmail ? ` · ${n.email}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => markRead(n.id, isUnread)}
                    className="shrink-0 text-xs text-neutral-500 hover:text-mathitude-purple transition-colors"
                    title={isUnread ? "Mark as read" : "Mark as unread"}
                  >
                    {isUnread ? "Mark read" : "Mark unread"}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
