"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Megaphone, Newspaper } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import type { MathitudeEvent } from "@/lib/types";

const EVENTS_TITLE = "Events & News";
const EVENTS_DESC = "Upcoming math festivals, workshops, and Mathitude announcements.";

const typeStyles = {
  festival: { badge: "bg-neutral-900/5 text-neutral-900 border-neutral-200", label: "Festival" },
  workshop: { badge: "bg-neutral-100 text-neutral-600 border-neutral-200", label: "Workshop" },
  announcement: { badge: "bg-neutral-100 text-neutral-600 border-neutral-200", label: "News" },
};

export default function EventsPage() {
  const [events, setEvents] = useState<MathitudeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchApi = useApi();

  useEffect(() => {
    console.log("[events] NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL || "(empty)");
    fetchApi("/api/events")
      .then(async (res) => {
        console.log("[events] status:", res.status, "url:", res.url);
        const ct = res.headers.get("content-type");
        if (!res.ok || !ct?.includes("application/json")) {
          const body = await res.text();
          console.error("[events] bad response:", body.slice(0, 300));
          throw new Error(`API ${res.status} — ${ct?.includes("html") ? "got HTML (check NEXT_PUBLIC_API_URL)" : res.statusText}`);
        }
        return res.json();
      })
      .then((json) => {
        console.log("[events] got", json.events?.length ?? 0, "events");
        setEvents(json.events || []);
      })
      .catch((err) => {
        console.error("[events] failed:", err);
        setError(err.message || "Failed to load events");
      })
      .finally(() => setLoading(false));
  }, [fetchApi]);

  if (loading) {
    return (
      <div>
        <PageHeader title={EVENTS_TITLE} description={EVENTS_DESC} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      </div>
    );
  }

  const featured = events.filter((e) => e.featured);
  const upcoming = events.filter((e) => !e.featured);

  return (
    <div>
      <PageHeader title={EVENTS_TITLE} description={EVENTS_DESC} />

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 mb-6">
          <p className="text-sm font-medium text-red-700">Couldn&apos;t load events</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
          <p className="text-xs text-neutral-500 mt-2">Check browser console for details.</p>
        </div>
      )}

      {!error && events.length === 0 && (
        <div className="text-center py-16">
          <Newspaper className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-900 font-medium">No upcoming events yet</p>
          <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
            When Mathitude announces math festivals, workshops, or other events, they&apos;ll appear here. Check back soon!
          </p>
        </div>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-neutral-400" />
            Featured
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {featured.map((event) => (
              <Card
                key={event.id}
                className="border border-neutral-200 rounded-lg bg-white hover:shadow-sm transition-shadow"
              >
                <CardContent className="pt-5 pb-5 px-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className={typeStyles[event.type].badge}
                    >
                      {typeStyles[event.type].label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-neutral-900 text-white border-neutral-900"
                    >
                      Featured
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    {event.description}
                  </p>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {event.date}
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Clock className="w-3.5 h-3.5" />
                        {event.time}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neutral-400" />
            Upcoming
          </h2>
          <div className="grid gap-4">
            {upcoming.map((event) => (
              <Card
                key={event.id}
                className="border border-neutral-200 rounded-lg bg-white hover:shadow-sm transition-shadow"
              >
                <CardContent className="pt-5 pb-5 px-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={typeStyles[event.type].badge}
                        >
                          {typeStyles[event.type].label}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-neutral-900">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-600">
                        {event.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Calendar className="w-3 h-3" />
                          {event.date}
                        </span>
                        {event.time && (
                          <span className="flex items-center gap-1 text-xs text-neutral-500">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
