# KodaPost

Transform your personal photos into stunning nostalgic social media carousels using AI. KodaPost combines vintage camera aesthetics with intelligent text overlay creation to produce scroll-stopping carousel content.

## Features

### Core Workflow
- **Drag & Drop Photo Upload** -- Upload JPEG, PNG, WebP, or HEIC images (up to 10 MB each) with instant 4:5 previews and automatic HEIC-to-JPEG conversion
- **10 Vintage Camera Styles** -- Apply aesthetics from iconic cameras like the Sony Mavica, Polaroid 600, Kodak EasyShare, and Apple iPhone 3G
- **9 Retro Photo Filters** -- Instagram-inspired filters (1977, Earlybird, Lo-Fi, Nashville, etc.) with 5 adjustable sliders for grain, bloom, shadow fade, color bias, and vignette
- **Smart Text Overlays** -- Claude generates punchy headlines and supporting subtitles tailored to each slide's narrative role (hook, story, closer)
- **Image Source Strategy** -- Intelligent allocation engine that distributes your uploads across slides
- **Carousel Validation** -- Three analog creativity modes (relaxed, recommended, strict) to control image allocation

### Text Editing & Styling
- **Dedicated Text Edit Step** -- Full-featured text editor with live slide previews
- **Free-Position Drag** -- Click and drag text overlays to any position with percentage-based coordinates
- **Rich Font Selection** -- 15+ font families including Inter, Playfair Display, Bebas Neue, Syne, Space Mono, and more
- **Color Schemes** -- 9 curated color presets with one-click application
- **Apply to All** -- Batch-apply font, color, alignment, position, and styling across all slides
- **CSV Import** -- Import headlines and subtitles from CSV files for batch text customization
- **Text Background Padding** -- Adjustable horizontal and vertical padding for text highlight backgrounds

### Voice & AI Caption
- **Voice Recording** -- Record your story via the Web Speech API; transcription auto-fills the Theme field
- **AI Caption Generation** -- Claude generates social media captions from your theme, keywords, and transcription

### Review & Preview
- **Drag-to-Reorder** -- Rearrange slides with drag and drop
- **Multi-Platform Preview** -- Preview slides on Instagram (4:5), TikTok (9:16), LinkedIn (4:5), YouTube (1:1), Reddit (1:1), and Lemon8 (3:4)
- **Mobile Device Simulator** -- Realistic phone frame preview with navigation dots and status bar chrome
- **Image Cropping** -- Per-slide crop controls with platform-native aspect ratios

### Publishing & Export
- **Multi-Platform Export** -- Package carousels as ZIP with per-platform folders at native resolutions
- **Direct Publishing** -- Post carousels directly to connected platforms via OAuth
- **OAuth Integration** -- Connect Instagram, TikTok, LinkedIn, YouTube, Reddit, and Lemon8 accounts with automatic token refresh
- **Scheduled Publishing** -- Set a date and time for future posts

### Headless REST API
- **Generate via API** -- Create carousels programmatically from external apps, bots, and scripts
- **Bearer Token Auth** -- SHA-256 hashed API keys with per-key rate limiting (60 req/min default)
- **Job Tracking** -- Async generation with progress reporting and result retrieval
- **Full Pipeline** -- Image analysis, text overlay generation, Sharp compositing, and AI caption in one call

