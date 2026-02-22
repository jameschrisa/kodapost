# KodaPost User Guide

**Version:** Current Release
**Last Updated:** February 2026

---

## Table of Contents

1. [What Is KodaPost?](#1-what-is-kodapost)
2. [Getting Started](#2-getting-started)
3. [Your Drafts — Multi-Draft System](#3-your-drafts--multi-draft-system)
4. [The Carousel Builder — Step by Step](#4-the-carousel-builder--step-by-step)
   - [Step 1: Upload](#step-1-upload)
   - [Step 2: Setup](#step-2-setup)
   - [Step 3: Stylize](#step-3-stylize)
   - [Step 4: Editorial](#step-4-editorial)
   - [Step 5: Finalize](#step-5-finalize)
   - [Step 6: Publish](#step-6-publish)
5. [Audio & Music](#5-audio--music)
6. [Storyboard & Video Reel](#6-storyboard--video-reel)
7. [Platform Previews & Mobile Simulator](#7-platform-previews--mobile-simulator)
8. [Vintage Camera Profiles](#8-vintage-camera-profiles)
9. [Retro Filters & Fine-Tuning](#9-retro-filters--fine-tuning)
10. [Text Overlays & Typography](#10-text-overlays--typography)
11. [Exporting Your Content](#11-exporting-your-content)
12. [Direct Publishing to Social Platforms](#12-direct-publishing-to-social-platforms)
13. [Plans & Feature Access](#13-plans--feature-access)
14. [The Headless API](#14-the-headless-api)
15. [Telegram Bot](#15-telegram-bot)
16. [Activity Log & History](#16-activity-log--history)
17. [Account & Settings](#17-account--settings)
18. [Tips for Great Posts](#18-tips-for-great-posts)
19. [Frequently Asked Questions](#19-frequently-asked-questions)

---

## 1. What Is KodaPost?

KodaPost is an AI-assisted content creation tool that transforms your personal photos into polished, on-brand social media carousels and video reels. It combines the warmth of vintage photography aesthetics — think Polaroids, Kodak film, and early digital cameras — with intelligent text overlay generation to produce scroll-stopping content for Instagram, TikTok, LinkedIn, YouTube, Reddit, and Lemon8.

**The core philosophy:** You are the creator. KodaPost's AI (called **Koda**) handles the technical heavy lifting — image compositing, platform sizing, text suggestions, filter processing — so you stay focused on your story.

### What KodaPost Is For

- **Content Creators** who want consistent, aesthetically cohesive multi-platform posts without needing design skills
- **Entrepreneurs & Brands** who need scroll-stopping carousels that feel personal and authentic
- **Artists & Photographers** who want their work presented beautifully across every platform
- **Anyone** who values their own voice and story over generic algorithmic content

### What Koda Does (and Doesn't Do)

| Koda handles | You control |
|---|---|
| Image filters, grain, color grading | Which photos to use |
| Platform sizing and aspect ratios | The story and narrative |
| Text overlay suggestions | Final text, font, position |
| Caption drafting | Your brand voice and editing |
| Technical compositing and export | Which platforms to post to |
| Video reel assembly | The creative direction |

---

## 2. Getting Started

### Creating an Account

KodaPost supports **email/password**, **Google Sign-In**, and **Apple Sign-In** via Clerk authentication. You can also try the app without an account — authentication is optional during early access.

1. Open [KodaPost](https://kodapost.app)
2. Click **Sign In** or **Get Started**
3. Choose your preferred sign-in method
4. You'll land on the main app screen

### The Welcome Screen

On your first visit, an animated splash screen introduces KodaPost with a random creative quote. Click **Get Started** to enter the app.

### The Introduction Page

Visit **/introduction** for a short overview of KodaPost's philosophy — it explains the human-first approach and how Koda assists rather than replaces your creativity. This is useful reading before your first post.

### Dark Mode

KodaPost follows your system preference for light/dark mode by default. You can override it using the **theme toggle** in the top-right header menu.

---

## 3. Your Drafts — Multi-Draft System

KodaPost uses a **multi-draft system** so you can work on several carousels at the same time and come back to unfinished projects.

### Opening the Draft Panel

Click the **Drafts** icon or header menu item to open the draft panel. It shows:

- Your current draft (marked "Active")
- All saved drafts with last-updated time
- How many draft slots you've used out of your plan limit

### Draft Limits by Plan

| Plan | Max Drafts | Expiration |
|---|---|---|
| Trial | 1 | 30 days |
| Starter | 1 | 30 days |
| Standard | 5 | 30 days |
| Pro | 15 | Never |

When you hit your draft limit, the **New Draft** button shows "Upgrade for more." Existing drafts can still be edited.

### Creating a New Draft

Click **New Draft** to start a blank project. Each draft is stored independently with its own images, settings, and progress.

### Resuming a Draft

Click **Resume** on any draft card to load it. The app returns exactly to where you left off — including your images, step, text overlays, audio, and settings.

### Renaming a Draft

Click the draft name to edit it inline. Press **Enter** or click elsewhere to save.

### Deleting a Draft

Click the trash icon on a draft card. You'll be asked to confirm before deletion. This is permanent.

### Draft Expiration

Drafts on Trial, Starter, and Standard plans expire after 30 days of inactivity. A warning badge appears on the draft card when fewer than 3 days remain. Pro plan drafts never expire.

### Auto-Save

Your work is auto-saved continuously as you make changes. Images are stored in **IndexedDB** (your browser's local database), and settings are stored in **localStorage**. Nothing is lost if you close the tab.

---

## 4. The Carousel Builder — Step by Step

The carousel builder is a **6-step wizard** that guides you from raw photos to a finished, platform-ready post.

---

### Step 1: Upload

**Goal:** Select the photos that tell your story.

#### Uploading Photos

- **Drag and drop** photos directly onto the upload area, or click to open the file picker
- Supported formats: **JPEG, PNG, WebP, HEIC**
- Max file size: **10 MB per image**
- Max images: **10 photos** per carousel
- HEIC files (iPhone format) are automatically converted to JPEG

#### Post Type

Below the upload area, choose your post type:

- **Single Post** — One image, one story (for standalone posts)
- **Carousel** — Multi-slide storytelling with 2–12 slides (default when you upload multiple images)

The app selects the appropriate type automatically based on how many images you upload, but you can switch manually.

#### What Happens Next

Uploaded images appear as preview thumbnails. Once you have at least one image, the **Continue** button activates. Click it to move to Setup.

> **Tip:** Upload 3–6 photos for the best carousel experience. A mix of wide establishing shots, close-up details, and people creates a more dynamic story.

---

### Step 2: Setup

**Goal:** Tell Koda your story and set the content parameters.

#### Your Story (Theme)

The **Story** field is the most important input — it's what Koda uses to write your text overlays and caption. Be specific. "Coffee shop in Lisbon, rainy Tuesday, found the best pastel de nata" works far better than "coffee shop."

- Max: **300 characters**
- You can dictate your story by clicking the **microphone icon** (Chrome/Edge only). Your spoken words are transcribed and auto-filled into the theme field.

#### Vibes (Keywords / Tone)

Select one or more **Vibe** tags to set the emotional tone of your content:

| Vibe | Best For |
|---|---|
| 💬 Relatable | Everyday moments, personal stories |
| ✨ Inspirational | Aspirational content, motivational posts |
| 📢 Promotional | Products, services, launches |
| 🔥 Controversial | Opinion pieces, conversation starters |
| 👀 Observational | Trends, social commentary, slice-of-life |

#### Slides & Text Overlays

Use the **Slides** tab to set the number of slides (2–12 for carousel). Use the **Text Overlays** tab to toggle:

- **Headlines** — Main text overlay per slide (on by default for carousels)
- **Subtitles** — Supporting secondary text (off by default)

#### CSV Import

If you have your own headlines and subtitles ready, click **Import CSV** to upload a spreadsheet. The CSV should have columns named `headline` (or `title`/`primary`) and optionally `subtitle` (or `caption`/`secondary`). One row per slide.

#### Social Caption

The **Caption** section is where you write or generate the social media post that will accompany your carousel.

**Writing Styles:**

| Style | What It Produces |
|---|---|
| 📖 Storyteller | Narrative arc, first-person, emotional depth |
| ✏️ Minimalist | Short, punchy, lots of white space |
| 📊 Data-Driven | Facts, stats, and structured points |
| 😄 Witty | Humor, wordplay, conversational |
| 🎓 Educational | Tips, how-tos, explanatory |
| 🪶 Poetic | Lyrical, metaphor-rich, artistic |
| ✍️ Custom | Describe your own style in a text field |

Click **Create a Caption** to have Koda generate a caption based on your story, vibes, and selected writing style. You can edit the result freely — the 2,200 character counter shows how much space you have.

> **Note:** Reddit captions are limited to 300 characters. LinkedIn performs best under 700 characters.

---

### Step 3: Stylize

**Goal:** Apply a vintage camera aesthetic and/or retro filters to your photos.

The Stylize panel has three tabs:

#### Emulation Tab — Vintage Camera Profiles

Choose from 10 iconic camera profiles that replicate the look of classic hardware:

| Camera | Era | Signature Look |
|---|---|---|
| **Sony Mavica** | 1990s | 8-bit color, CRT warmth, heavy digital compression artifacts |
| **Canon PowerShot ELPH** | Y2K | Direct flash, oversaturated, party-photo energy |
| **Nikon Coolpix** | Early 2000s | Industrial sharpness, fine grain, neutral white balance |
| **Olympus Camedia** | Early 2000s | Warm glow, CCD bloom, dreamy soft edges |
| **Fujifilm FinePix** | Mid-2000s | Vibrant Velvia film simulation, smooth skin tones |
| **Casio Exilim** | Mid-2000s | Over-sharpened contours, cool blue shadows |
| **Kodak EasyShare** | Mid-2000s | Golden amber tones, soft album-style bloom |
| **Panasonic Lumix** | Late 2000s | High precision, muted palette, slight blue cast |
| **Polaroid 600** | Analog era | Heavy vignette, instant film fade, paper grain |
| **Apple iPhone 3G** | 2007–2009 | Plastic lens blur, moderate noise, lens flare |

Select **No Emulation** to skip camera simulation entirely and use only filters.

Each camera profile automatically activates a matching filter and custom processing parameters. You can override these in the next tab.

#### Filters Tab — Retro Presets

9 Instagram-inspired one-click filters:

| Filter | Look |
|---|---|
| **1977** | Faded 70s/80s warm pink tones |
| **Earlybird** | Golden Kodak warmth, high contrast |
| **Lo-Fi** | Punchy, oversaturated point-and-shoot feel |
| **Nashville** | Analog-to-digital transition aesthetic |
| **Toaster** | Harsh Polaroid/disposable camera contrast |
| **Kelvin** | Orange-yellow indoor incandescent glow |
| **X-Pro II** | Cross-processed film, vivid colors |
| **Inkwell** | Gritty black-and-white digital |
| **None** | No filter applied |

#### Fine-Tune Tab — Custom Adjustments

After selecting a camera or filter, you can fine-tune five parameters:

| Slider | Range | What It Does |
|---|---|---|
| **Grain Intensity** | 0–100 | Film grain / digital noise overlay |
| **Highlight Bloom** | 0–100 | Soft glow around bright areas |
| **Black Point Fade** | 0–100 | Lifts shadows for a "matte" faded look |
| **Color Shift** | −100 to +100 | Cool ← → Warm color temperature bias |
| **Vignette Depth** | 0–100 | Dark edges focusing the eye on the center |

**Filter Templates:** Save your current fine-tune settings as a named template and reload them on future projects. Templates are stored locally in your browser.

Click **Reset** to return to the camera profile's default values.

---

### Step 4: Editorial

**Goal:** Perfect the text overlays on each slide.

The Editorial step opens a full-screen text editor with a large slide preview on the right and controls on the left.

#### Global Style Controls

Changes made in the global toolbar apply to **all slides at once**:

- **Font Family** — 17 fonts across sans-serif (Inter, Montserrat, Poppins, Syne, Bebas Neue, and more) and serif (Playfair Display, Merriweather, Lora, Bodoni Moda, Cinzel, and more) categories
- **Headline Size** — 24–96 px
- **Subtitle Size** — 14–56 px (when subtitles are enabled)
- **Vertical Position** — Top / Center / Bottom
- **Text Alignment** — Left / Center / Right
- **Italic** — On/Off toggle
- **Text Color** — White, Dark, or custom color via color picker
- **Background Padding** — Horizontal (0–40 px) and Vertical (0–30 px) padding around the text highlight box
- **Show Headline / Show Subtitle** — Visibility toggles
- **Apply to All** — Pushes all current global settings to every slide

#### Per-Slide Controls

Select any slide in the thumbnail strip on the left to edit it individually. All the same options from the global toolbar are also available per-slide. Per-slide settings override the global defaults.

Each slide also has:

- **Headline text input** — Edit the AI-generated headline or write your own
- **Subtitle text input** — Edit or write the subtitle (when enabled)
- **Inline crop** — Adjust the image crop for this slide via the crop icon

#### Drag-to-Position

In the large preview panel, **click and drag the text overlay** to position it anywhere on the slide. Position is stored as a percentage (0–100%) so it scales correctly across all export sizes. A hint reads "Drag to position" when you hover.

The default position is horizontally centered, 85% down from the top (near the bottom of the frame).

#### Slide Reordering

Drag the handle that appears on each thumbnail in the left strip to reorder slides. The slide numbers update automatically.

#### Image Crop

Click the crop icon on any slide to open the crop dialog. Crop is applied per-slide at the aspect ratio of your first selected target platform. Click **Reset** inside the dialog to undo cropping.

---

### Step 5: Finalize

**Goal:** Review your slides, add audio, and prepare for export or publishing.

The Finalize step has two view modes toggled at the top:

#### Grid View

A paginated grid showing all generated slide thumbnails (6 per page). Each card shows:

- **Slide number**
- **Source badge** (Photo / Text)
- **Slide type** (Hook / Story / Closer)
- **Generation status** — Spinner (generating), error icon (failed), or the finished image
- **Text overlay preview** at thumbnail scale
- **Drag handle** for reordering

Use the **Export** and **Publish** buttons in the header to proceed without switching to Timeline view.

**Retrying Failed Slides**

If a slide fails to generate, an error icon appears on its card. Click the **Retry** button on the individual card, or use the **Retry Failed** button in the header to retry all failed slides at once.

#### Timeline View (Storyboard)

The Timeline view activates when audio is present and provides a visual storyboard with:

- A **filmstrip** of slide thumbnails scrolling horizontally, proportional to each slide's duration
- An **audio waveform** below the filmstrip, synchronized to the timeline
- A **playhead** you can drag to scrub through the reel
- A **Play/Pause** button and **Restart** button
- A **time counter** showing current position and total duration

See [Section 6: Storyboard & Video Reel](#6-storyboard--video-reel) for full details.

---

### Step 6: Publish

**Goal:** Export your carousel or publish directly to your connected social accounts.

See [Section 11: Exporting Your Content](#11-exporting-your-content) and [Section 12: Direct Publishing](#12-direct-publishing-to-social-platforms) for full details.

---

## 5. Audio & Music

KodaPost supports adding a soundtrack to your carousel, which is used for video reel generation and can be included in export packages.

### Opening the Audio Panel

The **Audio** panel is available in the Finalize step. Click the music note icon or the "Add Audio" button to expand it.

### Three Ways to Add Audio

#### 1. Music Library

Browse royalty-free tracks from the built-in library (sourced from Jamendo and Audius).

- Search by keyword or browse by genre
- Click a track to preview it
- Click **Use This Track** to stage it

Library track attribution (title, artist, platform, license URL) is automatically appended to your caption with a 🎵 emoji when you export.

#### 2. Upload Audio

Upload your own audio file.

- Supported formats: **MP3, WAV, M4A, OGG, WebM, AAC**
- Max file size: **50 MB**
- Max duration: **10 minutes**

After upload, a **waveform** visualization appears so you can see the audio shape and set trim points.

#### 3. Record Voice

Record directly from your microphone. The recording appears as a waveform you can preview and trim.

Voice recording also uses the **Web Speech API** for transcription — the transcribed text can be used to populate your story/theme field.

### Staged Apply System

When you select audio from any source, it enters a **Staged** state (shown with an amber badge). This lets you preview the audio before committing it to the storyboard.

Once you're happy with the track and trim, click **Apply to Storyboard** to activate it (shown with a green badge). You can click **Change Track** at any time to swap to a different audio source without losing your existing settings.

### Auto-Trim (Goldilocks Zone)

KodaPost automatically calculates the **recommended audio duration** as:

```
Recommended duration = Number of slides × 3.5 seconds
```

If your chosen track is longer than this, it is **automatically trimmed** to the Goldilocks zone. A hint message tells you the recommended duration. You can override this using the trim handles on the waveform.

### Manual Trim Controls

Drag the **left handle** to set the start point and the **right handle** to set the end point on the waveform display. The selected region is highlighted; the trim duration is shown in real time.

### Removing Audio

Click **Clear Track** in the Storyboard toolbar, or use the remove icon in the Audio panel header, to detach audio from your project.

---

## 6. Storyboard & Video Reel

KodaPost can generate a **video reel** — a full MP4 video with your slides composited in sequence, transitions applied, and audio mixed in — entirely in your browser using FFmpeg.wasm. No upload, no server, no waiting.

### Viewing the Storyboard

In the Finalize step, click **Timeline** (visible when audio is present) to switch to the storyboard view.

### Storyboard Controls

#### Playback
- **Play / Pause** — Start or stop previewing the reel
- **Restart** — Return to the beginning
- **Time Display** — Shows `0:00.0 / 0:32.5` format (current / total)

#### Transitions

Choose how slides transition into each other:

| Transition | Effect |
|---|---|
| **Crossfade** | Smooth dissolve between slides (default) |
| **Slide** | Slides push horizontally |
| **None** | Hard cut between slides |

#### Timing Mode

| Mode | How It Works |
|---|---|
| **Match Audio** | Slides are evenly distributed across the audio duration |
| **Custom** | Each slide displays for a fixed duration (default 3 seconds) |

**Match Audio** is the recommended mode when you have a soundtrack — it ensures the video ends exactly when the music ends.

#### Clear Track

The **Clear Track** button removes the audio from the storyboard without deleting it from the Audio panel. The audio remains staged and can be re-applied.

### Generating the Video Reel

In the **Publish** step, when audio is present, **Video Reel** is offered as the primary export option. Click **Generate Video** to start the encoding process.

**Stages shown during generation:**
1. Compositing slide images
2. Rendering frames
3. Encoding video
4. Mixing audio

A progress bar and stage label keep you informed. Generation typically takes 10–60 seconds depending on slide count and your device.

Once complete, a **video player** appears so you can preview the reel in the browser. Click **Download MP4** to save the file. Click **Regenerate** to re-run with new settings.

### Video Specs

| Setting | Default Value |
|---|---|
| Frame Rate | 30 FPS |
| Quality | Standard |
| Transition Duration | 0.5 seconds |
| Slide Duration (Custom) | 3 seconds |
| Format | MP4 (H.264 + AAC) |

---

## 7. Platform Previews & Mobile Simulator

Before exporting, preview exactly how your carousel will look on each target platform.

### Platform Preview Buttons

Click any platform button in the Finalize header to switch the slide grid to that platform's aspect ratio:

| Preview | Aspect Ratio | Represents |
|---|---|---|
| **Instagram** | 4:5 | Instagram Feed, Reels |
| **TikTok** | 9:16 | TikTok, Vertical video |
| **LinkedIn** | 4:5 | LinkedIn posts |
| **Square** | 1:1 | YouTube Community, Reddit Gallery |
| **Lemon8** | 3:4 | Lemon8 photos |
| **Letterbox** | 16:9 within 4:5 | Widescreen in portrait frame |

### Mobile Device Simulator

Click **Mobile** to toggle the phone frame overlay. Your slides are shown inside a realistic CSS phone mockup with:

- Metallic titanium/aluminum frame
- Dynamic Island with camera dot
- Simulated status bar (time, signal, battery)
- Home indicator bar
- Carousel navigation dots (max 7 visible)

#### Screen Ratios

Choose the device aspect ratio inside the phone frame:

| Ratio | Devices |
|---|---|
| **19.5:9** | iPhone 14/15, Galaxy S23 |
| **20:9** | Galaxy S24, Pixel 8 |

---

## 8. Vintage Camera Profiles

KodaPost's 10 vintage camera profiles simulate the exact hardware characteristics of iconic consumer cameras. Each profile applies a combination of color science, sharpness, grain, bloom, vignette, and compression artifacts that match the original camera's look.

### Camera Profiles at a Glance

#### Sony Mavica (ID 1)
The original digital camera experience. The Mavica shot at 0.3 megapixels and stored images on floppy disks. KodaPost replicates its distinctive CRT color palette using **Floyd-Steinberg dithering**, 8-bit color reduction, and aggressive JPEG compression artifacts. The result looks like it was emailed in 1998.

**Paired filter:** Inkwell (black-and-white variant available)

#### Canon PowerShot ELPH (ID 2)
The party camera of the early 2000s. The ELPH's direct flash created blown-out highlights, punchy saturation, and deep shadows. KodaPost simulates this with a flash boost, +25% saturation, and a soft vignette.

**Paired filter:** Lo-Fi

#### Nikon Coolpix (ID 3)
Early 2000s prosumer sharpness. The Coolpix was known for its clinical, industrial rendering — no warmth, no softness, just edge definition. KodaPost applies +50% sharpness enhancement and fine grain.

**Paired filter:** None (custom parameters only)

#### Olympus Camedia (ID 4)
The dreamiest of the CCD cameras. The Camedia's highlight bloom and edge softness gave photos a watercolor quality. KodaPost replicates this with +60% bloom and warm color bias.

**Paired filter:** Earlybird

#### Fujifilm FinePix (ID 5)
Fujifilm's Velvia film simulation made the FinePix a favorite for travel photography. KodaPost applies the Velvia color science — elevated greens, smooth skin rendering, and +40% skin softening.

**Paired filter:** Nashville

#### Casio Exilim (ID 6)
The Exilim was a style-forward camera with an over-processed look: hyper-sharp contours, cool blue shadows, and high-contrast rendering. KodaPost replicates the Exilim's distinctive blue color cast and sharpening artifacts.

**Paired filter:** X-Pro II

#### Kodak EasyShare (ID 7)
The EasyShare captured the warmth of family photo albums. Its golden amber color bias and soft focus — combined with +50% bloom — creates that nostalgic "photo printed at CVS" feeling.

**Paired filter:** Kelvin

#### Panasonic Lumix (ID 8)
Lumix's partnership with Leica gave the camera a distinctive high-precision look: a slight blue channel lift, +20% contrast, and dynamic range compression. The result is technically sharp but emotionally cool.

**Paired filter:** None (custom parameters only)

#### Polaroid 600 (ID 9)
The icon. KodaPost's Polaroid profile applies a +75% vignette (the heaviest of any camera), paper grain texture, matte effect, and chromatic aberration (+30%) to simulate the physical characteristics of instant film. Colors fade slightly from the edges.

**Paired filter:** Toaster

#### Apple iPhone 3G (ID 10)
The phone that started the selfie era. At 2 megapixels with a plastic lens, the iPhone 3G produced soft, blurry backgrounds, moderate noise, and occasional lens flare. KodaPost simulates the edge blur (+60%), noise pattern, and lens artifact of the original hardware.

**Paired filter:** 1977

---

## 9. Retro Filters & Fine-Tuning

### The 9 Retro Filters

KodaPost's filters are inspired by the classic Instagram filter set from the app's early years — the aesthetic that defined a generation of social media photography.

| Filter | Signature Look | Notes |
|---|---|---|
| **1977** | Faded warm pink | Evokes 1970s–80s expired film. Great for street and fashion photography |
| **Earlybird** | Golden warm contrast | Classic Kodak warmth. Works for landscapes, food, and travel |
| **Lo-Fi** | Punchy, oversaturated | Best for bold, colorful subjects that can handle extra contrast |
| **Nashville** | Analog-digital transition | A bridge between film and digital aesthetics. Versatile |
| **Toaster** | Harsh Polaroid vibe | High contrast, heavy vignette. Best for portraits and moody scenes |
| **Kelvin** | Orange indoor glow | Simulates tungsten/incandescent lighting. Perfect for cozy interior shots |
| **X-Pro II** | Vibrant cross-processing | Cross-process film effect with vivid colors and a slight magenta cast |
| **Inkwell** | Gritty black & white | Digital B&W with grain. Timeless for editorial content |
| **None** | Clean, no processing | Use with Fine-Tune sliders only, or with a camera profile's custom params |

### Fine-Tune Sliders

Each filter or camera profile starts with a default set of fine-tune values. You can override them:

- **Grain Intensity (0–100):** Adds film-like texture. At 0, the image is clean. At 100, it's heavily textured. Most camera profiles use 15–40 for realism.
- **Highlight Bloom (0–100):** Softens and glows bright areas. High bloom values create a dreamy, overexposed look. Polaroid and Olympus profiles use 50–60.
- **Black Point Fade (0–100):** Raises shadow brightness to produce a "lifted" or "matte" look. Popular in faded-film aesthetics like 1977.
- **Color Shift (−100 to +100):** Shifts the entire image color temperature. Negative values make the image cooler (blue); positive values make it warmer (orange). The Kodak EasyShare profile defaults to +15 (warm).
- **Vignette Depth (0–100):** Darkens the edges of the frame. At 100, edges are nearly black. The Polaroid 600 profile defaults to 75.

### Saving Filter Templates

Developed a combination you love? Click **Save as Template**, give it a name, and it's stored locally in your browser. Templates appear in the **Filter Templates** section so you can reload them on any future project.

---

## 10. Text Overlays & Typography

KodaPost uses **Koda** to generate text overlays for each slide based on their narrative role in the carousel:

- **Hook slides** get attention-grabbing headlines that stop the scroll
- **Story slides** get headlines that advance the narrative
- **Closer slides** get a concluding headline with an optional call-to-action

### Available Fonts

KodaPost includes **17 Google Fonts** in two categories:

**Sans-Serif:**
Inter, Montserrat, Montserrat Black, Poppins, Syne, Bebas Neue

**Serif:**
Playfair Display, Playfair Display Black, Merriweather, Lora, Bodoni Moda, Cinzel, Abril Fatface, DM Serif Display, Prata

### Typography Settings

| Setting | Options / Range |
|---|---|
| Font Family | 17 fonts |
| Headline Size | 24–96 px |
| Subtitle Size | 14–56 px |
| Text Alignment | Left / Center / Right |
| Italic | On / Off |
| Text Color | White / Dark / Custom hex |
| Background Opacity | Via RGBA background color |
| Horizontal Padding | 0–40 px |
| Vertical Padding | 0–30 px |
| Vertical Position | Top / Center / Bottom (global) |
| Free Position | Drag anywhere (0–100% x/y) |

### Default Styling

By default, text overlays use:
- **Font:** Inter, Bold
- **Headline size:** 42 px
- **Color:** White (#FFFFFF)
- **Background:** Semi-transparent black (rgba(0, 0, 0, 0.75))
- **Text shadow:** Enabled
- **Alignment:** Center
- **Position:** Centered horizontally, 85% down from the top

### Editing Text

In the Editorial step, you can:

1. **Edit text directly** — Click the headline or subtitle input for any slide and type your own content
2. **Drag to reposition** — Click and drag the text overlay in the large preview to place it exactly where you want
3. **Apply globally** — Set your preferred styling in the global toolbar and click "Apply to All" to push it to every slide at once
4. **Override per slide** — Individual slide settings always take priority over global settings

---

## 11. Exporting Your Content

### Export Options

KodaPost offers three export formats depending on your content:

#### Images Only (ZIP)

Downloads a ZIP file containing your carousel images sorted into per-platform folders. Each image is:
- Resized to the platform's native resolution
- Formatted appropriately (JPEG for Instagram/TikTok/YouTube, PNG for LinkedIn/Reddit)
- Named with slide index and platform

This is the fastest export option and works for all platforms.

#### Nano-Cast Package (ZIP + Audio)

When audio is present, this option downloads a ZIP containing:
- All platform image folders (same as above)
- The trimmed audio file
- A `manifest.json` with metadata: theme, caption, slide count, audio info, attribution text, and timestamps

Use this for workflows where you assemble the final video elsewhere (e.g., CapCut, Premiere, DaVinci Resolve).

#### Video Reel (MP4)

Generates a complete video with all slides composited in sequence with transitions and audio mixed in. The video is encoded entirely in your browser — no upload required.

See [Section 6: Storyboard & Video Reel](#6-storyboard--video-reel) for the full encoding workflow.

### Platform Image Specs

| Platform | Resolution | Aspect Ratio | Format | Quality |
|---|---|---|---|---|
| Instagram | 1080 × 1350 px | 4:5 | JPEG | 85 |
| TikTok | 1080 × 1920 px | 9:16 | JPEG | 90 |
| LinkedIn | 1080 × 1350 px | 4:5 | PNG | 95 |
| YouTube | 1000 × 1000 px | 1:1 | JPEG | 85 |
| Reddit | 1200 × 1200 px | 1:1 | PNG | 95 |
| Lemon8 | 1080 × 1440 px | 3:4 | JPEG | 90 |

---

## 12. Direct Publishing to Social Platforms

KodaPost can post directly to your connected social accounts via OAuth. Direct publishing requires the **Standard or Pro plan**.

### Supported Platforms

| Platform | What Gets Posted |
|---|---|
| Instagram | Carousel post via Graph API |
| TikTok | Carousel via Content API |
| LinkedIn | Image post via Share API |
| YouTube | Community post |
| Reddit | Gallery post |
| Lemon8 | Photo post via Content API |

### Connecting an Account

1. Go to **Settings** (header menu → Settings)
2. Find the platform you want to connect
3. Click **Connect** — you'll be redirected to the platform's OAuth authorization page
4. Approve the requested permissions
5. You'll be returned to KodaPost with the account connected

OAuth tokens are stored encrypted in a secure httpOnly cookie on your browser. Tokens are automatically refreshed before they expire.

### Posting

In the Publish step:

1. Select the platforms you want to post to
2. Review or edit the caption in the **Caption** textarea (pre-filled from your earlier input)
3. If your audio is from the music library, check **Include attribution** to append the track credit to your caption
4. Click **Post Now** for each connected platform

### Scheduled Publishing

Click **Schedule for Later** to expand scheduling controls. Set a date and time, and KodaPost will mark the post as scheduled. A visual amber badge appears in the Finalize header as a reminder. Scheduled times are stored in your draft.

### Caption Limits by Platform

| Platform | Hard Limit | First-Line Preview |
|---|---|---|
| Instagram | 2,200 chars | 125 chars |
| TikTok | 2,200 chars | 150 chars |
| LinkedIn | 3,000 chars | 140 chars |
| YouTube | 5,000 chars | 100 chars |
| Reddit | 300 chars | 300 chars |
| Lemon8 | 2,200 chars | 140 chars |

---

## 13. Plans & Feature Access

### Plan Comparison

| Feature | Trial | Starter | Standard | Pro |
|---|---|---|---|---|
| **Monthly price** | Free | $9/mo | $19/mo | $39/mo |
| **Drafts** | 1 | 1 | 5 | 15 |
| **Draft expiration** | 30 days | 30 days | 30 days | Never |
| **Generations / month** | 10 | 50 | 200 | Unlimited |
| **Video reel export** | Yes | Yes | Yes | Yes |
| **Music library** | Yes | Yes | Yes | Yes |
| **Direct publishing** | No | No | Yes | Yes |
| **Priority support** | No | No | No | Yes |

### Trial Plan

The Trial plan is available to all new users. You get full access to the core creative features — including video reel generation and the music library — with a single draft slot and 10 generations per month. No credit card required.

### Upgrading

Click **Upgrade** in the trial banner or header menu to view plan options. Billing is handled via Stripe.

### What Counts as a Generation?

Each time you click **Generate** in the Setup step to produce a carousel, that counts as one generation. Retrying a single failed slide does not count as a new generation.

---

## 14. The Headless API

KodaPost includes a REST API that allows you to generate carousels programmatically — useful for Telegram bots, automation scripts, and custom integrations.

### Base URL

All API endpoints are under `/api/v1/`.

### Authentication

All endpoints (except the health check) require a Bearer token:

```
Authorization: Bearer kp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Creating an API Key

API keys are created by an admin using the admin endpoint. Contact your workspace administrator to provision a key.

```bash
curl -X POST https://yourapp.com/api/v1/keys \
  -H "Authorization: Bearer $API_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Integration"}'
```

The key is shown **once** — store it securely.

### Key Endpoints

#### Health Check
```
GET /api/v1/health
```
No authentication required. Returns server status and database connectivity.

#### Generate a Carousel
```
POST /api/v1/generate
```
Accepts `multipart/form-data` with images and a JSON config field. Returns a job result synchronously (or a job ID for polling).

**Minimal example:**
```bash
curl -X POST https://yourapp.com/api/v1/generate \
  -H "Authorization: Bearer kp_live_..." \
  -F 'config={"theme":"morning coffee ritual","platforms":["instagram"],"slideCount":3}' \
  -F 'images=@photo1.jpg'
```

#### Check Job Status
```
GET /api/v1/jobs/:id
```
Retrieve the status and result of an async generation job. Results expire after 1 hour.

### API Limits

| Limit | Value |
|---|---|
| Rate limit | 60 requests/minute per key |
| Max images | 12 per request |
| Max image size | 10 MB per image |
| Accepted formats | JPEG, PNG, WebP |
| Result retention | 1 hour |

---

## 15. Telegram Bot

KodaPost has a **Telegram bot** that lets you generate carousels directly in a chat conversation — no browser required.

### How It Works

1. Open a chat with **@kodacontentbot** on Telegram
2. Send 1–10 photos in a single message or as a group
3. The bot asks for your story/theme
4. Answer the guided questions (vibes, slide count, caption style)
5. The bot generates your carousel and sends back a **preview link**
6. Open the preview link to download your images

### Bot Commands

| Command | Action |
|---|---|
| `/start` | Begin a new session |
| `/status` | Check the current generation status |
| `/reset` | Clear everything and start over |
| `/help` | Show the help guide |

### What the Bot Can Generate

The Telegram bot uses the same full pipeline as the web app — including image analysis, filter processing, text overlay generation, and platform compositing — so output quality is identical to using the web interface.

### Limitations

The bot currently supports image-only export (ZIP). Video reel generation and direct posting to social platforms require the web app.

---

## 16. Activity Log & History

### Activity Log

KodaPost maintains a **client-side activity log** that records key actions during your session:

- Carousel generations (success, failure, slide count)
- Image uploads
- Exports (ZIP, video, Nano-Cast)
- Direct posts (platform, success/failure)
- Draft operations (created, resumed, deleted)

The activity log is stored locally in your browser. You can **export it as CSV or JSON** from the Advanced Settings dialog for use in personal reporting or workflow auditing.

### Post History

The **History** section shows a calendar view of your past posts with scheduling overview. Use it to plan content cadence and review what you've already published.

---

## 17. Account & Settings

### Profile

Click your avatar or the **Profile** option in the header menu to open the user profile dialog. From here you can:

- Update your display name and profile photo
- View connected email addresses
- Add or remove phone numbers
- Manage connected social accounts (Google, Apple)
- Update security settings (password, MFA)

### Settings Dialog

The **Settings** dialog (header menu → Settings) contains:

- **Social Accounts** — View and disconnect OAuth-connected social platforms (Instagram, TikTok, LinkedIn, YouTube, Reddit, Lemon8)
- **Default Platforms** — Set which platforms are pre-selected when you start a new export
- **Theme** — Override the system dark/light theme preference

### Advanced Settings

The **Advanced Settings** dialog contains fine-grained options for generation behavior, export quality, and activity log management. Access it via the header menu.

### Start Fresh

The **Start Fresh** option in the header menu resets the current draft to a blank state, exactly as if you were a first-time user. Your other drafts are not affected.

---

## 18. Tips for Great Posts

### Photography Tips

- **Use 3–6 photos** for the optimal carousel length. Fewer than 3 limits storytelling; more than 6 risks losing the audience before the end.
- **Mix shot types.** Pair wide establishing shots with close-up detail shots and people-facing shots. Variety keeps the viewer swiping.
- **Avoid similar compositions.** If all your photos are the same angle and distance, the carousel will feel flat. Intentional variety is what makes the difference.
- **Consistent lighting wins.** Photos taken in similar lighting conditions look more cohesive as a carousel than photos from completely different environments.

### Story Tips

- **Be specific.** "Hiking the Enchantments at sunrise, first snow of season, saw a mountain goat" generates better AI text than "hiking trip."
- **Include emotion.** The theme field is not a caption — it's a brief for Koda. Let it know the mood.
- **Set the vibe before generating.** The vibe keywords dramatically affect the tone of your overlays and caption. Inspirational and Controversial will produce very different outputs from the same story.

### Design Tips

- **Try Bebas Neue or Playfair Display Black** for bold hooks. Their contrast draws the eye immediately.
- **The default overlay position (bottom-center) works for most photos.** Drag to the top if your subject is in the lower third, or to the center for tight portraits.
- **Less is more with text.** A 4–6 word headline and an optional 8–12 word subtitle is usually cleaner than filling the available space.
- **Match the camera profile to the lighting.** Warm indoor photos look great with Kodak EasyShare or Kelvin. Blue-toned outdoor shots work well with Casio Exilim or X-Pro II.

### Caption Tips

- **Always edit the generated caption.** Koda gives you a strong first draft — personalize it with your own voice before publishing.
- **Hashtags matter for reach.** Instagram supports up to 30 but 10–15 targeted ones perform better. LinkedIn works best with 3 or fewer.
- **The first line is your hook.** On Instagram and TikTok, only the first 125–150 characters appear before "…more." Put your strongest line first.

### Audio Tips

- **The Goldilocks zone (3.5s/slide) is a starting point, not a rule.** If your story needs more breathing room, drag the trim handles to extend the audio and use Custom timing mode.
- **Voice recordings work well for personal stories.** The natural imperfection of a voice note adds authenticity.
- **Library tracks work best for aspirational or travel content.** They provide the professional production quality that elevates the visual content.

---

## 19. Frequently Asked Questions

**Q: Do I need an account to use KodaPost?**
A: No. You can use all core features without creating an account. An account is required to access direct publishing and sync your drafts across devices.

**Q: How does Koda generate text?**
A: Koda uses Anthropic's Claude API. It analyzes your uploaded images, reads your story and vibe keywords, and generates headlines and captions tailored to each slide's narrative role (hook, story, or closer). The AI does not retain your content after the generation request completes.

**Q: How long does generation take?**
A: Typically 10–30 seconds for a 3–6 slide carousel. Longer carousels (9–12 slides) may take up to 60 seconds. Video reel generation varies based on slide count and your device's processing power.

**Q: Are my photos uploaded to a server?**
A: Your photos are processed server-side for the image compositing and filter application (via Sharp), but they are not stored permanently. The processed images are returned to your browser and saved to IndexedDB. The server does not retain originals after generation.

**Q: Why is my voice recording not working?**
A: Voice recording uses the **Web Speech API**, which is only available in **Chrome** and **Microsoft Edge**. Safari and Firefox do not support it. You'll also need to grant microphone permissions when prompted.

**Q: Why did some slides fail to generate?**
A: Generation failures are usually caused by network timeouts or server load. Click the **Retry** button on the failed slide card, or use **Retry Failed** in the header to retry all failures at once.

**Q: Can I use KodaPost for videos only (no carousel)?**
A: The current workflow starts with images and produces carousels. A video reel is an output option when audio is added, but the input is always static images. Native video input is not currently supported.

**Q: Does the music library track my usage for copyright?**
A: Tracks in the music library are royalty-free, licensed for content creation. Attribution information is automatically added to your caption when you use a library track. Always check the specific license linked in the attribution text if you're unsure about commercial use.

**Q: Can I use my own fonts?**
A: KodaPost currently includes 17 Google Fonts. Custom font upload is not available in the current version.

**Q: What happens to my draft after 30 days?**
A: Drafts expire on Trial, Starter, and Standard plans after 30 days. The app shows a warning badge when your draft is within 3 days of expiration. Upgrade to Pro for drafts that never expire.

**Q: How do I disconnect a social account?**
A: Go to **Settings** (header menu → Settings), find the platform, and click **Disconnect**. This revokes the OAuth token and removes the connection from KodaPost.

**Q: The video reel is very large — is that normal?**
A: Yes. Browser-based FFmpeg encoding uses the "standard" quality preset which produces larger files for better compatibility. The file size scales with the number of slides and total duration. A 6-slide, 21-second reel is typically 5–15 MB.

**Q: Can I use KodaPost via API?**
A: Yes. See [Section 14: The Headless API](#14-the-headless-api) for complete documentation. API access requires an API key provisioned by an administrator.

**Q: I have feedback or found a bug. Where do I report it?**
A: Use the **Help** option in the header menu to access the feedback form, or file an issue at the project repository.

---

*KodaPost User Guide — February 2026*
*For technical support, open a support ticket via the Help menu inside the app.*
