import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

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

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = user.publicMetadata as {
    stripeCustomerId?: string;
    subscriptionId?: string;
    subscriptionStatus?: string;
    currentPeriodEnd?: string;
  };

  if (!metadata.stripeCustomerId) {
    return NextResponse.json({ invoices: [] });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-01-28.clover" });

  // Fetch last 5 invoices
  const invoiceList = await stripe.invoices.list({
    customer: metadata.stripeCustomerId,
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
    subscriptionStatus: metadata.subscriptionStatus,
    currentPeriodEnd: metadata.currentPeriodEnd,
    invoices,
  });
}
