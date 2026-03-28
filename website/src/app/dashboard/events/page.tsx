"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Megaphone } from "lucide-react";
import type { MathitudeEvent } from "@/lib/types";

const typeStyles = {
  festival: { badge: "bg-mathitude-teal/10 text-mathitude-teal border-mathitude-teal/20", label: "Festival" },
  workshop: { badge: "bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20", label: "Workshop" },
  announcement: { badge: "bg-mathitude-teal/10 text-mathitude-teal border-mathitude-teal/20", label: "News" },
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
          <h1 className="text-3xl font-serif font-bold text-mathitude-navy">
            Events & News
          </h1>
          <p className="mt-2 text-gray-600">
            Upcoming math festivals, workshops, and Mathitude announcements.
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-mathitude-teal border-t-transparent" />
        </div>
      </div>
    );
  }

  const featured = events.filter((e) => e.featured);
  const upcoming = events.filter((e) => !e.featured);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-mathitude-navy">
          Events & News
        </h1>
        <p className="mt-2 text-gray-600">
          Upcoming math festivals, workshops, and Mathitude announcements.
        </p>
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No events yet. Check back soon!</p>
        </div>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-mathitude-navy mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-mathitude-teal" />
            Featured
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {featured.map((event) => (
              <Card
                key={event.id}
                className="border-2 border-mathitude-teal/20 shadow-sm bg-mathitude-light/50"
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
                      className="bg-mathitude-teal/10 text-mathitude-teal border-mathitude-teal/20"
                    >
                      Featured
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-mathitude-navy">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {event.description}
                  </p>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {event.date}
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {event.time}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
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
          <h2 className="text-lg font-semibold text-mathitude-navy mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-mathitude-teal" />
            Upcoming
          </h2>
          <div className="grid gap-4">
            {upcoming.map((event) => (
              <Card
                key={event.id}
                className="border border-gray-100 shadow-sm"
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
                      <h3 className="font-semibold text-mathitude-navy">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {event.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {event.date}
                        </span>
                        {event.time && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-500">
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
