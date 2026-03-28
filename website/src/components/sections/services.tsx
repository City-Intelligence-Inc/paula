import { BookOpen, Users, MessageSquare, Puzzle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  {
    icon: BookOpen,
    title: "Enrichment Books",
    description:
      "Signature math engagement workbooks for elementary and middle-grade students.",
  },
  {
    icon: MessageSquare,
    title: "Advisory Services",
    description:
      "Expert guidance for parents navigating their student's math education journey.",
  },
  {
    icon: Users,
    title: "Solo & Group Tutoring",
    description:
      "Private math coaching for all ages, individually or in small groups.",
  },
  {
    icon: Puzzle,
    title: "Puzzles & Activities",
    description:
      "Fun, engaging math challenges that build deep thinking and problem-solving skills.",
  },
];

export function Services() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <h2 className="text-3xl sm:text-4xl font-serif italic font-medium text-neutral-900 text-center tracking-tight">
          We offer:
        </h2>
        <p className="mt-3 text-neutral-500 text-center max-w-lg mx-auto">
          Everything Paula offers to help your student fall in love with math.
        </p>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-in">
          {services.map((service) => (
            <Card
              key={service.title}
              className="border border-neutral-200 rounded-lg bg-white shadow-none hover:shadow-sm transition-shadow"
            >
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto">
                  <service.icon className="w-7 h-7 text-neutral-400" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-neutral-900">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
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
