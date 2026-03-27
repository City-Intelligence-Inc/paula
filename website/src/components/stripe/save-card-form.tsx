"use client";

import { useState } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function CardForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage(null);

    try {
      // Create a SetupIntent on the server
      const res = await fetch("/api/stripe/create-setup-intent", {
        method: "POST",
      });
      const { clientSecret, error } = await res.json();

      if (error) {
        setMessage(error);
        setLoading(false);
        return;
      }

      // Confirm the SetupIntent with the card details
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
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1e293b",
                fontFamily: "var(--font-poppins), sans-serif",
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
        className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
        style={{ backgroundColor: "#2ab5b2" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#239e9b")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#2ab5b2")
        }
      >
        {loading ? "Saving..." : "Save Card"}
      </button>
    </form>
  );
}

export function SaveCardForm() {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <h2
          className="text-lg font-semibold"
          style={{ color: "#7c3aed" }}
        >
          Payment Method
        </h2>
        <p className="text-sm text-gray-500">
          Securely save your card for future payments.
        </p>
      </div>

      <Elements stripe={stripePromise}>
        <CardForm />
      </Elements>
    </div>
  );
}
