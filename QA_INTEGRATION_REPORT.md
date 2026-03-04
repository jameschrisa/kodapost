# KodaPost Integration Testing Report

**Date:** 2026-03-03
**Tester:** Integration Testing Agent
**Scope:** Module interactions, data flow, API contracts, auth flows, storage layers

---

## Executive Summary

Analyzed 7 major integration points across the KodaPost codebase. Found **3 bugs** (1 high severity, 2 medium), **4 design concerns**, and verified **6 areas as correctly integrated**. The codebase is generally well-structured with consistent patterns, but has a few integration seam issues that could cause runtime failures.

---

## 1. Database Integration (Drizzle ORM + Turso)

**Files:** `src/lib/db/schema.ts`, `src/lib/db/client.ts`

### Findings

**PASS - Schema consistency:** All 5 tables (`apiKeys`, `jobs`, `telegramSessions`, `posts`, `provenanceRecords`) use consistent patterns:
- Text PKs with prefix-based IDs (e.g., `post_`, `prov_`, `job_`, `key_`)
- ISO string timestamps stored as `text` columns
- JSON blobs stored via `{ mode: "json" }`
- Proper foreign key references (`jobs.apiKeyId` -> `apiKeys.id`, `provenanceRecords.postId` -> `posts.id`)

**PASS - Client singleton:** `getDb()` uses lazy initialization with proper null guard. Schema is passed to Drizzle for type safety.

**PASS - Query/schema alignment:** Verified all insert and select operations across API routes match schema definitions:
- `src/app/api/publish/[platform]/route.ts:51-65` - `posts` insert matches schema columns
- `src/app/api/provenance/register/route.ts:160-173` - `provenanceRecords` insert matches schema
- `src/app/api/v1/generate/route.ts:177-190` - `jobs` insert matches schema
- `src/app/api/v1/keys/route.ts:71-77` - `apiKeys` insert matches schema

**PASS - Drizzle query operators:** `eq`, `and`, `like`, `gte`, `lte`, `desc` are properly imported and used.

### No Issues Found

---

## 2. Auth Flow (Clerk Middleware + Webhooks)

**Files:** `src/middleware.ts`, `src/app/api/webhooks/clerk/route.ts`

### Findings

**PASS - Middleware route protection:**
- Public routes are correctly listed (splash, about, billing, legal, sign-in/up, API v1, OAuth callbacks, webhooks, health)
- Protected routes require Clerk auth via `auth.protect()`
- Graceful fallback when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is not set (all routes accessible, with console warning)
- Matcher correctly skips static files and Next.js internals

**PASS - Clerk webhook handler:**
- Svix signature verification is correctly implemented (lines 31-59)
- Missing headers return 400
- Invalid signatures return 400
- `user.created` event sets `{ plan: "trial", trialStartDate }` in publicMetadata
- Non-critical errors (metadata update failure) are logged but don't fail the webhook (returns 200)

**CONCERN - Middleware public route exposure:**
The following routes are public but perform sensitive operations:
- `/api/publish(.*)` - Publishing endpoint is public in middleware but has its own Clerk auth check. If Clerk is disabled, publishing works for anyone. This is by design (dev mode), but worth noting.
- `/api/telegram(.*)` - Telegram webhook routes are public (correct, as Telegram sends webhooks)

### No Bugs Found

---

## 3. API Route Contracts

### 3a. Billing Routes

**Files:** `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/webhook/route.ts`, `src/app/api/billing/portal/route.ts`, `src/app/api/billing/status/route.ts`

#### BUG [HIGH] - Billing Portal reads stripeCustomerId from wrong metadata location

**File:** `src/app/api/billing/portal/route.ts:36-38`

The billing portal route reads `stripeCustomerId` exclusively from `publicMetadata`:
```typescript
const metadata = user.publicMetadata as { stripeCustomerId?: string };
if (!metadata.stripeCustomerId) { ... }
```

However, the billing webhook (`src/app/api/billing/webhook/route.ts:77,86`) explicitly:
1. **Deletes** `stripeCustomerId` from `publicMetadata` (line 77)
2. **Stores** it in `privateMetadata` (line 86)

This means after a successful checkout webhook fires, the portal route will always return "No billing account found" because it only checks `publicMetadata`, which has been cleaned.

**Impact:** Paying users cannot access the Stripe billing portal to manage their subscription.

**Fix:** Update `portal/route.ts` to check `privateMetadata` first, then fall back to `publicMetadata` (like `checkout/route.ts` and `status/route.ts` already do).

#### PASS - Billing checkout:
- Validates auth, priceId, and Stripe config
- Creates/reuses Stripe customer
- Stores stripeCustomerId in privateMetadata
- Proper error handling and status codes

#### PASS - Billing webhook:
- Stripe signature verification
- Handles checkout.session.completed, subscription.updated, subscription.deleted
- Maps price IDs to plan tiers
- Returns 200 even on processing errors (correct for webhooks)

#### PASS - Billing status:
- Checks both privateMetadata and publicMetadata for stripeCustomerId (correct)