### General
- **Welcome Screen** -- Animated splash with ambient orb effects and random creative quotes
- **Start Fresh** -- One-click app reset via the header menu to simulate a first-time user experience
- **Auto-Save** -- Project state and workflow progress persist to localStorage
- **Dark Mode** -- System-aware dark/light theme toggle

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) (strict mode) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Components | [shadcn/ui](https://ui.shadcn.com/) (New York style) |
| AI Text & Analysis | [Anthropic Claude API](https://docs.anthropic.com/) (Claude Sonnet 4.5) |
| Image Processing | [Sharp](https://sharp.pixelplumbing.com/) (server-side compositing, filters, HEIC conversion) |
| Database | [Turso](https://turso.tech/) (libSQL/SQLite) via [Drizzle ORM](https://orm.drizzle.team/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Notifications | [Sonner](https://sonner.emilkowal.dev/) |

---

## Prerequisites

- **Node.js 18.17 or later** -- [Download here](https://nodejs.org/)
- **Anthropic API Key** -- [Get one at console.anthropic.com](https://console.anthropic.com/)

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/kodapost.git
cd kodapost
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your keys:

```env
NOSTALGIA_ANTHROPIC_KEY=sk-ant-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** We use `NOSTALGIA_ANTHROPIC_KEY` (not `ANTHROPIC_API_KEY`) to avoid conflicts with development tools that set their own Anthropic key.

### 4. Set up the database

```bash
npm run db:push
```

This creates a local SQLite database file (`local.db`) for the API. For production, see [Production Deployment](#production-deployment) below.

### 5. Generate an admin secret (for API key management)

```bash
echo "API_ADMIN_SECRET=$(openssl rand -hex 32)" >> .env.local
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NOSTALGIA_ANTHROPIC_KEY` | Yes | Anthropic API key for Claude (image analysis, text overlays, captions) |
| `NEXT_PUBLIC_APP_URL` | No | Base URL of the app (defaults to `http://localhost:3000`) |
| `TURSO_DATABASE_URL` | No | Turso database URL. Defaults to `file:local.db` for local SQLite |
| `TURSO_AUTH_TOKEN` | No | Turso auth token (only needed for Turso cloud, leave blank for local) |
| `API_ADMIN_SECRET` | No | Admin secret for creating API keys via `POST /api/v1/keys` |
| `TOKEN_ENCRYPTION_KEY` | No | AES-256-GCM key for OAuth token encryption. Generate with `openssl rand -hex 32` |
| `INSTAGRAM_APP_ID` | No | Instagram/Meta app ID for OAuth publishing |
| `INSTAGRAM_APP_SECRET` | No | Instagram/Meta app secret |
| `TIKTOK_CLIENT_KEY` | No | TikTok app client key |
| `TIKTOK_CLIENT_SECRET` | No | TikTok app client secret |
| `LINKEDIN_CLIENT_ID` | No | LinkedIn app client ID |
| `LINKEDIN_CLIENT_SECRET` | No | LinkedIn app client secret |
| `YOUTUBE_CLIENT_ID` | No | Google Cloud client ID for YouTube |
| `YOUTUBE_CLIENT_SECRET` | No | Google Cloud client secret |
| `REDDIT_CLIENT_ID` | No | Reddit app client ID |
| `REDDIT_CLIENT_SECRET` | No | Reddit app client secret |
| `LEMON8_CLIENT_KEY` | No | Lemon8 app client key |
| `LEMON8_CLIENT_SECRET` | No | Lemon8 app client secret |

---

## Headless REST API

The API allows external applications (Telegram bots, chat agents, CLI tools) to generate carousels programmatically. All endpoints are under `/api/v1/`.

### Authentication

All API endpoints (except `/health`) require a Bearer token:

```
Authorization: Bearer kp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

API keys are created via the admin endpoint and stored as SHA-256 hashes. Each key has a configurable rate limit (default: 60 requests/minute).

### Endpoints

#### `GET /api/v1/health`

Health check. No authentication required.

```bash
curl http://localhost:3000/api/v1/health
```

```json
{
  "status": "ok",
  "version": "1.0.0",
  "database": "connected",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### `POST /api/v1/keys`

Create a new API key. Requires `API_ADMIN_SECRET` as the Bearer token.

```bash
curl -X POST http://localhost:3000/api/v1/keys \
  -H "Authorization: Bearer $API_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Telegram Bot"}'
```

```json
{
  "id": "key_a1B2c3D4e5F6",
  "name": "My Telegram Bot",
  "key": "kp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "prefix": "kp_live_xxxxxxxx",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "note": "Store this key securely. It will not be shown again."
}
```

#### `POST /api/v1/generate`

Generate a carousel. Accepts `multipart/form-data` with images and a JSON config.

```bash
curl -X POST http://localhost:3000/api/v1/generate \
  -H "Authorization: Bearer kp_live_..." \
  -F 'config={"theme":"sunset beach vibes","platforms":["instagram"],"keywords":["travel","sunset"],"slideCount":3}' \
  -F 'images=@photo1.jpg' \
  -F 'images=@photo2.jpg' \
  -F 'images=@photo3.jpg'
```

**Config fields:**

| Field | Required | Type | Description |
|---|---|---|---|
| `theme` | Yes | string | The theme or story of the carousel |
| `platforms` | Yes | string[] | Target platforms: `instagram`, `tiktok`, `linkedin`, `youtube`, `reddit`, `lemon8` |
| `slideCount` | No | number | Number of slides (2-12). Defaults to image count |
| `keywords` | No | string[] | Keywords for text overlays and caption hashtags |
| `cameraProfileId` | No | number | Vintage camera profile ID (0 = none) |
| `captionStyle` | No | string | `storyteller`, `minimalist`, or `data_driven` |
| `filter` | No | object | `{ predefinedFilter: "1977", customParams: { grain_amount: 50 } }` |
| `overlayStyle` | No | object | Font, color, alignment overrides for text overlays |

**Response (200 OK):**

```json
{
  "jobId": "job_a1B2c3D4e5F6",
  "status": "completed",
  "result": {
    "caption": "Chasing golden hour at the coast. Every sunset tells a different story...",
    "slides": [
      {
        "platform": "instagram",
        "slideIndex": 0,
        "imageBase64": "/9j/4AAQ...",
        "format": "jpeg"
      }
    ],
    "slideCount": 3,
    "platforms": ["instagram"]
  }
}
```

#### `GET /api/v1/jobs/:id`

Retrieve a job's status and result. Results are available for 1 hour after creation.

```bash
curl http://localhost:3000/api/v1/jobs/job_a1B2c3D4e5F6 \
  -H "Authorization: Bearer kp_live_..."
```

### API Limits

- **Rate limit**: 60 requests per minute per API key (configurable per key)
- **Max images**: 12 per request
- **Max file size**: 10 MB per image
- **Accepted formats**: JPEG, PNG, WebP
- **Function timeout**: 60s (Vercel Hobby) / 300s (Vercel Pro)
- **Result retention**: 1 hour

---

## Project Structure

```
src/
├── app/
│   ├── actions.ts                  # Server actions (Claude AI + Sharp compositing)
│   ├── globals.css                 # Tailwind base + shadcn theme + custom fonts
│   ├── layout.tsx                  # Root layout with fonts and Toaster
│   ├── page.tsx                    # Main 5-step wizard UI
│   └── api/
│       ├── auth/                   # OAuth routes (authorize, callback, disconnect, verify, status)
│       ├── convert-image/          # HEIC/HEIF → JPEG conversion
│       ├── media/                  # Temporary media file serving (for Instagram uploads)
│       ├── publish/                # Direct publishing per platform
│       └── v1/                     # Headless REST API
│           ├── generate/           #   POST — carousel generation endpoint
│           ├── health/             #   GET — health check
│           ├── jobs/[id]/          #   GET — job status and result retrieval
│           └── keys/               #   POST — API key creation (admin)
│
├── components/
│   ├── builder/                    # Workflow step components
│   │   ├── ImageUploader.tsx       #   Drag & drop upload with HEIC conversion
│   │   ├── ConfigurationPanel.tsx  #   Theme, voice, caption, camera, filter settings
│   │   ├── TextEditPanel.tsx       #   Text editor with font, color, position controls
│   │   ├── CarouselPreview.tsx     #   Review grid, reorder, platform/mobile preview
│   │   ├── PublishPanel.tsx        #   Platform selection, export, direct posting
│   │   └── ...                     #   SlideTextOverlay, MobilePhoneFrame, etc.
│   ├── shared/                     # Reusable UI pieces
│   │   ├── SplashScreen.tsx        #   Animated welcome screen with ambient orbs
│   │   ├── CameraSelector.tsx      #   10-camera visual grid
│   │   ├── FilterSelector.tsx      #   9-filter visual grid + custom sliders
│   │   ├── HeaderMenu.tsx          #   Theme toggle, help, settings, reset
│   │   └── ...
│   └── ui/                         # shadcn/ui primitives
│
├── data/
│   ├── cameras.json                # 10 vintage camera profiles
│   ├── ctas.json                   # Call-to-action presets
│   └── overlay-presets.json        # Text overlay styling presets
│
└── lib/
    ├── api/                        # Headless API utilities
    │   ├── auth.ts                 #   API key authentication + rate limiting
    │   ├── helpers.ts              #   ID generation, validation, type mapping
    │   └── generate-pipeline.ts    #   Generation pipeline orchestration
    ├── db/                         # Database layer (Turso / libSQL)
    │   ├── schema.ts               #   Drizzle ORM table definitions
    │   └── client.ts               #   Database client singleton
    ├── publishers/                 # Platform-specific publishing adapters
    │   ├── instagram.ts            #   Instagram Graph API carousel publishing
    │   ├── tiktok.ts               #   TikTok Content API
    │   ├── linkedin.ts             #   LinkedIn share API
    │   ├── youtube.ts              #   YouTube Community posts
    │   ├── reddit.ts               #   Reddit gallery posts
    │   ├── lemon8.ts               #   Lemon8 Content API
    │   └── media-server.ts         #   Temporary media server for upload URLs
    ├── camera-filters-sharp.ts     # Server-side camera filter processing
    ├── camera-filters-css.ts       # Client-side CSS filter previews
    ├── carousel-validator.ts       # Pre-generation validation
    ├── constants.ts                # Platform specs, defaults, font options, OAuth config
    ├── filter-presets.ts           # 9 predefined filter configurations
    ├── image-source-calculator.ts  # Upload-to-slide allocation engine
    ├── motion.ts                   # Framer Motion animation presets
    ├── oauth.ts                    # OAuth flow utilities
    ├── storage.ts                  # localStorage persistence
    ├── svg-overlay.ts              # SVG text overlay rendering for Sharp
    ├── token-storage.ts            # OAuth token encryption + cookie management
    ├── types.ts                    # Complete TypeScript type system
    └── utils.ts                    # Utility functions
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint checks |
| `npm run db:generate` | Generate Drizzle migration files from schema changes |
| `npm run db:push` | Push schema changes directly to the database |
| `npm run db:studio` | Open Drizzle Studio (visual database browser) |

---

## Production Deployment

### Vercel (Recommended)

KodaPost is built for Vercel deployment. Connect your GitHub repo to Vercel and it will auto-deploy on push.

**Environment variables to set in Vercel:**
- `NOSTALGIA_ANTHROPIC_KEY` (required)
- `TURSO_DATABASE_URL` (required for API)
- `TURSO_AUTH_TOKEN` (required for API)
- `API_ADMIN_SECRET` (required for API key management)
- `NEXT_PUBLIC_APP_URL` (set to your production domain)
- `TOKEN_ENCRYPTION_KEY` (required for OAuth publishing)
- Any platform OAuth credentials you want to enable

**Vercel function timeout:**
- Hobby plan: 60 seconds (sufficient for 3-5 slide carousels)
- Pro plan: 300 seconds (recommended for larger carousels)

### Setting Up Turso (Production Database)

The local SQLite file (`local.db`) works for development. For production, use [Turso](https://turso.tech/), a managed SQLite service with edge replication.

**1. Install the Turso CLI:**

```bash
# macOS
brew install tursodatabase/tap/turso

# Linux
curl -sSfL https://get.tur.so/install.sh | bash
```

**2. Sign up and create a database:**

```bash
turso auth login
turso db create kodapost
```

**3. Get your database URL and auth token:**

```bash
turso db show kodapost --url
# Output: libsql://kodapost-yourorg.turso.io

turso db tokens create kodapost
# Output: your-auth-token
```

**4. Set environment variables:**

```env
TURSO_DATABASE_URL=libsql://kodapost-yourorg.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

**5. Push the schema to production:**

```bash
TURSO_DATABASE_URL=libsql://kodapost-yourorg.turso.io \
TURSO_AUTH_TOKEN=your-auth-token \
npm run db:push
```

### Setting Up OAuth (Social Platform Publishing)

To enable direct publishing to social platforms, you need OAuth app credentials for each platform:

| Platform | Developer Portal | Required Permissions |
|---|---|---|
| Instagram | [developers.facebook.com](https://developers.facebook.com/apps/) | Instagram Graph API, Content Publishing |
| TikTok | [developers.tiktok.com](https://developers.tiktok.com/) | Content Posting API |
| LinkedIn | [linkedin.com/developers](https://www.linkedin.com/developers/apps/) | `w_member_social` scope |
| YouTube | [console.cloud.google.com](https://console.cloud.google.com/) | YouTube Data API v3 |
| Reddit | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps/) | Web app type |
| Lemon8 | Lemon8 developer portal | Content API |

Set the corresponding `*_CLIENT_ID` / `*_CLIENT_SECRET` environment variables. OAuth callback URLs should point to `https://yourdomain.com/api/auth/[platform]/callback`.

### Self-Hosting

KodaPost can also be self-hosted on any platform that supports Node.js 18+:

```bash
npm run build
npm run start
```

For self-hosted deployments:
- Set `TURSO_DATABASE_URL=file:./data/kodapost.db` for a local SQLite file
- Configure your reverse proxy (nginx, Caddy) to handle HTTPS and set appropriate body size limits for image uploads
- The default Vercel body limit is 4.5 MB for API routes; configure your proxy accordingly

---

## License

MIT
