import { NextRequest, NextResponse } from "next/server";
import { OAUTH_CONFIG } from "@/lib/constants";
import { clearTokenCookie } from "@/lib/token-storage";

const VALID_PLATFORMS = Object.keys(OAUTH_CONFIG);

export async function POST(
  _request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;

  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  clearTokenCookie(platform);
  return NextResponse.json({ success: true });
}
