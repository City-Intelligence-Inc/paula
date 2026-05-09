import { Router, Request, Response } from "express";
import { requireAuth } from "../lib/auth";
import { requireAdmin } from "../lib/roles";
import { getAuth } from "@clerk/express";
import { getStripe, STATEMENT_DESCRIPTOR } from "../lib/stripe";
import { getStripeMeta } from "../lib/secrets";

const router = Router();

// GET /api/stripe/config (public — publishable key + mode only)
router.get("/config", async (_req: Request, res: Response): Promise<void> => {
  try {
    const meta = await getStripeMeta();
    res.json({
      publishableKey: meta.publishableKey,
      mode: meta.mode,
      configured: meta.hasSecretKey && !!meta.publishableKey,
    });
  } catch (err) {
    console.error("Failed to load stripe config:", err);
    res.status(500).json({ error: "config error" });
  }
});

// All other routes require authentication
router.use(requireAuth());

// POST /api/stripe/create-setup-intent
router.post("/create-setup-intent", async (req: Request, res: Response): Promise<void> => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    const stripe = await getStripe();
    const setupIntent = await stripe.setupIntents.create({
      metadata: { clerkUserId: userId || "" },
    });
    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error("Failed to create setup intent:", error);
    res.status(500).json({ error: "Failed to create setup intent" });
  }
});

// POST /api/stripe/charge (admin only)
// statement_descriptor is locked to MATHITUDE; student name goes to metadata
// + description only — never to bank-statement-visible fields.
router.post("/charge", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentMethodId, amount, customerId, description, studentId, studentName, sessionDate } = req.body;
    const stripe = await getStripe();

    const metadata: Record<string, string> = {};
    if (studentId) metadata.studentId = studentId;
    if (studentName) metadata.studentName = studentName;
    if (sessionDate) metadata.sessionDate = sessionDate;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method: paymentMethodId,
      customer: customerId,
      description: description || (studentName ? `Mathitude tutoring — ${studentName}` : "Mathitude tutoring"),
      metadata,
      statement_descriptor_suffix: STATEMENT_DESCRIPTOR,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    res.json({ status: paymentIntent.status });
  } catch (error) {
    console.error("Failed to charge:", error);
    res.status(500).json({ error: "Failed to process charge" });
  }
});

export default router;
