"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  BookOpen,
  Calendar,
  FolderOpen,
  Newspaper,
  LayoutDashboard,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-mathitude-teal text-white"
          : "text-gray-700 hover:bg-mathitude-light hover:text-mathitude-teal"
      }`}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
      {active && <ChevronRight className="ml-auto h-4 w-4" />}
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-original-surfer)" }}>
            <span className="text-mathitude-teal">Math</span>
            <span className="text-mathitude-navy">itude</span>
          </span>
        </Link>
        <p className="mt-1 text-xs text-gray-500">Client Portal</p>
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
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="text-sm">
            <p className="font-medium text-gray-900">My Account</p>
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-mathitude-teal"
            >
              Back to site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger>
          <span className="lg:hidden fixed top-3 left-3 z-50 inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 hover:bg-gray-100 transition-colors">
            <Menu className="h-5 w-5" />
          </span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          {sidebar}
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
