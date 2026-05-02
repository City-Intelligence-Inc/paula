"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

const messages = [
  { from: "parent", text: "Hi! We'd love to get our daughter started with tutoring 🙏" },
  { from: "paula", text: "Hi Sarah! I'd love to help. What grade is she in?" },
  { from: "parent", text: "She's in 5th grade — really struggling with fractions lately" },
  { from: "paula", text: "Fractions are tricky but totally conquerable! Let's set up a free intro session so I can get a sense of where she is 🧮" },
  { from: "parent", text: "That would be amazing, thank you so much!" },
  { from: "paula", text: "Of course! I'll send over some times — looking forward to meeting her 🌟" },
];

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px]">
      <div className="relative bg-[#1c1c1e] rounded-[44px] p-3 shadow-2xl ring-1 ring-white/10">
        <div className="bg-white rounded-[36px] overflow-hidden" style={{ height: "520px" }}>
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-24 h-6 bg-[#1c1c1e] rounded-full" />
          </div>
          <div className="border-b border-neutral-100 px-4 py-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7030A0] to-[#9b59b6] flex items-center justify-center text-white text-xs font-semibold">
              P
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-900 truncate">Mathitude</p>
              <p className="text-[10px] text-green-500 font-medium">Active now</p>
            </div>
            <div className="flex gap-3">
              <svg className="w-4 h-4 text-[#007AFF]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <svg className="w-4 h-4 text-[#007AFF]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </div>
          </div>
          <div className="px-3 py-3 space-y-2 overflow-hidden" style={{ maxHeight: "400px" }}>
            <p className="text-[9px] text-neutral-400 text-center font-medium mb-3">Today 9:14 AM</p>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "parent" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] px-3 py-1.5 rounded-2xl text-[11px] leading-[1.4] ${msg.from === "parent" ? "bg-[#007AFF] text-white rounded-br-md" : "bg-[#e9e9eb] text-[#1c1c1e] rounded-bl-md"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 left-3 right-3">
            <div className="bg-[#f2f2f7] rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 flex-1">iMessage</span>
              <div className="w-5 h-5 rounded-full bg-[#007AFF] flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#7030A0] flex-col justify-between p-14 xl:p-20 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 70% 30%, #9b59b6 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #4a1070 0%, transparent 50%)",
          }}
        />

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
        <div className="relative z-10 flex flex-col items-start gap-10">
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
          <PhoneMockup />
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/30 text-xs">
          © {new Date().getFullYear()} Mathitude · Menlo Park, CA
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 bg-white overflow-y-auto">
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
          <div className="mb-8 text-center">
            <h1
              className="text-3xl text-neutral-900"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Create your account
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Join Mathitude in a few seconds
            </p>
          </div>

          <SignUp
            forceRedirectUrl="/dashboard"
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