### 3b. Publish Route

**File:** `src/app/api/publish/[platform]/route.ts`

**PASS - Token lifecycle:** The route correctly:
1. Reads encrypted token from cookie
2. Checks expiration
3. Refreshes if expired (preserving platform user info from original token)
4. Updates cookie with refreshed token

**PASS - Input validation:** Validates platform, auth, request body (array check, non-empty check).

**PASS - Post recording:** `recordPublishedPost` is best-effort (caught errors don't affect response).

### 3c. Provenance Routes

**Files:** `src/app/api/provenance/register/route.ts`, `src/app/api/provenance/verify/route.ts`

**PASS - Register route:** Thorough input validation (hash format, array bounds, string lengths), deduplication check, plan-gated access via `canAccessFeature`.

**PASS - Verify route:** Public endpoint with hash format validation, `LIKE`-based search for hash within comma-separated string, cryptographic signature verification.

### 3d. Posts Route

**File:** `src/app/api/posts/route.ts`

**CONCERN - Status filter injection:** The status query parameter is cast directly without validation:
```typescript
conditions.push(eq(posts.status, status as "draft" | "scheduled" | "published" | "failed"));
```
While Drizzle ORM parameterizes queries (preventing SQL injection), passing an invalid status would return no results silently rather than returning a 400 error.

### 3e. API v1 Routes

**Files:** `src/app/api/v1/generate/route.ts`, `src/app/api/v1/keys/route.ts`, `src/app/api/v1/jobs/[id]/route.ts`

**PASS - API key auth:** All v1 routes use `authenticateApiKey()` (except keys route which uses admin secret). Job retrieval enforces ownership via `apiKeyId` match.

**PASS - Generate route:** Proper multipart validation (file size, type, count limits), job lifecycle (create -> process -> return).

**PASS - Job expiry:** Jobs expire after 1 hour, enforced on retrieval.

---

## 4. Publisher Module Interfaces

**Files:** `src/lib/publishers/*.ts`

### Interface Consistency Analysis

| Publisher  | Function Signature                    | Return Type               | Status       |
|-----------|---------------------------------------|---------------------------|-------------|
| Instagram | `(urls: string[], caption, token, userId)` | `InstagramPublishResult`  | Implemented |
| TikTok    | `(images: Buffer[], caption, token)`  | `TikTokPublishResult`     | Implemented |
| LinkedIn  | `(images: Buffer[], caption, token, authorUrn)` | `LinkedInPublishResult` | Implemented |
| YouTube   | `(images: Buffer[], caption, token, channelId)` | `YouTubePublishResult` | Placeholder |
| Reddit    | `(images: Buffer[], caption, token, subreddit)` | `RedditPublishResult`  | Placeholder |
| X         | `(images: Buffer[], caption, token)`  | `XPublishResult`          | Placeholder |
| Lemon8    | `(images: Buffer[], caption, token)`  | `Lemon8PublishResult`     | Placeholder |

**CONCERN - Inconsistent input types:** Instagram takes `string[]` (URLs) while all others take `Buffer[]`. This is by design (Instagram requires publicly accessible URLs), but the publish route handles this correctly by using `saveTemporaryImages()` only for Instagram.

**BUG [MEDIUM] - `youtube_shorts` OAuth flow will crash:**

`youtube_shorts` is defined in `OAUTH_CONFIG` (line 408-413 of constants.ts) as a valid `OAuthPlatform`. However, `oauth.ts` functions `buildAuthUrl()` and `exchangeCode()` use switch statements that only handle: `instagram`, `tiktok`, `linkedin`, `youtube`, `reddit`, `x`. The `youtube_shorts` case falls to `default` which throws `"Unsupported platform"`.

If a user tries to connect YouTube Shorts via OAuth (`/api/auth/youtube_shorts/authorize`), the authorize route will:
1. Generate a valid state cookie
2. Call `buildAuthUrl("youtube_shorts", state)`
3. Hit the default case and throw
4. Redirect to `?oauth_error=server_error`

The publish route also lists `youtube_shorts` as valid (line 19) and routes it to `publishToYouTube` (line 270), which works correctly. The issue is only in the OAuth flow.

**Fix:** Add `case "youtube_shorts":` alongside `case "youtube":` in `buildAuthUrl()` and `exchangeCode()`, or handle it as a shared-credentials platform that reuses the YouTube OAuth flow.

**PASS - All result types are consistent:** Each publisher returns `{ success: boolean, error?: string }` plus platform-specific IDs.

**PASS - Error handling:** All implemented publishers wrap in try/catch and return error objects instead of throwing.

---

## 5. Server Actions Data Flow

**File:** `src/app/actions.ts`

**PASS - Auth enforcement:** All server actions call `requireAuth()` which checks Clerk auth and applies rate limiting (30/minute/user).

**PASS - SSRF protection:** `isAllowedImageUrl()` blocks private/internal IPs, localhost, link-local, cloud metadata endpoints.

**PASS - API client initialization:** `getAnthropicClient()` is lazy-initialized, uses `NOSTALGIA_ANTHROPIC_KEY` to avoid env var conflicts.

**PASS - JSON parsing safety:** `extractJSON()` strips markdown code fences from LLM responses before JSON parsing.

---

## 6. OAuth Token Management

**File:** `src/lib/oauth.ts`

**PASS - CSRF protection:** OAuth state is stored in httpOnly cookies (10-minute expiry) and validated on callback. State mismatch returns error redirect.

**PASS - PKCE for X/Twitter:** Code verifier is generated, stored in separate cookie, and used in token exchange.

**PASS - Token refresh:** All 6 platforms have refresh implementations. Instagram uses the Meta-specific `fb_exchange_token` flow. Reddit and X use Basic auth for token exchange.

**BUG [MEDIUM] - Instagram token refresh uses access token as refresh token:**

In `src/lib/oauth.ts:606-607`, the Instagram refresh function uses `currentRefreshToken` parameter as the `fb_exchange_token`:
```typescript
const res = await fetch(
  `...&fb_exchange_token=${currentRefreshToken}`
);
```

However, when the initial Instagram token exchange happens (line 249-254), the `TokenResponse` does NOT set a `refreshToken` field -- only `accessToken` is set. The `tokenResponseToData()` function stores `undefined` for `refreshToken`.

In the publish route (line 117), when `isTokenExpired(tokenData)` is true, it checks `tokenData.refreshToken`. Since Instagram never sets a refresh token, this check fails and the user gets `"token has expired and cannot be refreshed"` even though Instagram tokens CAN be refreshed by passing the current access token as `fb_exchange_token`.

**Impact:** Instagram tokens expire after 60 days and cannot be refreshed via the current flow. Users must reconnect manually.

**Fix:** In `exchangeInstagramCode()`, set `refreshToken: accessToken` (Instagram's refresh mechanism reuses the current token). Or, in the publish route, special-case Instagram to use `accessToken` as the refresh token.

---

## 7. Storage Layer Contracts

**Files:** `src/lib/storage.ts`, `src/lib/draft-storage.ts`, `src/lib/token-storage.ts`

### Token Storage

**PASS - Encryption:** AES-256-GCM with random IV. Auth tag is verified on decryption. Format: `iv:authTag:encrypted`.

**PASS - Cookie security:** httpOnly, secure in production, sameSite=lax, path=/api (limits scope), 90-day maxAge.

**PASS - Graceful failure:** `decryptToken()` returns null on any error (corrupted data, wrong key, tampered ciphertext).

### Client-Side Storage (localStorage + IndexedDB)

**PASS - Image/project separation:** Large image data is stored in IndexedDB (hundreds of MB quota), project metadata in localStorage (~5-10 MB quota). Images are stripped from localStorage-stored projects via `createStorableProject()`.

**PASS - Legacy migration:** `migrateLegacyProject()` migrates single-project localStorage to multi-draft IndexedDB, preserving images and metadata. Migration flag prevents re-running.

**PASS - Draft expiration:** `pruneExpiredDrafts()` cleans up expired drafts and their associated images.

**CONCERN - Blob URL persistence:** `saveImagesToIDB()` stores blob URLs, but blob URLs are invalidated on page reload. While the code filters for `data:` and `blob:` prefixes, blob URLs stored in IDB will be unusable after reload. This appears to be understood (the code also strips blob URLs from storable projects), but the IDB store still accepts them.

---

## Summary of Issues

### Bugs

| # | Severity | Location | Description |
|---|----------|----------|-------------|
| 1 | **HIGH** | `src/app/api/billing/portal/route.ts:36-38` | Reads `stripeCustomerId` from `publicMetadata` only, but webhook deletes it from there and stores it in `privateMetadata`. Paying users cannot access billing portal. |
| 2 | **MEDIUM** | `src/lib/oauth.ts` (buildAuthUrl/exchangeCode) | `youtube_shorts` is a valid `OAuthPlatform` but has no handler in the OAuth switch statements. Connecting YouTube Shorts will crash. |
| 3 | **MEDIUM** | `src/lib/oauth.ts:249-254` + publish route | Instagram never sets `refreshToken` in `TokenResponse`, so tokens cannot be refreshed when they expire after 60 days. Users must manually reconnect. |

### Design Concerns

| # | Area | Description |
|---|------|-------------|
| 1 | Middleware | Publish routes are public in middleware (auth is done in-route). When Clerk is disabled, publishing is completely open. |
| 2 | Posts API | Status filter parameter is not validated against allowed enum values. |
| 3 | Publishers | Inconsistent input types (Instagram takes URLs, others take Buffers). Handled correctly in publish route but adds complexity. |
| 4 | Storage | Blob URLs accepted into IDB but unusable after page reload. |

### Verified Integrations (No Issues)

1. Database schema <-> query alignment across all API routes
2. Clerk middleware route protection with proper public/private split
3. Clerk webhook signature verification and user metadata initialization
4. API v1 key auth + job ownership enforcement
5. Token encryption/decryption with AES-256-GCM
6. Server action auth + rate limiting + SSRF protection
