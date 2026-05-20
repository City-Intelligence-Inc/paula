"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Bell, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Notification {
  id: string;
  createdAt: string;
  kind: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  last4?: string;
  brand?: string;
  paymentMethodId?: string;
  read?: boolean;
}

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

export default function NotificationsPage() {
  const fetchApi = useApi();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/api/admin/notifications")
      .then((r) => r.json())
      .then((j) => {
        setItems(j.notifications || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchApi]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#7030A0]" />
          Notifications
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Recent payment-method changes and other admin events.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="p-10 text-center text-sm text-neutral-500">
            No notifications yet. When a parent updates their card, you&apos;ll
            see the last 4 digits here.
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card
              key={n.id}
              className="border border-neutral-200 rounded-lg overflow-hidden"
            >
              <div className="p-4 flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {n.kind === "payment_method.updated" ? (
                    <CreditCard className="h-4 w-4 text-[#7030A0]" />
                  ) : (
                    <Bell className="h-4 w-4 text-neutral-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {n.kind === "payment_method.updated" ? (
                    <p className="text-sm text-neutral-900">
                      <span className="font-medium">{n.parentName}</span>{" "}
                      updated their payment method —{" "}
                      <span className="font-medium capitalize">{n.brand}</span>{" "}
                      ending in{" "}
                      <span className="font-mono font-medium">{n.last4}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-900 font-mono text-xs">
                      {n.kind}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">
                    {fmt(n.createdAt)}
                    {n.parentEmail ? ` · ${n.parentEmail}` : ""}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
