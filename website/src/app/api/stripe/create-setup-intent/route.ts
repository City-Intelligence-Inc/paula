import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setupIntent = await getStripe().setupIntents.create({
    metadata: { clerkUserId: userId },
  });

  return NextResponse.json({ clientSecret: setupIntent.client_secret });
}
