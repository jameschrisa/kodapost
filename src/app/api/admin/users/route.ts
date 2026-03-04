import { NextRequest, NextResponse } from "next/server";
import { clerkClient, currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

/** GET /api/admin/users — list users with metadata (admin-only) */
export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metadata = user.publicMetadata as { role?: string };
  if (metadata.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || "20"), 100);
  const offset = Number(request.nextUrl.searchParams.get("offset") || "0");

  try {
    const client = await clerkClient();
    const result = await client.users.getUserList({ limit, offset });

    const users = result.data.map((u) => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress || null,
      firstName: u.firstName,
      lastName: u.lastName,
      plan: (u.publicMetadata as Record<string, unknown>).plan || "none",
      role: (u.publicMetadata as Record<string, unknown>).role || "user",
      trialStartDate:
        (u.publicMetadata as Record<string, unknown>).trialStartDate || null,
      createdAt: u.createdAt,
      lastSignInAt: u.lastSignInAt,
    }));

    return NextResponse.json({ users, totalCount: result.totalCount });
  } catch (error) {
    console.error("Failed to list users:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to list users" },
      { status: 500 }
    );
  }
}
