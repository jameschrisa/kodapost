# KodaPost — Production Deployment Guide

Deploy KodaPost to **Vercel** with **Turso Cloud** as the production database.

---

## Prerequisites

- [Turso CLI](https://docs.turso.tech/cli/introduction) installed
- [Vercel](https://vercel.com) account (free Hobby tier works)
- [Anthropic API key](https://console.anthropic.com/settings/keys)
- [Clerk account](https://dashboard.clerk.com) for user authentication
- GitHub repository (this repo)

### Install Turso CLI

```bash
# macOS
brew install tursodatabase/tap/turso

# Linux / WSL
curl -sSfL https://get.tur.so/install.sh | bash
```

---

## Step 1: Create Turso Cloud Database

```bash
# Login to Turso
turso auth login

# Create the database (US East region by default)
turso db create kodapost --group default

# Get the database URL
turso db show kodapost --url
# Output: libsql://kodapost-<your-org>.turso.io

# Create an auth token
turso db tokens create kodapost
# Output: eyJhbGciOi... (save this)
```

Save both the URL and auth token — you'll need them for Vercel.

---

## Step 2: Push Schema to Production Database

Run the Drizzle schema push with your Turso Cloud credentials:

```bash
TURSO_DATABASE_URL=libsql://kodapost-<your-org>.turso.io \
TURSO_AUTH_TOKEN=<your-token> \
npm run db:push
```

This creates the `api_keys` and `jobs` tables in your cloud database. You should see output confirming both tables were created.

---

## Step 3: Generate Secrets

Generate two 256-bit secrets for production:

```bash
# Token encryption key (used for encrypting OAuth tokens in cookies)
openssl rand -hex 32

# API admin secret (used for creating API keys via POST /api/v1/keys)
openssl rand -hex 32
```

Save both values securely.

---

## Step 4: Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `kodapost` GitHub repository
3. Vercel auto-detects Next.js — accept the defaults:
   - **Framework:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. **Do not deploy yet** — set environment variables first (Step 5)

---

## Step 5: Set Environment Variables

In the Vercel dashboard, go to **Project Settings > Environment Variables** and add:

### Required

| Variable | Value | Description |
|----------|-------|-------------|
| `NOSTALGIA_ANTHROPIC_KEY` | Your Anthropic API key | Claude API for image analysis and text generation |
| `TURSO_DATABASE_URL` | `libsql://kodapost-<org>.turso.io` | Turso Cloud database URL from Step 1 |
| `TURSO_AUTH_TOKEN` | Token from Step 1 | Turso authentication token |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Your production URL (no trailing slash) |
| `API_ADMIN_SECRET` | Generated in Step 3 | Admin secret for creating API keys |
| `TOKEN_ENCRYPTION_KEY` | Generated in Step 3 | AES-256-GCM key for OAuth token encryption |

### Authentication (Clerk)

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From [Clerk Dashboard](https://dashboard.clerk.com) | Clerk publishable key (enables auth) |
| `CLERK_SECRET_KEY` | From [Clerk Dashboard](https://dashboard.clerk.com) | Clerk secret key for server-side auth |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Sign-in page route |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Sign-up page route |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/` | Redirect after sign-in |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/` | Redirect after sign-up |

> **Clerk Setup:** Create an app at [dashboard.clerk.com](https://dashboard.clerk.com), enable Email + Password sign-in, and optionally configure Google and Apple SSO under **User & Authentication > SSO Connections**. The Clerk Hobby plan includes 50,000 free monthly active users.

> **Admin Dashboard:** Manage users, view sessions, and configure auth settings at [dashboard.clerk.com](https://dashboard.clerk.com). The Users tab lets you view, ban, or delete users, and the Sessions tab shows active sessions.

### Optional (Social Media Publishing)

Only needed if you want to enable social publishing for specific platforms:

| Variable | Where to get it |
|----------|----------------|
| `INSTAGRAM_APP_ID` | [developers.facebook.com](https://developers.facebook.com) |
| `INSTAGRAM_APP_SECRET` | [developers.facebook.com](https://developers.facebook.com) |
| `TIKTOK_CLIENT_KEY` | [developers.tiktok.com](https://developers.tiktok.com) |
| `TIKTOK_CLIENT_SECRET` | [developers.tiktok.com](https://developers.tiktok.com) |
| `LINKEDIN_CLIENT_ID` | [linkedin.com/developers](https://www.linkedin.com/developers) |
| `LINKEDIN_CLIENT_SECRET` | [linkedin.com/developers](https://www.linkedin.com/developers) |

> **Note:** `NEXT_PUBLIC_APP_URL` is a build-time variable. If you change it after the first deploy, trigger a redeployment for the change to take effect.

---

## Step 6: Deploy

Push to `main` or trigger a manual deploy from the Vercel dashboard.

The build typically takes 60-90 seconds.

---

## Step 7: Verify

Run through this checklist after your first deploy:

### 1. Health Check

```bash
curl https://your-app.vercel.app/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "database": "connected",
  "timestamp": "2026-02-16T..."
}
```

If `database` shows `"disconnected"`, check your `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

### 2. Security Headers

Open your app in a browser, open DevTools (Network tab), and verify these response headers are present:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 3. Authentication Test

Visit `https://your-app.vercel.app` — you should be redirected to the sign-in page. Sign in with email/password or use Google/Apple SSO. After sign-in, you should see the carousel builder with your avatar in the header.

### 4. UI Smoke Test

Upload a photo and step through the carousel builder to confirm the Anthropic API integration works. Open the Profile dialog from the header menu to verify Clerk's user management UI.

### 5. Create Your First API Key

```bash
curl -X POST https://your-app.vercel.app/api/v1/keys \
  -H "Authorization: Bearer <your-API_ADMIN_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"name": "My First Key"}'
```

Save the `key` value from the response — **it is shown only once**.

### 6. Test the API Key

```bash
curl https://your-app.vercel.app/api/v1/health \
  -H "Authorization: Bearer <your-api-key>"
```

---

## Troubleshooting

### Build fails with "Missing TURSO_DATABASE_URL"

The database client is lazy-initialized and should not fail at build time. Ensure `TURSO_DATABASE_URL` is set in Vercel environment variables for all environments (Production, Preview, Development).

### Health endpoint returns `"database": "disconnected"`

- Verify `TURSO_DATABASE_URL` starts with `libsql://`
- Check that `TURSO_AUTH_TOKEN` is set correctly
- Turso tokens can expire — regenerate with `turso db tokens create kodapost`

### Generate endpoint times out

The default `maxDuration` is 60 seconds (Vercel Hobby plan). Large carousels with 10+ slides may exceed this limit. Options:
- Reduce slide count
- Upgrade to [Vercel Pro](https://vercel.com/pricing) for 300-second function timeout

### OAuth callbacks fail

1. Verify `NEXT_PUBLIC_APP_URL` is set to your exact production URL (no trailing slash)
2. Trigger a redeployment after changing `NEXT_PUBLIC_APP_URL` (it's a build-time variable)
3. In your OAuth app settings, set the redirect URI to: `https://your-app.vercel.app/api/auth/<platform>/callback`

### Images fail to process

Sharp requires native bindings. Vercel's Lambda runtime includes Sharp support for Node 20. If you see Sharp-related errors:
- Ensure the Vercel project is using Node 20 (check **Settings > General > Node.js Version**)
- The `engines` field in `package.json` signals `>=20.0.0`

---

## Architecture Notes

### Function Regions

The app is configured to deploy to `iad1` (US East / Virginia) to colocate with Turso's default primary region. This minimizes database latency for the generation pipeline which makes multiple DB writes per request.

### Timeouts

The carousel generation endpoint (`POST /api/v1/generate`) runs a synchronous pipeline: image analysis, text overlay generation, Sharp compositing, and caption generation — all within a single request. The 60-second timeout is sufficient for typical 3-5 slide carousels.

### Temporary Storage

Instagram publishing uses `/tmp` for temporary image files (Vercel provides 512MB per function invocation). Files are cleaned up after publishing completes.

### Rate Limiting

API rate limiting is per-key, enforced by counting recent jobs in the database. Default limit: 60 requests per minute per API key.
