"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { GmailPhoneMockup } from "@/components/auth/gmail-phone-mockup";

export default function SignUpPage() {
  return (
    <div className="h-screen flex overflow-hidden">
      <div className="hidden lg:flex lg:w-[52%] bg-[#7030A0] flex-col justify-between p-14 xl:p-20 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 70% 30%, #9b59b6 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #4a1070 0%, transparent 50%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-start gap-10 mt-auto mb-auto">
          <div className="space-y-4 max-w-xs">
            <h1
              className="text-3xl xl:text-4xl text-white leading-snug"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Join the Mathitude community.
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Create your account to get started with Mathitude&apos;s
              K-12 math enrichment programs.
            </p>
          </div>
          <GmailPhoneMockup />
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © {new Date().getFullYear()} Mathitude · Menlo Park, CA
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 bg-white overflow-y-auto">
        <Link href="/" className="lg:hidden mb-8">
          <span className="text-2xl text-[#7030A0]" style={{ fontFamily: "var(--font-original-surfer)" }}>
            Mathitude
          </span>
        </Link>

        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl text-neutral-900" style={{ fontFamily: "var(--font-original-surfer)" }}>
              Create your account
            </h1>
            <p className="mt-2 text-sm text-neutral-500">Join Mathitude in a few seconds</p>
          </div>

          {/* New accounts land on onboarding — the C-1/B-5 card gate. The
              gate itself forwards to /dashboard once a card is on file. */}
          <SignUp
            forceRedirectUrl="/onboarding"
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
                header: "hidden",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium rounded-lg",
                formButtonPrimary: "bg-[#7030A0] hover:bg-[#5d288a] rounded-lg font-medium uppercase tracking-wide shadow-none",
                formFieldInput: "border-neutral-200 focus:border-[#7030A0] focus:ring-1 focus:ring-[#7030A0] rounded-lg bg-white",
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
