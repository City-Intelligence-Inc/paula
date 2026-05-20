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
        setMessage(stripeError.message ?? "Something went wrong.");
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
        setMessage("Card saved successfully — refreshing…");
        // Two-step refresh: fire event for sibling panels, then hard reload
        // so the page picks up newly-created Stripe customer + saved card.
        // Card lookups go straight to Stripe; the reload guarantees the user
        // sees the updated state regardless of any cache layer.
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mathitude:card-saved"));
          setTimeout(() => window.location.reload(), 800);
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
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1e293b",
                fontFamily: "'Avenir Next', 'Avenir', system-ui, sans-serif",
                "::placeholder": { color: "#94a3b8" },
              },
              invalid: { color: "#ef4444" },
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
        className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Card"}
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
}: { parentId?: string; hideHeader?: boolean } = {}) {
  const { promise, configured } = useStripePromise();
  return (
    <div className="mx-auto max-w-md">
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
