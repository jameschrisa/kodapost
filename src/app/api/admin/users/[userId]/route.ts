import { NextRequest, NextResponse } from "next/server";
import { clerkClient, currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/users/[userId] — update user metadata (admin-only) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminUser = await currentUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metadata = adminUser.publicMetadata as { role?: string };
  if (metadata.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await request.json();
  const { plan, role, trialStartDate } = body as {
    plan?: string;
    role?: string;
    trialStartDate?: string;
  };

  // Build the metadata update — only include provided fields
  const publicMetadata: Record<string, unknown> = {};
  if (plan !== undefined) publicMetadata.plan = plan;
  if (role !== undefined) publicMetadata.role = role;
  if (trialStartDate !== undefined) publicMetadata.trialStartDate = trialStartDate;

  if (Object.keys(publicMetadata).length === 0) {
    return NextResponse.json(
      { error: "No updates provided" },
      { status: 400 }
    );
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, { publicMetadata });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
