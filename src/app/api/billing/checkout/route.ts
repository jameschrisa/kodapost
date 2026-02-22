import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/checkout
 *
 * Creates a Stripe Checkout session for upgrading to Creator Mode or Monster Mode.
 *
 * Body: { priceId: string }
 * Returns: { url: string }  — the Stripe-hosted checkout URL
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY
 *   APP_URL (e.g. https://yourapp.vercel.app)
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey.includes("placeholder")) {
    return NextResponse.json(
      { error: "Stripe is not yet configured. Add STRIPE_SECRET_KEY to your environment variables." },
      { status: 503 }
    );
  }

  let body: { priceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { priceId } = body;
  if (!priceId) {
    return NextResponse.json({ error: "priceId is required" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-01-28.clover" });

  // Get or create Stripe customer for this Clerk user
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = user.publicMetadata as { stripeCustomerId?: string; plan?: string };

  let customerId = metadata.stripeCustomerId;

  if (!customerId) {
    const primaryEmail = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
    const customer = await stripe.customers.create({
      email: primaryEmail?.emailAddress,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
      metadata: { clerkUserId: userId },
    });
    customerId = customer.id;

    // Persist stripeCustomerId to Clerk metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { ...user.publicMetadata, stripeCustomerId: customerId },
    });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=1`,
    cancel_url: `${appUrl}/billing?canceled=1`,
    metadata: { clerkUserId: userId },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    subscription_data: {
      metadata: { clerkUserId: userId },
    },
  });

  return NextResponse.json({ url: session.url });
}
