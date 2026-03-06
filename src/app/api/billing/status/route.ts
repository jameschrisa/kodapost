import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/billing/status
 *
 * Returns the current subscription status and last 5 invoices for the authenticated user.
 *
 * Returns:
 * {
 *   subscriptionStatus?: string,
 *   currentPeriodEnd?: string,
 *   invoices: Array<{ id, date, amount, currency, status, pdf }>
 * }
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey.includes("placeholder")) {
    // Stripe not configured yet — return empty gracefully
    return NextResponse.json({ invoices: [] });
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    // Read Stripe fields from privateMetadata, fall back to publicMetadata for pre-migration users
    const privMeta = user.privateMetadata as { stripeCustomerId?: string; subscriptionStatus?: string; currentPeriodEnd?: string };
    const pubMeta = user.publicMetadata as { stripeCustomerId?: string; subscriptionStatus?: string; currentPeriodEnd?: string };
    const stripeCustomerId = privMeta.stripeCustomerId || pubMeta.stripeCustomerId;
    const subscriptionStatus = privMeta.subscriptionStatus || pubMeta.subscriptionStatus;
    const currentPeriodEnd = privMeta.currentPeriodEnd || pubMeta.currentPeriodEnd;

    if (!stripeCustomerId) {
      return NextResponse.json({ invoices: [] });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });

    // Fetch last 5 invoices
    const invoiceList = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 5,
    });

    const invoices = invoiceList.data.map((inv) => ({
      id: inv.id,
      date: new Date(inv.created * 1000).toISOString(),
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status ?? "unknown",
      pdf: inv.invoice_pdf ?? null,
    }));

    return NextResponse.json({
      subscriptionStatus,
      currentPeriodEnd,
      invoices,
    });
  } catch (error) {
    console.error("[billing/status] error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to load billing information. Please try again." },
      { status: 500 }
    );
  }
}
