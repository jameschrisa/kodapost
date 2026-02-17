# Changelog

All notable changes to KodaPost are documented in this file.

---

## CR 19 -- Clerk Authentication Integration & Route Prefetching

### Added
- **Clerk authentication** -- Full end-to-end user authentication with email/password, Google SSO, and Apple SSO via Clerk (`@clerk/nextjs` v6.37.4)
- **ClerkProvider integration** -- Root layout wraps the app in `ClerkProvider` with explicit `publishableKey` prop when Clerk keys are configured
- **Sign-in page** (`/sign-in`) -- Clerk `SignIn` component with catch-all route for multi-step auth flows
- **Sign-up page** (`/sign-up`) -- Clerk `SignUp` component with catch-all route
- **Middleware-based route protection** -- `clerkMiddleware` in `src/middleware.ts` with `createRouteMatcher` for public routes (`/`, `/introduction`, `/sign-in`, `/sign-up`, `/api/v1/*`)
- **Profile dialog** -- In-app `UserProfile` component with `routing="hash"` for modal display, showing profile details, email, phone, connected accounts, and security settings
- **useClerkAuth hook** (`src/hooks/useClerkAuth.ts`) -- Auth state hook with graceful degradation when Clerk is not configured (`isClerkEnabled` flag)
- **ClerkComponents wrapper** (`src/components/shared/ClerkComponents.tsx`) -- Direct ESM import wrappers (`SignedIn`, `SignedOut`, `UserButton`, `SignInButton`, `SignUpButton`, `UserProfile`) with fallback passthrough when Clerk is disabled
- **Route prefetching** -- Added `router.prefetch()` calls for `/introduction`, `/sign-in`, `/sign-up` in `SplashScreen.tsx` and `page.tsx` to eliminate dev-mode lazy compilation delays
- **Force-dynamic rendering** -- Layout exports `dynamic = "force-dynamic"` when Clerk is configured to avoid static page generation errors with Clerk hooks
- **Vercel environment variables** -- All 6 Clerk env vars deployed to Vercel (Production, Preview, Development) via CLI

### Changed
- **layout.tsx** -- Restructured to conditionally wrap app in `ClerkProvider` with explicit `publishableKey` prop; added `force-dynamic` export when Clerk keys are present
- **HeaderMenu.tsx** -- Profile menu item now visible when Clerk auth is active
- **SplashScreen.tsx** -- Added `useRouter` import and `router.prefetch("/introduction")` for instant navigation
- **page.tsx** -- Added `router.prefetch()` for key routes on mount
- **.env.example** -- Added Clerk environment variable documentation (8 new variables)
- **README.md** -- Added Clerk to Tech Stack, Features, Prerequisites, Environment Variables, Project Structure, and Deployment sections
- **DEPLOYMENT.md** -- Added Clerk setup instructions, Authentication section in env vars table, auth verification step in deployment checklist

### Files Modified
| File | Change Type |
|------|-------------|
| `src/app/layout.tsx` | ClerkProvider integration, force-dynamic |
| `src/app/page.tsx` | Route prefetching |
| `src/hooks/useClerkAuth.ts` | Rewritten: direct ESM imports from @clerk/nextjs |
| `src/components/shared/ClerkComponents.tsx` | Rewritten: direct imports with fallback wrappers |
| `src/components/shared/ProfileDialog.tsx` | Added `routing="hash"` to UserProfile |
| `src/components/shared/HeaderMenu.tsx` | Profile menu visibility |
| `src/components/shared/SplashScreen.tsx` | Route prefetching for /introduction |
| `.env.example` | Clerk env var documentation |
| `README.md` | Auth docs, tech stack, project structure |
| `DEPLOYMENT.md` | Clerk deployment instructions |
| `CHANGELOG.md` | This entry |

---

## CR 11 — YouTube, Reddit, Lemon8 Platforms + Portrait-Only Mobile Preview

