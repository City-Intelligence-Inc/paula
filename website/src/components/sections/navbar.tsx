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
  { label: "Math Engagement", href: "/math-engagement" },
  { label: "Events & News", href: "/events" },
  { label: "Contact Us", href: "/contact" },
  { label: "Shop Books", href: "/shop" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
              <span className="text-mathitude-teal">Math</span>
              <span className="text-mathitude-navy">itude</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-mathitude-teal transition-colors rounded-md hover:bg-mathitude-light"
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
            className="md:hidden p-2 text-gray-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-mathitude-teal hover:bg-mathitude-light rounded-md"
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
      <div className={mobile ? "mt-2 px-3" : "ml-3"}>
        <UserButton />
      </div>
    );
  }

  return (
    <SignInButton>
      <Button
        variant="outline"
        size="sm"
        className={
          mobile
            ? "mt-2 w-full border-mathitude-teal text-mathitude-teal hover:bg-mathitude-teal hover:text-white"
            : "ml-2 border-mathitude-teal text-mathitude-teal hover:bg-mathitude-teal hover:text-white"
        }
      >
        Log In
      </Button>
    </SignInButton>
  );
}
