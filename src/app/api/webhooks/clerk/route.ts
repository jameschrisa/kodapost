import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/clerk — Handle Clerk webhook events.
 *
 * On `user.created`, sets default publicMetadata:
 *   { plan: "trial", trialStartDate: <now> }
 *
 * Setup:
 * 1. In Clerk Dashboard → Webhooks → Add Endpoint
 * 2. URL: https://your-domain.com/api/webhooks/clerk
 * 3. Subscribe to: user.created
 * 4. Copy the signing secret → set CLERK_WEBHOOK_SECRET in .env
 */
export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Extract Svix headers for verification
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing webhook headers" },
      { status: 400 }
    );
  }

  const body = await request.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  // Handle user.created — set default trial metadata
  if (event.type === "user.created") {
    const userId = event.data.id as string;

    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          plan: "trial",
          trialStartDate: new Date().toISOString(),
        },
      });
      console.log(`Set trial metadata for new user ${userId}`);
    } catch (err) {
      console.error(`Failed to set metadata for user ${userId}:`, err);
      // Don't return error — webhook should still acknowledge
    }
  }

  return NextResponse.json({ received: true });
}
