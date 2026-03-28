"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Megaphone, Newspaper } from "lucide-react";
import type { MathitudeEvent } from "@/lib/types";

const typeStyles = {
  festival: { badge: "bg-neutral-900/5 text-neutral-900 border-neutral-200", label: "Festival" },
  workshop: { badge: "bg-neutral-100 text-neutral-600 border-neutral-200", label: "Workshop" },
  announcement: { badge: "bg-neutral-100 text-neutral-600 border-neutral-200", label: "News" },
};

export default function EventsPage() {
  const [events, setEvents] = useState<MathitudeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/events")
      .then((res) => res.json())
      .then((json) => {
        setEvents(json.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-serif italic font-medium text-neutral-900 tracking-tight">
            Events & News
          </h1>
          <p className="mt-2 text-neutral-600">
            Upcoming math festivals, workshops, and Mathitude announcements.
          </p>
        </div>
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
      <div className="mb-8">
        <h1 className="text-3xl font-serif italic font-medium text-neutral-900 tracking-tight">
          Events & News
        </h1>
        <p className="mt-2 text-neutral-600">
          Upcoming math festivals, workshops, and Mathitude announcements.
        </p>
      </div>

      {events.length === 0 && (
        <div className="text-center py-16">
          <Newspaper className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-900 font-medium">No upcoming events yet</p>
          <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
            When Paula announces math festivals, workshops, or other events, they&apos;ll appear here. Check back soon!
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
