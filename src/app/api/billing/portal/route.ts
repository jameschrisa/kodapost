import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Customer Portal session so users can manage their
 * subscription (update payment method, cancel, view invoices).
 *
 * Returns: { url: string }
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY
 *   APP_URL
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey.includes("placeholder")) {
    return NextResponse.json(
      { error: "Stripe is not yet configured." },
      { status: 503 }
    );
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const privMeta = user.privateMetadata as { stripeCustomerId?: string };
    const pubMeta = user.publicMetadata as { stripeCustomerId?: string };
    const stripeCustomerId = privMeta.stripeCustomerId || pubMeta.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe to a plan first." },
        { status: 404 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[billing/portal] error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to open billing portal. Please try again." },
      { status: 500 }
    );
  }
}
