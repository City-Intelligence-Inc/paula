"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import {
  SignInButton,
  UserButton,
  ClerkLoaded,
  useAuth,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { roleMeta } from "@/lib/roles";

const navLinks = [
  { label: "Tutoring & Groups", href: "/tutoring" },
  { label: "Free Resources", href: "/free-resources" },
  { label: "Calendar", href: "/calendar" },
  { label: "Events & News", href: "/events" },
  { label: "Enrichment Books", href: "/shop" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <Image
              src="/brand/logo.png"
              alt="Mathitude"
              width={56}
              height={56}
              priority
              className="w-11 h-11 sm:w-14 sm:h-14 object-contain transition-transform duration-300 group-hover:rotate-[-8deg]"
            />
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#7030A0]" style={{ fontFamily: "var(--font-original-surfer)" }}>
              Mathitude
            </span>
          </Link>

          {/* Desktop nav */}
          <nav data-guide="nav" className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center min-h-[44px] px-3 py-2.5 text-sm font-medium text-black hover:text-[#7030A0] hover:underline underline-offset-4 decoration-[#7030A0]/30 transition-colors rounded-md"
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
                className="block px-3 py-2 text-sm font-medium text-black hover:text-[#7030A0] rounded-md"
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
  const [me, setMe] = useState<{ isAdmin: boolean; role: string } | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setMe(null);
      return;
    }
    let cancelled = false;
    fetch("/api/me/is-admin")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setMe({ isAdmin: !!j.isAdmin, role: j.role || "parent" });
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  if (isSignedIn) {
    // Role is decided authoritatively by /api/me/is-admin (server-side). The
    // small role chip replaces the old undifferentiated "Admin" badge
    // (1/ Sara). Default to a neutral parent view until it resolves.
    const isAdmin = me?.isAdmin === true;
    const meta = roleMeta(me?.role);
    return (
      <div className={mobile ? "mt-2 px-3 flex items-center gap-2.5" : "ml-3 flex items-center gap-2.5"}>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.chip}`}
        >
          {meta.label}
        </span>
        <Link
          href={isAdmin ? "/admin" : "/dashboard"}
          className="text-sm font-medium text-neutral-700 hover:text-[#7030A0] transition-colors"
        >
          {isAdmin ? "Admin" : "Dashboard"}
        </Link>
        <UserButton />
      </div>
    );
  }

  // Signed out: offer both Log In and a Sign up / request-an-account link.
  // (3/ Sara: the /sign-up page existed but wasn't linked anywhere.)
  return (
    <div
      className={
        mobile
          ? "mt-2 px-1 flex flex-col gap-2"
          : "ml-2 flex items-center gap-2"
      }
    >
      <SignInButton>
        <Button
          size="sm"
          className={
            mobile
              ? "w-full h-11 bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
              : "h-11 bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
          }
        >
          Log In
        </Button>
      </SignInButton>
      <Link
        href="/sign-up"
        className={
          mobile
            ? "w-full h-11 inline-flex items-center justify-center rounded-md border border-[#7030A0] text-[#7030A0] text-sm font-medium uppercase tracking-wide hover:bg-[#F2E8FA] transition-colors"
            : "h-11 px-4 inline-flex items-center justify-center rounded-md border border-[#7030A0] text-[#7030A0] text-sm font-medium uppercase tracking-wide hover:bg-[#F2E8FA] transition-colors whitespace-nowrap"
        }
      >
        Sign Up
      </Link>
    </div>
  );
}
