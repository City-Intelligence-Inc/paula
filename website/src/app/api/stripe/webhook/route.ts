import {
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type Stripe from "stripe";
import { ddb, Tables } from "@/lib/server/ddb";
import {
  enforceSingleCardForCustomer,
  getStripe,
  getWebhookSecret,
} from "@/lib/server/stripe";

// POST /api/stripe/webhook
// Stripe events: payment_intent.succeeded / .payment_failed / charge.refunded
// Reconciles Payment.paymentStatus + Session.status with Stripe's truth.
//
// Configure the endpoint in Stripe dashboard:
//   https://<host>/api/stripe/webhook
// Set STRIPE_WEBHOOK_SECRET to the resulting whsec_… value.
//
// Note: this route is unauthenticated by design — Stripe authenticates via
// signed payloads. Middleware excludes /api from auth on this path because
// requireUser() is not called here.
export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  const secret = await getWebhookSecret();

  if (!sig || !secret) {
    return Response.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();
  const stripe = await getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bad signature";
    console.error("[stripe/webhook] signature failed:", message);
    return Response.json({ error: message }, { status: 400 });
  }

  const c = ddb();

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await reconcileIntent(c, intent, "paid", "billed");
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await reconcileIntent(c, intent, "failed", "failed");
        break;
      }
      case "setup_intent.succeeded": {
        // A parent just saved a new card. Enforce single-card-per-customer:
        // promote the just-saved PM to default and detach any older cards
        // so future charges always hit the most recent card on file.
        const setupIntent = event.data.object as Stripe.SetupIntent;
        const customerId =
          typeof setupIntent.customer === "string"
            ? setupIntent.customer
            : setupIntent.customer?.id;
        const paymentMethodId =
          typeof setupIntent.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent.payment_method?.id;
        if (customerId && paymentMethodId) {
          await enforceSingleCardForCustomer(
            stripe,
            customerId,
            paymentMethodId,
          );
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const intentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (intentId) {
          const studentId = (charge.metadata?.studentId as string) || "";
          const ts = (charge.metadata?.sessionId as string) || "";
          if (studentId && ts.includes("#")) {
            const dateTime = ts.split("#")[1];
            await c.send(
              new UpdateCommand({
                TableName: Tables.sessions,
                Key: { studentId, dateTime },
                UpdateExpression: "SET #s = :s, refundedAt = :n",
                ExpressionAttributeNames: { "#s": "status" },
                ExpressionAttributeValues: {
                  ":s": "completed",
                  ":n": new Date().toISOString(),
                },
              }),
            );
          }
        }
        break;
      }
      default:
        // Ignore other event types; ack so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler failed:", err);
    return Response.json({ error: "handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}

async function reconcileIntent(
  c: ReturnType<typeof ddb>,
  intent: Stripe.PaymentIntent,
  paymentStatus: "paid" | "failed",
  sessionStatus: "billed" | "failed",
) {
  const studentId = (intent.metadata?.studentId as string) || "";
  const sessionRef = (intent.metadata?.sessionId as string) || "";
  const dateTime = sessionRef.includes("#") ? sessionRef.split("#")[1] : "";

  // Update the existing Payment row that matches this PaymentIntent.
  // Payment table is PK=studentId, SK=createdAt — we need a scan lookup
  // by stripePaymentIntentId.
  const existing = await c.send(
    new ScanCommand({
      TableName: Tables.payments,
      FilterExpression: "stripePaymentIntentId = :pi",
      ExpressionAttributeValues: { ":pi": intent.id },
      Limit: 1,
    }),
  );
  const found = existing.Items?.[0];
  if (found) {
    await c.send(
      new UpdateCommand({
        TableName: Tables.payments,
        Key: {
          studentId: found.studentId as string,
          createdAt: found.createdAt as string,
        },
        UpdateExpression:
          "SET paymentStatus = :s, stripeChargeId = :c, reconciledAt = :n",
        ExpressionAttributeValues: {
          ":s": paymentStatus,
          ":c": (intent.latest_charge as string | undefined) || null,
          ":n": new Date().toISOString(),
        },
      }),
    );
  } else if (studentId) {
    // No row yet (e.g. webhook arrived before the API write completed).
    // Insert a reconciliation record so it shows up in the dashboard.
    await c.send(
      new PutCommand({
        TableName: Tables.payments,
        Item: {
          studentId,
          createdAt: new Date().toISOString(),
          amount: intent.amount,
          paymentStatus,
          description: intent.description || "Stripe charge",
          stripePaymentIntentId: intent.id,
          stripeChargeId: intent.latest_charge as string | undefined,
        },
      }),
    );
  }

  if (studentId && dateTime) {
    await c.send(
      new UpdateCommand({
        TableName: Tables.sessions,
        Key: { studentId, dateTime },
        UpdateExpression:
          "SET #s = :s, stripeChargeId = :c, reconciledAt = :n",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":s": sessionStatus,
          ":c": (intent.latest_charge as string | undefined) || null,
          ":n": new Date().toISOString(),
        },
      }),
    );
  }
}
