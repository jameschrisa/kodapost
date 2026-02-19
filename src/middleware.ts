import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Clerk Auth Middleware for KodaPost.
 *
 * When Clerk is configured (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set),
 * this middleware protects non-public routes. When Clerk is not configured,
 * all routes are accessible (development mode without auth).
 *
 * Public routes:
 *  - /              Home (splash screen is public; auth gate is client-side)
 *  - /introduction  Informational page
 *  - /guide         Getting started guide
 *  - /legal/*       Legal pages (terms, privacy, data)
 *  - /sign-in, /sign-up  Clerk auth pages
 *  - /api/v1/*      Headless API (uses its own API-key auth)
 *  - /api/auth/*    OAuth callback routes for social platforms
 *  - /api/convert-image  Image conversion utility
 *  - /api/media/*   Media serving
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/introduction",
  "/guide",
  "/legal(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/preview(.*)",
  "/api/v1(.*)",
  "/api/auth(.*)",
  "/api/convert-image",
  "/api/media(.*)",
  "/api/publish(.*)",
  "/api/telegram(.*)",
  "/api/preview(.*)",
  "/api/webhooks(.*)",
]);

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export default function middleware(request: NextRequest) {
  if (isClerkEnabled) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (clerkHandler as any)(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
