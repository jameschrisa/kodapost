import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAUTH_CONFIG, type OAuthPlatform } from "@/lib/constants";
import { exchangeCode, tokenResponseToData } from "@/lib/oauth";
import { setTokenCookie } from "@/lib/token-storage";

const VALID_PLATFORMS = Object.keys(OAUTH_CONFIG);

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.redirect(
      `${appUrl}?oauth_error=invalid_platform&platform=${platform}`
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");

  // Handle OAuth errors from the provider
  if (error) {
    const msg = errorDescription || error;
    return NextResponse.redirect(
      `${appUrl}?oauth_error=${encodeURIComponent(msg)}&platform=${platform}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}?oauth_error=missing_code&platform=${platform}`
    );
  }

  // Validate CSRF state
  const cookieStore = cookies();
  const storedState = cookieStore.get(`nf_oauth_state_${platform}`)?.value;

  if (!state || state !== storedState) {
    return NextResponse.redirect(
      `${appUrl}?oauth_error=state_mismatch&platform=${platform}`
    );
  }

  // Clear state cookie
  cookieStore.delete(`nf_oauth_state_${platform}`);

  // For X/Twitter PKCE — retrieve and clear the stored code_verifier
  let codeVerifier: string | undefined;
  if (platform === "x") {
    codeVerifier = cookieStore.get("nf_pkce_verifier_x")?.value;
    cookieStore.delete("nf_pkce_verifier_x");
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await exchangeCode(platform as OAuthPlatform, code, codeVerifier);
    const tokenData = tokenResponseToData(tokenResponse);

    // Store encrypted token in httpOnly cookie
    setTokenCookie(platform, tokenData);

    // Redirect back to app with success
    return NextResponse.redirect(
      `${appUrl}?oauth_success=true&platform=${platform}`
    );
  } catch (err) {
    // Sanitize error message for URL: truncate, strip newlines, limit to safe chars
    const rawMessage = err instanceof Error ? err.message : "Token exchange failed";
    const sanitized = rawMessage.replace(/[\n\r]/g, " ").slice(0, 100);
    return NextResponse.redirect(
      `${appUrl}?oauth_error=${encodeURIComponent(sanitized)}&platform=${platform}`
    );
  }
}
