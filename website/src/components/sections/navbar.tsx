"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  SignInButton,
  UserButton,
  ClerkLoaded,
  useAuth,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Tutoring & Groups", href: "/tutoring" },
  { label: "Free Resources", href: "/free-resources" },
  { label: "Events & News", href: "/events" },
  { label: "Shop Books", href: "/shop" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-original-surfer)" }}>
              <span className="text-mathitude-purple">Math</span>
              <span className="text-neutral-900">itude</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:underline underline-offset-4 decoration-neutral-300 transition-colors rounded-md"
              >
                {link.label}
              </Link>
            ))}

            <ClerkLoaded>
              <AuthButtons />
            </ClerkLoaded>
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-neutral-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <nav className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-md"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <ClerkLoaded>
              <AuthButtons mobile />
            </ClerkLoaded>
          </nav>
        </div>
      )}
    </header>
  );
}

function AuthButtons({ mobile }: { mobile?: boolean }) {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <div className={mobile ? "mt-2 px-3 flex items-center gap-3" : "ml-3 flex items-center gap-3"}>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          Dashboard
        </Link>
        <UserButton />
      </div>
    );
  }

  return (
    <SignInButton>
      <Button
        size="sm"
        className={
          mobile
            ? "mt-2 w-full h-11 bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
            : "ml-2 h-11 bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
        }
      >
        Log In
      </Button>
    </SignInButton>
  );
}
