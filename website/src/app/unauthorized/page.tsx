"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";

export default function UnauthorizedPage() {
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Access not set up yet
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Your account hasn&apos;t been added to Mathitude yet. Paula sets
            up access for each family and tutor individually. If you believe
            this is a mistake, reach out directly.
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          <p>
            Contact{" "}
            <a
              href="mailto:info@mathitude.com"
              className="font-medium text-neutral-900 hover:underline underline-offset-4"
            >
              info@mathitude.com
            </a>
            {" "}to get access.
          </p>
        </div>

        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="text-sm text-neutral-400 hover:text-neutral-600 underline underline-offset-4"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
