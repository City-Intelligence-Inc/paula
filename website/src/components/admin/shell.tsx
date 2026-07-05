"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { roleMeta } from "@/lib/roles";
import {
  Users,
  Calendar,
  CalendarDays,
  CalendarClock,
  CreditCard,
  Mail,
  Upload,
  FileText,
  Settings,
  Menu,
  ShieldCheck,
  Home,
  Inbox,
  UserCheck,
  Bell,
  BookOpen,
  DollarSign,
  Stethoscope,
  Package,
  Wallet,
  UsersRound,
  BookUser,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GuidedTour } from "@/components/admin/guided-tour";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tour?: string;
};

const navItems: NavItem[] = [
  {
    label: "Weekly Schedule",
    href: "/admin",
    icon: Calendar,
  },
  {
    label: "Log session",
    href: "/admin/sessions/new",
    icon: FileText,
  },
  {
    label: "Families",
    href: "/admin/families",
    icon: Home,
    tour: "families",
  },
  {
    label: "Students",
    href: "/admin/students",
    icon: Users,
    tour: "students",
  },
  {
    label: "Tutors",
    href: "/admin/tutors",
    icon: UserCheck,
  },
  {
    label: "Resources",
    href: "/admin/resources",
    icon: BookOpen,
  },
  {
    label: "Equipment",
    href: "/admin/equipment",
    icon: Package,
  },
  {
    label: "Billing queue",
    href: "/admin/billing",
    icon: Inbox,
    tour: "billing",
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    label: "Family Ledger",
    href: "/admin/ledger",
    icon: Wallet,
  },
  {
    label: "Billing Diagnostics",
    href: "/admin/billing-diagnostics",
    icon: Stethoscope,
  },
  {
    label: "Financials",
    href: "/admin/financials",
    icon: DollarSign,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: UsersRound,
  },
  {
    label: "Admins",
    href: "/admin/admins",
    icon: ShieldCheck,
  },
  {
    label: "Contacts",
    href: "/admin/contacts",
    icon: BookUser,
  },
  {
    label: "Consultations",
    href: "/admin/consultations",
    icon: Mail,
    tour: "consultations",
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    tour: "notifications",
  },
  {
    label: "Calendar",
    href: "/admin/calendar",
    icon: CalendarDays,
    tour: "calendar",
  },
  {
    label: "Makeups",
    href: "/admin/makeups",
    icon: CalendarClock,
  },
  {
    label: "Academic Calendar",
    href: "/admin/academic-calendar",
    icon: CalendarDays,
  },
  {
    label: "Newsletter",
    href: "/admin/newsletter",
    icon: Mail,
  },
  {
    label: "Import",
    href: "/admin/import",
    icon: Upload,
  },
  {
    label: "Pages",
    href: "/admin/pages",
    icon: FileText,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  // Stripe-style active state — purple-tinted surface + purple text +
  // purple icon. Reads as "this is where you are" without shouting.
  return (
    <Link
      href={item.href}
      onClick={onClick}
      data-tour={item.tour ? `nav-${item.tour}` : undefined}
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-mathitude-purple/10 text-mathitude-purple"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 hover:translate-x-0.5"
      }`}
    >
      <item.icon
        className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
          active ? "text-mathitude-purple" : ""
        }`}
      />
      <span>{item.label}</span>
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<string>("admin");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/is-admin")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.role) setRole(j.role);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const meta = roleMeta(role);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo — top rail colored by role (purple master / blue staff). */}
      <div
        className="px-4 py-5 border-b border-[color:var(--color-border-warm)] border-t-4"
        style={{ borderTopColor: meta.accent || "transparent" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <span
            className="text-xl font-bold tracking-tight text-mathitude-purple"
            style={{ fontFamily: "var(--font-original-surfer)" }}
          >
            Mathitude
          </span>
        </Link>
        <div className="mt-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${meta.chip}`}
          >
            <ShieldCheck className="h-3 w-3" />
            {meta.label}
          </span>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-[color:var(--color-border-warm)] px-4 py-4 space-y-3">
        <Link
          href="/dashboard"
          className="block text-xs text-mathitude-purple hover:text-[#5d288a] font-medium"
        >
          View as parent →
        </Link>
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="text-sm">
            <p className="font-medium text-neutral-900">{meta.label}</p>
            <Link
              href="/"
              className="text-xs text-neutral-500 hover:text-neutral-900"
            >
              Back to site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-shell flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-[color:var(--color-border-warm)] lg:bg-[color:var(--color-surface-card)]">
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar — a real header instead of a floating button so the
            hamburger never overlaps page content (4/ Sara). The role accent
            rail repeats here on mobile where the sidebar is hidden. */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <header
            className="lg:hidden sticky top-0 z-40 flex items-center gap-2 h-14 px-3 border-b border-[color:var(--color-border-warm)] bg-[color:var(--color-surface-card)] border-t-4"
            style={{ borderTopColor: meta.accent || "transparent" }}
          >
            <SheetTrigger>
              <span className="inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-neutral-100 transition-colors">
                <Menu className="h-5 w-5" />
              </span>
            </SheetTrigger>
            <span
              className="text-lg font-bold tracking-tight text-mathitude-purple"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Mathitude
            </span>
            <span
              className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.chip}`}
            >
              {meta.label}
            </span>
          </header>
          <SheetContent side="left" className="w-64 p-0">
            {sidebar}
          </SheetContent>
        </Sheet>

        <div
          key={pathname}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 admin-page-enter"
        >
          {children}
        </div>
      </main>

      {/* First-time guided tour + help launcher (built for Paula) */}
      <GuidedTour />
    </div>
  );
}
