"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

const emailThread = [
  {
    from: "Sarah M.",
    initials: "SM",
    subject: "Inquiry about math tutoring",
    time: "9:14 AM",
    body: "Hi Paula, we're interested in enrolling our daughter in math tutoring. She's in 5th grade and has been struggling with fractions. Could you share more about your programs?",
    isReply: false,
  },
  {
    from: "Paula",
    initials: "P",
    subject: "Re: Inquiry about math tutoring",
    time: "11:02 AM",
    body: "Hi Sarah, thank you for reaching out! I'd be glad to share more about Mathitude's programs and find the right fit for your daughter. I'll follow up with details — looking forward to connecting.",
    isReply: true,
  },
];

function EmailMockup() {
  return (
    <div className="w-full max-w-[340px]">
      {/* Email client chrome */}
      <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-white/20 overflow-hidden">
        {/* Toolbar */}
        <div className="bg-neutral-100 px-4 py-2.5 flex items-center gap-2 border-b border-neutral-200">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-[10px] text-neutral-400 border border-neutral-200 truncate">
            Inbox — Mathitude
          </div>
        </div>

        {/* Thread */}
        <div className="divide-y divide-neutral-100">
          {emailThread.map((email, i) => (
            <div key={i} className={`px-4 py-3 ${email.isReply ? "bg-[#f9f7fc]" : "bg-white"}`}>
              <div className="flex items-start gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-semibold text-white mt-0.5"
                  style={{ background: email.isReply ? "#7030A0" : "#6b7280" }}
                >
                  {email.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-neutral-800">{email.from}</span>
                    <span className="text-[10px] text-neutral-400 flex-shrink-0">{email.time}</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 font-medium truncate">{email.subject}</p>
                  <p className="text-[10px] text-neutral-600 mt-1 leading-relaxed">{email.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compose area */}
        <div className="px-4 py-3 border-t border-neutral-100 bg-white">
          <div className="flex items-center gap-2 text-[10px] text-neutral-400">
            <svg className="w-3.5 h-3.5 text-[#7030A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>All correspondence kept on record</span>
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

        {/* Center copy */}
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
          <EmailMockup />
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
                  "bg-[#7030A0] hover:bg-[#5d288a] rounded-lg font-medium uppercase tracking-wide shadow-none",
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
