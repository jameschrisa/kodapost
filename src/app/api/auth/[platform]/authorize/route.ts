import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAUTH_CONFIG, type OAuthPlatform } from "@/lib/constants";
import { buildAuthUrl, generateState, generateCodeVerifier, generateCodeChallenge } from "@/lib/oauth";

const VALID_PLATFORMS = Object.keys(OAUTH_CONFIG);

export async function GET(
  _request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;

  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  try {
    // Generate CSRF state parameter
    const state = generateState();

    // Store state in httpOnly cookie for validation on callback
    const cookieStore = cookies();
    cookieStore.set(`nf_oauth_state_${platform}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // X/Twitter uses PKCE — generate code_verifier and store separately
    let codeChallenge: string | undefined;
    if (platform === "x") {
      const codeVerifier = generateCodeVerifier();
      codeChallenge = generateCodeChallenge(codeVerifier);
      cookieStore.set("nf_pkce_verifier_x", codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      });
    }

    // Build platform-specific OAuth URL and redirect
    const url = buildAuthUrl(platform as OAuthPlatform, state, codeChallenge);
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authorization failed";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}?oauth_error=${encodeURIComponent(message)}&platform=${platform}`
    );
  }
}
