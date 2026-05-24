"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe as StripeJS } from "@stripe/stripe-js";

// Resolve the publishable key at runtime so portal changes take effect
// without a redeploy. Falls back to the build-time env var if the API
// route hasn't been deployed yet.
function useStripePromise() {
  const [promise, setPromise] = useState<Promise<StripeJS | null> | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/stripe/config")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.publishableKey && !data.publishableKey.includes("placeholder")) {
          setPromise(loadStripe(data.publishableKey));
          setConfigured(true);
        } else {
          const fallback = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
          if (fallback && !fallback.includes("placeholder")) {
            setPromise(loadStripe(fallback));
            setConfigured(true);
          } else {
            setConfigured(false);
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { promise, configured };
}

function CardForm({ parentId }: { parentId?: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const fetchApi = useApi();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetchApi("/api/stripe/create-setup-intent", {
        method: "POST",
        body: parentId ? JSON.stringify({ parentId }) : undefined,
      });
      const { clientSecret, error } = await res.json();

      if (error) {
        setMessage(error);
        setLoading(false);
        return;
      }

      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      );

      if (stripeError) {
        // Stripe surfaces "Your card number is incorrect.", "Your card has
        // expired.", "Your card was declined.", etc. via stripeError.message.
        // Map a couple of common codes to friendlier copy; otherwise pass
        // through Stripe's message verbatim — it's user-friendly.
        const friendly =
          stripeError.code === "incomplete_number"
            ? "Please enter your full card number."
            : stripeError.code === "incomplete_expiry"
              ? "Please enter the card's expiration date."
              : stripeError.code === "incomplete_cvc"
                ? "Please enter the card's CVC."
                : stripeError.code === "card_declined"
                  ? `Your card was declined${stripeError.decline_code ? ` (${stripeError.decline_code})` : ""}. Try a different card.`
                  : stripeError.message ?? "Invalid card information.";
        setMessage(friendly);
      } else {
        // Single-card-per-customer: promote the just-saved PM to default and
        // detach older cards. Server-side webhook does the same on
        // setup_intent.succeeded; this client call guarantees it's done by
        // the time we reload, regardless of webhook configuration.
        const newPmId =
          typeof setupIntent?.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent?.payment_method?.id;
        try {
          await fetchApi("/api/stripe/payment-methods/finalize-new-card", {
            method: "POST",
            body: JSON.stringify({
              parentId,
              paymentMethodId: newPmId,
            }),
          });
        } catch (e) {
          console.warn("[save-card] finalize-new-card failed:", e);
        }
        setSuccess(true);
        setMessage("Card saved. This parent now has one card on file.");
        // Notify the panel so it reloads from Stripe + clears any draft state.
        // No hard reload — the panel handles re-render and the user can
        // continue staging default/remove changes for Save Changes.
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mathitude:card-saved"));
        }
        // Reset the card form so a follow-up add starts clean.
        try {
          elements.getElement(CardElement)?.clear();
        } catch {
          /* noop */
        }
      }
    } catch {
      setMessage("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1A1A2E",
                fontFamily: "'Avenir Next', 'Avenir', system-ui, sans-serif",
                "::placeholder": { color: "#94a3b8" },
                iconColor: "#7030A0",
              },
              invalid: { color: "#B0263C" },
            },
          }}
        />
      </div>

      {message && (
        <p
          className={`text-sm font-medium ${
            success ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-lg bg-[#7030A0] px-4 py-2.5 text-sm font-semibold text-white uppercase tracking-wide transition-colors hover:bg-[#5d288a] disabled:opacity-50"
      >
        {loading ? "Adding…" : "Add Card"}
      </button>
    </form>
  );
}

function NotConfigured() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
      <p className="text-sm text-neutral-600">
        Payment processing is being set up. You&apos;ll be able to save your
        card here soon.
      </p>
      <p className="mt-2 text-xs text-neutral-400">
        Contact info@mathitude.com if you need to update your payment method.
      </p>
    </div>
  );
}

export function SaveCardForm({
  parentId,
  hideHeader = false,
  fullWidth = false,
}: {
  parentId?: string;
  hideHeader?: boolean;
  fullWidth?: boolean;
} = {}) {
  const { promise, configured } = useStripePromise();
  // Default: centered max-w-md (parent dashboard). Inside an admin family
  // detail page the form sits inside a wider card and should fill it.
  const wrapper = fullWidth ? "w-full" : "mx-auto max-w-md";
  return (
    <div className={wrapper}>
      {!hideHeader && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Payment Method
          </h2>
          <p className="text-sm text-neutral-500">
            Securely save your card for future payments.
          </p>
        </div>
      )}

      {configured && promise ? (
        <Elements stripe={promise}>
          <CardForm parentId={parentId} />
        </Elements>
      ) : configured === false ? (
        <NotConfigured />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          Loading…
        </div>
      )}
    </div>
  );
}