### Added
- **YouTube platform support** — Community post format (1:1, 1000×1000 JPEG). Includes preview, export, OAuth flow (Google OAuth), and placeholder publisher adapter.
- **Reddit platform support** — Gallery post format (1:1, 1200×1200 PNG). Includes preview, export, OAuth flow (Reddit API with Basic auth), and placeholder publisher adapter.
- **Lemon8 platform support** — Photo post format (3:4, 1080×1440 JPEG). Includes preview, export, OAuth flow, and placeholder publisher adapter.
- **3 publisher adapter stubs** — `youtube.ts`, `reddit.ts`, `lemon8.ts` in `src/lib/publishers/` returning "coming soon" messages until platform APIs are integrated.
- **6 new OAuth environment variables** — `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `LEMON8_CLIENT_KEY`, `LEMON8_CLIENT_SECRET`.
- **Platform preview buttons** — Review page now shows 6 platform previews (Instagram, TikTok, LinkedIn, YouTube, Reddit, Lemon8) plus Letterbox and Mobile.

### Removed
- **Landscape mobile preview** — Removed the portrait/landscape orientation toggle from the mobile device preview. Social media carousels do not adjust to landscape mode, so portrait-only is the correct behavior.
- **`MobileOrientation` type** — Deleted from `constants.ts`; `landscapeClass` removed from mobile aspect ratio configs.

### Changed
- **MobilePhoneFrame.tsx** — Simplified to portrait-only layout. Removed `orientation` prop and all `isLandscape` conditional rendering.
- **CarouselPreview.tsx** — Removed `mobileOrientation` state, `RotateCcw` icon import, orientation toggle button, and landscape-specific grid/pagination logic. Pagination is now a constant 6 slides per page.
- **constants.ts** — Added `PLATFORM_LIMITS`, `PLATFORM_IMAGE_SPECS`, `PLATFORM_PREVIEW_CONFIG`, and `OAUTH_CONFIG` entries for YouTube, Reddit, and Lemon8. Renamed `portraitClass` to `aspectClass` in `MOBILE_ASPECT_RATIOS`.
- **types.ts** — Extracted shared `Platform` type with 6 literals, updated all 5 union locations to use it.
- **actions.ts** — Added `youtube`, `reddit`, `lemon8` to `PLATFORM_SPEC_MAP`.
- **oauth.ts** — Added `buildAuthUrl`, `exchangeCode`, and `refreshToken` cases for YouTube (Google standard), Reddit (Basic auth), and Lemon8 (client_key). Added 3 exchange functions.
- **publish/[platform]/route.ts** — Extended `VALID_PLATFORMS` to 6, added 3 switch cases calling placeholder publishers.
- **PublishPanel.tsx** — Added 3 platform entries with icons (YouTube from Lucide, Reddit/Lemon8 SVG icons). Updated grid layout for 6 platforms.
- **PublishDialog.tsx** — Updated `Platform` type to include new platforms.
- **SettingsDialog.tsx** — Added YouTube, Reddit, Lemon8 to `PLATFORM_META` with icons and placeholders.
- **storage.ts** — Added 3 new default social accounts (inactive) for YouTube, Reddit, Lemon8.
- **.env.example** — Added 6 new OAuth environment variables.

### Files Modified
| File | Change Type |
|------|-------------|
| `src/lib/constants.ts` | Platform configs + remove landscape |
| `src/lib/types.ts` | Extracted `Platform` type |
| `src/components/builder/MobilePhoneFrame.tsx` | Portrait-only simplification |
| `src/components/builder/CarouselPreview.tsx` | Remove orientation state/toggle |
| `src/app/actions.ts` | Extend PLATFORM_SPEC_MAP |
| `src/lib/publishers/youtube.ts` | **New file** — placeholder publisher |
| `src/lib/publishers/reddit.ts` | **New file** — placeholder publisher |
| `src/lib/publishers/lemon8.ts` | **New file** — placeholder publisher |
| `src/app/api/publish/[platform]/route.ts` | Extend VALID_PLATFORMS + switch cases |
| `src/lib/oauth.ts` | OAuth flows for 3 new platforms |
| `src/components/builder/PublishPanel.tsx` | 6-platform UI + icons |
| `src/components/builder/PublishDialog.tsx` | Updated Platform type |
| `src/components/shared/SettingsDialog.tsx` | 6-platform settings |
| `src/lib/storage.ts` | Default settings for new platforms |
| `.env.example` | New OAuth env vars |

---

## [Unreleased] — Mobile Preview Fixes, Text Positioning, Publish from Review

### Fixed
- **20:9 mobile phone frame not rendering** — Added `./src/lib/**/*.{js,ts}` to `tailwind.config.ts` content array. Tailwind JIT was not scanning `src/lib/constants.ts` where aspect ratio classes (`aspect-[9/19.5]`, `aspect-[9/20]`, etc.) are defined as string literals, so those CSS classes were never generated.
- **Text overlay misalignment in mobile simulator** — Replaced the `absolute inset-0` wrapper inside `MobilePhoneFrame` with an aspect-ratio-constrained container (`relative w-full` + platform aspect class). Text overlays now position relative to the actual image area instead of the full phone screen, so `freePosition` percentages land correctly within the visible image (not in letterbox bars).
- **Landscape mobile mode extremely long page** — Made `SLIDES_PER_PAGE` dynamic: 4 slides per page in landscape mobile mode, 6 otherwise. Added `useEffect` to reset `currentPage` to 0 when preview mode or orientation changes.
- **Mobile mode image rendering** — Changed `imageObjectFit` so mobile mode uses `object-cover` instead of `object-contain`. The aspect-ratio container now handles letterboxing, and images fill the container correctly.

### Added
- **Publish button on Review page** — Added a "Publish" button alongside the existing "Export" button in the Review header.
- **PublishDialog component** (`src/components/builder/PublishDialog.tsx`) — New dialog with:
  - Platform selection cards (Instagram, TikTok, LinkedIn) showing OAuth connection status
  - Caption textarea pre-filled from project, editable, with 2200 character limit
  - "Post Now" button for direct publishing to all selected connected platforms
  - Collapsible "Schedule for Later" section with date and time inputs
- **Scheduled publishing** — Added `scheduledPublishAt` (ISO timestamp) and `scheduledPlatforms` fields to `CarouselProject` type. A visual amber badge shows in the Review header when a publish is scheduled.

### Changed
- **CarouselPreview.tsx** — Refactored header to button group (Export outline + Publish primary), added publish dialog integration, dynamic pagination, and page reset on mode change.
- **PublishPanel.tsx** — Exported `PLATFORMS` constant for reuse by `PublishDialog`.
- **types.ts** — Added `scheduledPublishAt` and `scheduledPlatforms` to `CarouselProject`.
- **tailwind.config.ts** — Extended content scanning to `src/lib/**/*.{js,ts}`.

### Files Modified
| File | Change Type |
|------|-------------|
| `tailwind.config.ts` | Added content path |
| `src/components/builder/CarouselPreview.tsx` | Fixed mobile rendering, dynamic pagination, added Publish button + dialog |
| `src/components/builder/PublishDialog.tsx` | **New file** — Publish/schedule dialog |
| `src/components/builder/PublishPanel.tsx` | Exported PLATFORMS constant |
| `src/lib/types.ts` | Added scheduling fields |

---

## CR 10 — Mobile Device Preview

### Added
- **Mobile phone frame simulator** (`src/components/builder/MobilePhoneFrame.tsx`) — CSS-only phone mockup with:
  - Metallic gradient frame (titanium/aluminum look)
  - Dynamic Island with camera dot
  - Simulated status bar (time, signal bars, battery as inline SVGs)
  - Carousel navigation dots (max 7 visible, overflow indicators, active dot sizing)
  - Physical side buttons (power, volume up/down)
  - Home indicator bar
  - Portrait and landscape orientations
- **Mobile aspect ratio configurations** in `src/lib/constants.ts`:
  - `19.5:9` — iPhone 14/15, Galaxy S23
  - `20:9` — Galaxy S24, Pixel 8
  - Both portrait and landscape aspect classes per ratio
- **Mobile preview mode** on Review page — Toggle between platform/letterbox/mobile views
- **Mobile sub-controls** — Screen ratio selector and portrait/landscape toggle
- **Grid layout adjustments** — 2–4 columns for portrait mobile, 1–2 columns for landscape

### Changed
- **CarouselPreview.tsx** — Added mobile preview state (`mobileAspectRatio`, `mobileOrientation`), mobile grid column classes, mobile-specific `gridScale` values, and `MobilePhoneFrame` integration.
- **constants.ts** — Added `MOBILE_ASPECT_RATIOS` config and `MobileAspectRatio`/`MobileOrientation` types.

### Files Modified
| File | Change Type |
|------|-------------|
| `src/components/builder/MobilePhoneFrame.tsx` | **New file** |
| `src/components/builder/CarouselPreview.tsx` | Mobile preview integration |
| `src/lib/constants.ts` | Mobile aspect ratio configs and types |

---

## CR 9 — Review Page Redesign

### Changed
- **Removed Final Review strip** from `CarouselPreview.tsx` — Replaced with a larger card grid layout
- **Grid layout** — Changed from single horizontal scroll strip to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Pagination** — Added pagination controls (6 slides per page) with Previous/Next buttons and page counter

### Files Modified
| File | Change Type |
|------|-------------|
| `src/components/builder/CarouselPreview.tsx` | Grid layout, pagination |

---

## CR 8 — CSV Import for Text Overrides

### Added
- **CSVImportDialog component** (`src/components/builder/CSVImportDialog.tsx`) — Dialog for importing CSV files with headline/subtitle columns
- **CSV override system** — `csvOverrides` field on `CarouselProject` stores imported text data; applied during `generateCarousel` server action to override AI-generated text
- **CSV Import button** on ConfigurationPanel — Opens the import dialog, shows imported row count badge

### Changed
- **ConfigurationPanel.tsx** — Added CSV import button, state, and handler
- **actions.ts** — `generateCarousel` applies CSV overrides to slide text during generation
- **types.ts** — Added `csvOverrides` field to `CarouselProject`

### Files Modified
| File | Change Type |
|------|-------------|
| `src/components/builder/CSVImportDialog.tsx` | **New file** |
| `src/components/builder/ConfigurationPanel.tsx` | CSV import integration |
| `src/app/actions.ts` | CSV override application in `generateCarousel` |
| `src/lib/types.ts` | Added `csvOverrides` field |

---

## CR 7 — Color Schemes

### Added
- **9 color scheme presets** — White on Dark, Black on Light, Warm Gold, Sunset, Ocean, Forest, Neon, Pastel, Vintage Sepia
- **Color scheme selector** in TextEditPanel — Visual swatches with live preview
- **Apply color to all slides** — Batch operation included in "Apply to All" action

### Changed
- **TextEditPanel.tsx** — Added color scheme picker UI and handlers
- **SlideTextOverlay.tsx** — Updated to apply `textColor` and `backgroundColor` from overlay styling

### Files Modified
| File | Change Type |
|------|-------------|
| `src/components/builder/TextEditPanel.tsx` | Color scheme picker |
| `src/components/builder/SlideTextOverlay.tsx` | Color rendering |

---

## CR 6 — Italic Toggle

### Added
- **Italic toggle button** in TextEditPanel — Independent italic styling control
- **`fontStyle` field** on `TextOverlay.styling` and `GlobalOverlayStyle` — Supports `"normal"` or `"italic"` values
- **Apply italic to all slides** — Included in batch "Apply to All" operation

### Changed
- **TextEditPanel.tsx** — Added italic toggle button
- **SlideTextOverlay.tsx** — Renders `fontStyle` from overlay styling
- **types.ts** — Added `fontStyle` to `TextOverlay.styling` and `GlobalOverlayStyle`

### Files Modified
| File | Change Type |
|------|-------------|
| `src/components/builder/TextEditPanel.tsx` | Italic toggle |
| `src/components/builder/SlideTextOverlay.tsx` | Italic rendering |
| `src/lib/types.ts` | `fontStyle` field |

---

## CR 5 — Text Alignment

### Added
- **Text alignment controls** — Left, center, and right alignment buttons in TextEditPanel
- **`textAlign` field** on `TextOverlay.styling` and `GlobalOverlayStyle`
- **Apply alignment to all slides** — Included in batch operation

### Changed
- **TextEditPanel.tsx** — Added alignment control UI
- **SlideTextOverlay.tsx** — Renders `textAlign` from overlay styling
- **types.ts** — Added `textAlign` to relevant interfaces

### Files Modified
| File | Change Type |
|------|-------------|
| `src/components/builder/TextEditPanel.tsx` | Alignment controls |
| `src/components/builder/SlideTextOverlay.tsx` | Alignment rendering |
| `src/lib/types.ts` | `textAlign` field |

---

## CR 4 — Font Selection (9 Fonts)

### Added
- **9 font families** — Inter, Playfair Display, Bebas Neue, Caveat, Space Mono, Oswald, Merriweather, Permanent Marker, Raleway
- **Font selector dropdown** in TextEditPanel — Live preview of each font
- **Google Fonts integration** — Font imports added to `globals.css`
- **`resolveFontOption` utility** — Maps font names to CSS `fontFamily` values with proper fallbacks
- **Apply font to all slides** — Batch operation in "Apply to All"

### Changed
- **globals.css** — Added `@import` rules for all 9 Google Fonts
- **TextEditPanel.tsx** — Font selector dropdown
- **SlideTextOverlay.tsx** — Dynamic font resolution via `resolveFontOption()`
- **constants.ts** — Added `FONT_OPTIONS` array with font definitions

### Files Modified
| File | Change Type |
|------|-------------|
| `src/app/globals.css` | Google Fonts imports |
| `src/components/builder/TextEditPanel.tsx` | Font selector |
| `src/components/builder/SlideTextOverlay.tsx` | Font resolution |
| `src/lib/constants.ts` | `FONT_OPTIONS` config |

---

## CR 3 — AI Caption Generation

### Added
- **`generateCaption` server action** in `actions.ts` — Calls Claude API with theme, keywords, and optional transcription to generate a social media caption
- **AI Caption section** on ConfigurationPanel — "Generate with AI" button, caption textarea, character counter (2200 max)
- **`caption` field** on `CarouselProject` — Stores the generated or user-edited caption
- **Caption syncing** — Debounced 500ms sync from textarea to project state

### Changed
- **ConfigurationPanel.tsx** — Added caption generation UI, state, and handler
- **PublishPanel.tsx** — Initialized caption from `project.caption`
- **actions.ts** — Added `generateCaption` server action
- **types.ts** — Added `caption` field to `CarouselProject`

### Files Modified
| File | Change Type |
|------|-------------|
| `src/app/actions.ts` | `generateCaption` action |
| `src/components/builder/ConfigurationPanel.tsx` | Caption UI |
| `src/components/builder/PublishPanel.tsx` | Caption initialization |
| `src/lib/types.ts` | `caption` field |

---

## CR 2 — Voice Recording & Transcription

### Added
- **Voice recording** on ConfigurationPanel — "Record Story" button using the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Live transcription preview** — Shows recording indicator and real-time transcription text
- **Auto-fill theme field** — When recording stops, transcription (first 100 chars) is copied into the theme input
- **`storyTranscription` field** on `CarouselProject` — Stores the full voice transcription

### Changed
- **ConfigurationPanel.tsx** — Added audio recording state, `startRecording()`, `stopRecording()`, transcription preview UI
- **types.ts** — Added `storyTranscription` field to `CarouselProject`

### Files Modified
| File | Change Type |
|------|-------------|
| `src/components/builder/ConfigurationPanel.tsx` | Voice recording |
| `src/lib/types.ts` | `storyTranscription` field |

---

## CR 1 — Free-Position Text Dragging & Text Edit Step

### Added
- **TextEditPanel component** (`src/components/builder/TextEditPanel.tsx`) — Dedicated text editing step with:
  - Side-by-side slide preview and controls panel
  - Slide navigation (prev/next) with slide counter
  - Headline and subtitle text inputs
  - Click-and-drag text positioning on the slide preview
  - "Apply to All" batch operation with `styleRefreshKey` pattern for force re-sync
- **SlideTextOverlay component** (`src/components/builder/SlideTextOverlay.tsx`) — Renders text overlays with:
  - Free-position support using CSS `left`/`top` percentages and `transform: translate(-50%, -100%)`
  - Fallback to grid-based positioning when `freePosition` is not set
  - Scale-aware rendering for grid preview thumbnails
  - Dynamic font family resolution
- **`freePosition` field** on `TextOverlay.positioning` — `{ x: number; y: number }` with 0–100 range
- **`globalOverlayStyle` field** on `CarouselProject` — Stores the global style config applied before generation
- **5-step workflow** — Added "edit" step between "configure" and "review" in `page.tsx`

### Changed
- **page.tsx** — Workflow expanded from 4 steps to 5 (upload → configure → edit → review → publish)
- **StepIndicator.tsx** — Updated step labels and count
- **types.ts** — Added `freePosition`, `GlobalOverlayStyle`, `textAlign`, `fontStyle` fields

### Files Modified
| File | Change Type |
|------|-------------|
| `src/components/builder/TextEditPanel.tsx` | **New file** |
| `src/components/builder/SlideTextOverlay.tsx` | **New file** |
| `src/app/page.tsx` | 5-step workflow |
| `src/components/builder/StepIndicator.tsx` | Step labels |
| `src/lib/types.ts` | Overlay types |

---

## Initial Release — Core Carousel Builder

### Added
- **5-step workflow** — Upload → Configure → Edit Text → Review → Publish
- **Drag & drop image upload** with validation (JPEG, PNG, WebP, 10 MB max)
- **10 vintage camera profiles** from `cameras.json`
- **AI image generation** via Replicate Flux Pro
- **AI text overlay generation** via Claude API
- **Image source strategy** — Smart allocation of uploads vs. AI-generated images
- **Carousel validation** — Three analog creativity modes (relaxed, recommended, strict)
- **Multi-platform export** — ZIP packaging with Sharp compositing for Instagram, TikTok, LinkedIn
- **Direct publishing** via OAuth — Instagram Graph API, TikTok Content API, LinkedIn Share API
- **OAuth flow** — Authorize, callback, disconnect, and status endpoints
- **Token storage** — httpOnly cookie-based OAuth token management with auto-refresh
- **SVG overlay compositing** — Server-side text overlay rendering via Sharp + SVG
- **localStorage persistence** — Versioned project auto-save
- **Settings dialog** — Social account management and default platform preferences
- **Toast notifications** via Sonner

### Tech Stack
- Next.js 14 (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui (New York)
- Anthropic Claude API, Replicate Flux Pro, Sharp, Lucide React, Sonner
