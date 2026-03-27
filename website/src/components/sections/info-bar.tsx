import { MapPin, Clock, DollarSign } from "lucide-react";

const infoItems = [
  {
    icon: MapPin,
    title: "Location",
    lines: ["San Francisco Bay Area, CA", "In-person & virtual sessions available"],
  },
  {
    icon: Clock,
    title: "Hours",
    lines: ["Mon–Fri: 9:00 AM – 7:00 PM", "Sat: 10:00 AM – 4:00 PM", "Sun: Closed"],
  },
  {
    icon: DollarSign,
    title: "Pricing",
    lines: [
      "Individual Tutoring: from $90/hr",
      "Group Sessions: from $50/student",
      "Contact us for custom packages",
    ],
  },
];

export function InfoBar() {
  return (
    <section className="bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid sm:grid-cols-3 gap-8">
          {infoItems.map((item) => (
            <div key={item.title} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-900">
                  {item.title}
                </h3>
                {item.lines.map((line) => (
                  <p key={line} className="text-sm text-neutral-500 mt-0.5">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
