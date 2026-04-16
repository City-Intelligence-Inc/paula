"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const isConfigured = publishableKey && !publishableKey.includes("placeholder");
const stripePromise = isConfigured ? loadStripe(publishableKey) : null;

function CardForm() {
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
      });
      const { clientSecret, error } = await res.json();

      if (error) {
        setMessage(error);
        setLoading(false);
        return;
      }

      const { error: stripeError } = await stripe.confirmCardSetup(
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
        setSuccess(true);
        setMessage("Card saved successfully!");
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

export function SaveCardForm() {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Payment Method
        </h2>
        <p className="text-sm text-neutral-500">
          Securely save your card for future payments.
        </p>
      </div>

      {isConfigured && stripePromise ? (
        <Elements stripe={stripePromise}>
          <CardForm />
        </Elements>
      ) : (
        <NotConfigured />
      )}
    </div>
  );
}
