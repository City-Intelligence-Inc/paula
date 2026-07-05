"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, FileText, ShieldCheck } from "lucide-react";
import { SaveCardForm } from "@/components/stripe/save-card-form";

// B-5/C-1: the "Contract & Credit Card Gate", enforced server-side by the
// dashboard layout. Rendered INSTEAD of the portal until (1) the family's
// contract is accepted (only when one is on file) and (2) a card is saved —
// there is no client-side way around it. Shown to parents only.

function ContractStep({ onAccepted }: { onAccepted: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me/contract/accept", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not record acceptance");
      onAccepted();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex items-center gap-2 text-[#7030A0]">
        <FileText className="h-5 w-5" />
        <h1 className="text-xl font-semibold text-neutral-900">
          Your Mathitude agreement
        </h1>
      </div>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        Please review your family&apos;s tutoring agreement below, then accept
        to continue.
      </p>
      <iframe
        src="/api/me/contract?file=1"
        title="Mathitude agreement"
        className="mt-4 h-[50vh] w-full rounded-md border border-neutral-200"
      />
      <label className="mt-4 flex items-start gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-[#7030A0]"
        />
        I have read and agree to the Mathitude tutoring agreement.
      </label>
      <button
        type="button"
        onClick={accept}
        disabled={!agreed || busy}
        className="mt-4 rounded-full bg-[#7030A0] px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#5d288a] disabled:opacity-40"
      >
        {busy ? "Recording…" : "Accept & continue"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function CardStep({ parentId }: { parentId?: string }) {
  const router = useRouter();
  return (
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
        <SaveCardForm parentId={parentId} onSuccess={() => router.refresh()} />
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-neutral-500">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7030A0]" />
        Card details go directly to Stripe and never touch Mathitude&apos;s
        servers. Your statement will always read MATHITUDE.
      </p>
    </div>
  );
}

export function CardGate({
  parentId,
  needsContract = false,
  needsCard = true,
}: {
  parentId?: string;
  needsContract?: boolean;
  needsCard?: boolean;
}) {
  const router = useRouter();
  const [contractDone, setContractDone] = useState(!needsContract);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {!contractDone ? (
        <ContractStep
          onAccepted={() =>
            needsCard ? setContractDone(true) : router.refresh()
          }
        />
      ) : (
        <CardStep parentId={parentId} />
      )}
    </div>
  );
}
