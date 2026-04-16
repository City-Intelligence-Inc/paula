import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Video, MapPin } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

export default function SchedulePage() {
  return (
    <div>
      <PageHeader
        title="Schedule a Meeting"
        description="Book an introductory meet-and-greet session with Paula to discuss your student's needs and goals."
      />

      {/* Quick facts — inline, no card grid */}
      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500">
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-neutral-400" />
          30-min free intro
        </span>
        <span className="hidden sm:inline text-neutral-300">·</span>
        <span className="flex items-center gap-2">
          <Video className="w-4 h-4 text-neutral-400" />
          Virtual or in-person (Bay Area)
        </span>
        <span className="hidden sm:inline text-neutral-300">·</span>
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neutral-400" />
          Mon–Sat availability
        </span>
      </div>

      {/* Calendly Embed */}
      <Card className="border border-neutral-200 rounded-lg bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
            <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              Select a Time
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Choose a convenient time for your introductory meeting with Paula.
            </p>
          </div>
          {/*
            Replace the Calendly URL below with Paula's actual Calendly link.
            Example: https://calendly.com/paula-mathitude/meet-and-greet
          */}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="w-12 h-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">Scheduling coming soon</h3>
            <p className="text-sm text-neutral-500 mt-2 max-w-md">
              We&apos;re setting up online scheduling. In the meantime, call{" "}
              <a href="tel:5102052633" className="font-medium text-neutral-900 hover:underline underline-offset-4">510.205.2633</a>
              {" "}or email{" "}
              <a href="mailto:info@mathitude.com" className="font-medium text-neutral-900 hover:underline underline-offset-4">info@mathitude.com</a>
              {" "}to book your free 30-minute meet-and-greet with Paula.
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-neutral-400 text-center">
        This is an initial meet-and-greet, not an official class session. Paula
        will discuss your student&apos;s needs and recommend the best path
        forward.
      </p>
    </div>
  );
}
