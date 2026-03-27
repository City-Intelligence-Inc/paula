import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Calendar, FolderOpen, Newspaper } from "lucide-react";

const quickLinks = [
  {
    title: "Course Materials",
    description: "Browse materials by grade level, from preschool to college.",
    href: "/dashboard/courses",
    icon: BookOpen,
    color: "text-mathitude-orange",
    bg: "bg-mathitude-orange/10",
  },
  {
    title: "Schedule a Meeting",
    description: "Book a meet-and-greet session with Paula.",
    href: "/dashboard/schedule",
    icon: Calendar,
    color: "text-mathitude-teal",
    bg: "bg-mathitude-teal/10",
  },
  {
    title: "Resources",
    description: "Books, videos, puzzles, downloadable PDFs, and more.",
    href: "/dashboard/resources",
    icon: FolderOpen,
    color: "text-mathitude-purple",
    bg: "bg-mathitude-purple/10",
  },
  {
    title: "Events & News",
    description: "Upcoming math festivals and Mathitude announcements.",
    href: "/dashboard/events",
    icon: Newspaper,
    color: "text-mathitude-blue",
    bg: "bg-mathitude-blue/10",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-mathitude-navy">
          Welcome to Mathitude
        </h1>
        <p className="mt-2 text-gray-600">
          Your client portal for course materials, scheduling, and resources.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full border border-gray-100 shadow-sm hover:shadow-md hover:border-mathitude-teal/30 transition-all cursor-pointer">
              <CardContent className="pt-6 pb-6 px-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 w-12 h-12 ${link.bg} rounded-xl flex items-center justify-center`}
                  >
                    <link.icon className={`w-6 h-6 ${link.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-mathitude-navy">
                      {link.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {link.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
