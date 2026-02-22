import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";
import type { PlanTier } from "@/lib/plans";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/webhook
 *
 * Handles Stripe webhook events and syncs subscription state to Clerk publicMetadata.
 *
 * Events handled:
 *   checkout.session.completed          — new subscription activated
 *   customer.subscription.updated       — plan/status changed
 *   customer.subscription.deleted       — subscription canceled → revert to trial
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   STRIPE_CREATOR_PRICE_ID
 *   STRIPE_MONSTER_PRICE_ID
 *
 * Setup:
 *   1. Stripe Dashboard → Developers → Webhooks → Add endpoint
 *   2. URL: https://yourdomain.com/api/billing/webhook
 *   3. Subscribe to the 3 events above
 *   4. Copy signing secret → set STRIPE_WEBHOOK_SECRET
 */

function mapPriceToTier(priceId: string): PlanTier {
  if (priceId === process.env.STRIPE_CREATOR_PRICE_ID) return "standard";
  if (priceId === process.env.STRIPE_MONSTER_PRICE_ID) return "pro";
  return "trial";
}

async function findClerkUserByStripeCustomer(customerId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    // Search users with this stripeCustomerId in publicMetadata
    const { data: users } = await client.users.getUserList({ limit: 500 });
    const match = users.find(
      (u) => (u.publicMetadata as { stripeCustomerId?: string }).stripeCustomerId === customerId
    );
    return match?.id ?? null;
  } catch {
    return null;
  }
}

async function updateClerkPlan(
  userId: string,
  updates: {
    plan?: PlanTier;
    subscriptionId?: string;
    stripeCustomerId?: string;
    subscriptionStatus?: string;
    currentPeriodEnd?: string;
  }
) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      ...updates,
    },
  });
}

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || stripeKey.includes("placeholder") || !webhookSecret || webhookSecret.includes("placeholder")) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-01-28.clover" });

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.metadata?.clerkUserId;
        if (!clerkUserId || session.mode !== "subscription") break;

        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id ?? "";
        const tier = mapPriceToTier(priceId);
        const customerId = session.customer as string;
        // current_period_end is on the subscription item in newer Stripe API versions
        const periodEnd = subscription.items.data[0]?.current_period_end;
        const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : undefined;

        await updateClerkPlan(clerkUserId, {
          plan: tier,
          subscriptionId,
          stripeCustomerId: customerId,
          subscriptionStatus: subscription.status,
          currentPeriodEnd,
        });

        console.log(`Upgraded Clerk user ${clerkUserId} → ${tier}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const clerkUserId = await findClerkUserByStripeCustomer(customerId);
        if (!clerkUserId) break;

        const priceId = subscription.items.data[0]?.price.id ?? "";
        const tier = mapPriceToTier(priceId);
        const periodEnd2 = subscription.items.data[0]?.current_period_end;
        const currentPeriodEnd2 = periodEnd2 ? new Date(periodEnd2 * 1000).toISOString() : undefined;

        await updateClerkPlan(clerkUserId, {
          plan: tier,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: currentPeriodEnd2,
        });

        console.log(`Updated Clerk user ${clerkUserId} → ${tier} (${subscription.status})`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const clerkUserId = await findClerkUserByStripeCustomer(customerId);
        if (!clerkUserId) break;

        // Revert to trial, clear subscription fields
        await updateClerkPlan(clerkUserId, {
          plan: "trial",
          subscriptionStatus: "canceled",
          currentPeriodEnd: undefined,
        });

        console.log(`Reverted Clerk user ${clerkUserId} → trial (subscription deleted)`);
        break;
      }

      default:
        // Unhandled event — acknowledge and move on
        break;
    }
  } catch (err) {
    console.error(`Error processing Stripe event ${event.type}:`, err);
    // Return 200 to prevent Stripe from retrying — log the error instead
  }

  return NextResponse.json({ received: true });
}
