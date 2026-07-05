"use client";

import { useRouter } from "next/navigation";
import { CreditCard, ShieldCheck } from "lucide-react";
import { SaveCardForm } from "@/components/stripe/save-card-form";

// B-5/C-1: the subscription-style card gate, enforced server-side by the
// dashboard layout. Rendered INSTEAD of the portal until the family saves a
// card — there is no client-side way around it. Shown to parents only
// (students and staff never see it).

export function CardGate({ parentId }: { parentId?: string }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-center gap-2 text-[#7030A0]">
          <CreditCard className="h-5 w-5" />
          <h1 className="text-xl font-semibold text-neutral-900">
            One last step — save a card
          </h1>
        </div>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Mathitude bills sessions to a card on file, like a subscription — so
          you never have to handle payment at session time. Save your card to
          unlock your family portal.
        </p>
        <div className="mt-5">
          <SaveCardForm
            parentId={parentId}
            onSuccess={() => router.refresh()}
          />
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-neutral-500">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7030A0]" />
          Card details go directly to Stripe and never touch Mathitude&apos;s
          servers. Your statement will always read MATHITUDE.
        </p>
      </div>
    </div>
  );
}
