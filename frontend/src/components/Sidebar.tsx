'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Home,
  CreditCard,
  GraduationCap,
  LogOut,
  Menu,
  X,
  BookOpen,
  ClipboardList,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/students', label: 'Students', icon: <GraduationCap className="h-5 w-5" /> },
  { href: '/sessions', label: 'Sessions', icon: <CalendarDays className="h-5 w-5" /> },
  { href: '/families', label: 'Families', icon: <Home className="h-5 w-5" /> },
  { href: '/billing', label: 'Billing', icon: <CreditCard className="h-5 w-5" /> },
];

const parentNav: NavItem[] = [
  { href: '/portal', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/portal/sessions', label: 'Session History', icon: <BookOpen className="h-5 w-5" /> },
  { href: '/portal/payments', label: 'Payments', icon: <ClipboardList className="h-5 w-5" /> },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const nav = user.role === 'ADMIN' ? adminNav : parentNav;

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const sidebar = (
    <div className="flex h-full w-64 flex-col bg-[#1E293B]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5">
        <Users className="h-8 w-8 text-blue-400" />
        <div>
          <h1 className="text-lg font-bold text-white">Mathitude</h1>
          <p className="text-xs text-slate-400">K-12 Tutoring</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' &&
              item.href !== '/portal' &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-slate-700 px-4 py-4">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium text-white truncate">
            {user.name}
          </p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-[#1E293B] p-2 text-white shadow-lg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-64">
            {sidebar}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-4 rounded-lg p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden md:block">
        {sidebar}
      </aside>
    </>
  );
}
