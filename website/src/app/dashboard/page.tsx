import Link from "next/link";

const sections = [
  { title: "Course Materials", description: "Browse materials by grade level, from preschool to college.", href: "/dashboard/courses" },
  { title: "Schedule a Meeting", description: "Book a meet-and-greet session with Paula.", href: "/dashboard/schedule" },
  { title: "Billing & Payments", description: "Manage your payment method and view payment history.", href: "/dashboard/billing" },
  { title: "Resources", description: "Books, videos, puzzles, downloadable PDFs, and more.", href: "/dashboard/resources" },
  { title: "Events & News", description: "Upcoming math festivals and Mathitude announcements.", href: "/dashboard/events" },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-serif italic font-medium text-neutral-900 tracking-tight">
          Welcome to Mathitude
        </h1>
        <p className="mt-3 text-neutral-500 max-w-lg">
          Your client portal for course materials, scheduling, and resources.
        </p>
      </div>

      <div className="divide-y divide-neutral-200 border-y border-neutral-200">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="flex items-center justify-between py-5 group">
            <div>
              <h2 className="text-base font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors">
                {s.title}
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500">{s.description}</p>
            </div>
            <span className="text-neutral-300 group-hover:text-neutral-500 transition-colors ml-4 shrink-0">&rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
