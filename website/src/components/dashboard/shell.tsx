"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  BookOpen,
  Calendar,
  CreditCard,
  FolderOpen,
  Newspaper,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { roleMeta } from "@/lib/roles";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Course Materials",
    href: "/dashboard/courses",
    icon: BookOpen,
  },
  {
    label: "Schedule a Meeting",
    href: "/dashboard/schedule",
    icon: Calendar,
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    label: "Resources",
    href: "/dashboard/resources",
    icon: FolderOpen,
  },
  {
    label: "Events & News",
    href: "/dashboard/events",
    icon: Newspaper,
  },
];

function NavLink({
  item,
  active,
  onClick,
}: {
  item: (typeof navItems)[0];
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
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

export function DashboardShell({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo — parent view carries no role accent rail (1/ Sara: none for
          parents); the neutral chip just labels the current view. */}
      <div className="px-4 py-5 border-b border-neutral-200">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-mathitude-purple" style={{ fontFamily: "var(--font-original-surfer)" }}>
            Mathitude
          </span>
        </Link>
        <div className="mt-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleMeta("parent").chip}`}
          >
            Client Portal
          </span>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="mb-4 flex items-center justify-between gap-2 rounded-lg bg-[#7030A0] hover:bg-[#5d288a] text-white px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Admin Portal
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        )}
        {isAdmin && (
          <p className="px-3 mb-3 text-xs text-neutral-400">
            You&apos;re viewing the parent dashboard. Use the button above to
            return to the admin portal.
          </p>
        )}
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
      <div className="border-t border-neutral-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="text-sm">
            <p className="font-medium text-neutral-900">My Account</p>
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
    <div className="flex min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-neutral-200 lg:bg-white">
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar — a real header instead of a floating button so the
            hamburger never overlaps page content (4/ Sara). */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <header className="lg:hidden sticky top-0 z-40 flex items-center gap-2 h-14 px-3 border-b border-neutral-200 bg-white">
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
          </header>
          <SheetContent side="left" className="w-64 p-0">
            {sidebar}
          </SheetContent>
        </Sheet>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
