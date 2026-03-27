import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Megaphone } from "lucide-react";

interface Event {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: "festival" | "workshop" | "announcement";
  featured?: boolean;
}

const events: Event[] = [
  {
    title: "Bay Area Math Festival 2026",
    date: "April 12, 2026",
    time: "10:00 AM - 4:00 PM",
    location: "San Francisco, CA",
    description:
      "Join Paula and the Mathitude team at the Bay Area Math Festival! Featuring the interactive Pascal's Triangle exhibit, live puzzles, and hands-on activities for all ages.",
    type: "festival",
    featured: true,
  },
  {
    title: "Summer Math Enrichment Registration Open",
    date: "Starting June 2026",
    time: "Various times",
    location: "Virtual & In-Person",
    description:
      "Registration is now open for Mathitude's summer enrichment program. Small group sessions available for elementary and middle school students.",
    type: "announcement",
    featured: true,
  },
  {
    title: "Pascal's Triangle Workshop",
    date: "May 3, 2026",
    time: "2:00 PM - 4:00 PM",
    location: "Virtual (Zoom)",
    description:
      "A hands-on workshop exploring the beautiful patterns in Pascal's Triangle. Perfect for students grades 3-8.",
    type: "workshop",
  },
  {
    title: "National Math Festival",
    date: "September 2026",
    time: "TBA",
    location: "Washington, D.C.",
    description:
      "Mathitude will be exhibiting at the National Math Festival. Stay tuned for details!",
    type: "festival",
  },
  {
    title: "New Swamp Puzzles Book Release",
    date: "Fall 2026",
    time: "",
    location: "Online & Bookstores",
    description:
      "Paula's newest collection of Swamp Puzzles is coming this fall. Pre-orders opening soon!",
    type: "announcement",
  },
];

const typeStyles = {
  festival: { badge: "bg-mathitude-teal/10 text-mathitude-teal border-mathitude-teal/20", label: "Festival" },
  workshop: { badge: "bg-mathitude-purple/10 text-mathitude-purple border-mathitude-purple/20", label: "Workshop" },
  announcement: { badge: "bg-mathitude-teal/10 text-mathitude-teal border-mathitude-teal/20", label: "News" },
};

export default function EventsPage() {
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
                key={event.title}
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
      <div>
        <h2 className="text-lg font-semibold text-mathitude-navy mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-mathitude-teal" />
          Upcoming
        </h2>
        <div className="grid gap-4">
          {upcoming.map((event) => (
            <Card
              key={event.title}
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
    </div>
  );
}
