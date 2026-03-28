import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paymentMethodId, amount, customerId, description } =
    await req.json();

  // TODO: Verify the requesting user is staff/admin

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

  return NextResponse.json({ status: paymentIntent.status });
}
