import { BookOpen, Users, MessageSquare, Puzzle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  {
    icon: BookOpen,
    title: "Enrichment Books",
    description:
      "Signature math engagement workbooks for elementary and middle-grade students.",
    color: "text-mathitude-orange",
    bg: "bg-mathitude-orange/10",
  },
  {
    icon: MessageSquare,
    title: "Advisory Services",
    description:
      "Expert guidance for parents navigating their student's math education journey.",
    color: "text-mathitude-blue",
    bg: "bg-mathitude-blue/10",
  },
  {
    icon: Users,
    title: "Solo & Group Tutoring",
    description:
      "Private math coaching for all ages, individually or in small groups.",
    color: "text-mathitude-purple",
    bg: "bg-mathitude-purple/10",
  },
  {
    icon: Puzzle,
    title: "Puzzles & Activities",
    description:
      "Fun, engaging math challenges that build deep thinking and problem-solving skills.",
    color: "text-mathitude-green",
    bg: "bg-mathitude-green/10",
  },
];

export function Services() {
  return (
    <section className="bg-mathitude-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-mathitude-navy text-center">
          We offer:
        </h2>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Card
              key={service.title}
              className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white"
            >
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div
                  className={`w-14 h-14 ${service.bg} rounded-xl flex items-center justify-center mx-auto`}
                >
                  <service.icon className={`w-7 h-7 ${service.color}`} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-mathitude-navy">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
