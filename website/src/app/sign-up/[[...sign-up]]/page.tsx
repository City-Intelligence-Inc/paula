"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const features = [
  "Schedule sessions with Paula directly",
  "Access course materials & enrichment worksheets",
  "Track your student's progress over time",
  "Manage billing in one place",
];

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#7030A0] flex-col justify-between p-14 xl:p-20 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Logo */}
        <Link href="/" className="relative z-10">
          <span
            className="text-2xl text-white"
            style={{ fontFamily: "var(--font-original-surfer)" }}
          >
            Mathitude
          </span>
        </Link>

        {/* Center copy */}
        <div className="relative z-10 space-y-8 max-w-md">
          <h1
            className="text-4xl xl:text-5xl text-white leading-tight"
            style={{ fontFamily: "var(--font-original-surfer)" }}
          >
            Join the Mathitude community.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Create your account to get started with Paula Hamilton&apos;s
            K-12 math enrichment programs.
          </p>

          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/80 shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm leading-snug">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/30 text-xs">
          © {new Date().getFullYear()} Mathitude · Menlo Park, CA
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden mb-8">
          <span
            className="text-2xl text-[#7030A0]"
            style={{ fontFamily: "var(--font-original-surfer)" }}
          >
            Mathitude
          </span>
        </Link>

        <div className="w-full max-w-[400px]">
          {/* Stardrop header */}
          <div className="mb-6 text-center">
            <p className="text-xs font-medium tracking-widest text-neutral-400 uppercase">
              Sign up with Stardrop
            </p>
          </div>

          <SignUp
            appearance={{
              variables: {
                colorPrimary: "#7030A0",
                colorText: "#171717",
                colorTextSecondary: "#737373",
                colorBackground: "#ffffff",
                colorInputBackground: "#fafafa",
                colorInputText: "#171717",
                borderRadius: "8px",
                fontFamily: "'Avenir Next', 'Avenir', system-ui, sans-serif",
                fontSize: "14px",
              },
              elements: {
                rootBox: "w-full",
                card: "shadow-none border border-neutral-200 rounded-xl p-8 w-full",
                headerTitle: "text-lg font-semibold text-neutral-900",
                headerSubtitle: "text-sm text-neutral-500",
                socialButtonsBlockButton:
                  "border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium rounded-lg",
                formButtonPrimary:
                  "bg-[#7030A0] hover:bg-[#5d288a] rounded-lg font-medium shadow-none",
                formFieldInput:
                  "border-neutral-200 focus:border-[#7030A0] focus:ring-1 focus:ring-[#7030A0] rounded-lg bg-white",
                formFieldLabel: "text-neutral-600 text-sm font-medium",
                identityPreviewEditButton: "text-[#7030A0] hover:text-[#5d288a]",
                footerActionLink: "text-[#7030A0] hover:text-[#5d288a] font-medium",
                footer: "hidden",
                badge: "hidden",
                logoBox: "hidden",
                dividerLine: "bg-neutral-200",
                dividerText: "text-neutral-400 text-xs",
              },
            }}
          />

          <p className="mt-6 text-center text-xs text-neutral-400">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-[#7030A0] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
