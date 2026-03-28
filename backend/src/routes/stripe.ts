import { Router, Request, Response } from "express";
import { requireAuth } from "../lib/auth";
import { requireAdmin } from "../lib/roles";
import { getAuth } from "@clerk/express";
import { getStripe } from "../lib/stripe";

const router = Router();

// All routes require authentication
router.use(requireAuth());

// POST /api/stripe/create-setup-intent
router.post("/create-setup-intent", async (req: Request, res: Response): Promise<void> => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;

    const setupIntent = await getStripe().setupIntents.create({
      metadata: { clerkUserId: userId || "" },
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error("Failed to create setup intent:", error);
    res.status(500).json({ error: "Failed to create setup intent" });
  }
});

// POST /api/stripe/charge (admin only)
router.post("/charge", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentMethodId, amount, customerId, description } = req.body;

    const paymentIntent = await getStripe().paymentIntents.create({
      amount, // in cents
      currency: "usd",
      payment_method: paymentMethodId,
      customer: customerId,
      description,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    res.json({ status: paymentIntent.status });
  } catch (error) {
    console.error("Failed to charge:", error);
    res.status(500).json({ error: "Failed to process charge" });
  }
});

export default router;
