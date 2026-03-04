import type { Metadata } from "next";
import { TableOfContents } from "@/components/legal/TableOfContents";

export const metadata: Metadata = {
  title: "Getting Started Guide - KodaPost",
  description:
    "Learn how to create carousel posts with KodaPost, in the app or directly from Telegram.",
};

const sections = [
  { id: "overview", title: "Overview" },
  { id: "quick-start", title: "Quick Start Guide" },
  { id: "create-in-app", title: "Create in the App" },
  { id: "create-on-telegram", title: "Create on Telegram" },
  { id: "the-flow", title: "The Flow" },
  { id: "style-templates", title: "Style Templates" },
  { id: "audio-and-music", title: "Audio and Music" },
  { id: "settings", title: "Settings" },
  { id: "tips", title: "Tips for Great Posts" },
  { id: "creator-provenance", title: "Creator Provenance" },
  { id: "brand-logo-watermark", title: "Brand Logo Watermark" },
  { id: "platform-notes", title: "Platform Notes" },
  { id: "commands", title: "Commands Reference" },
];

export default function GuidePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Getting Started</h1>
        <p className="border-l-4 border-foreground/20 pl-4 text-muted-foreground !mt-2">
          Everything you need to create beautiful carousel posts, in the app or
          on Telegram.
        </p>

        <h2 id="overview">Overview</h2>
        <p>
          KodaPost turns your photos into polished, ready-to-post social media
          carousels. You bring the photos and the story; the app handles
          the layout, text overlays, captions, and formatting.
        </p>
        <p>There are two ways to create:</p>
        <ul>
          <li>
            <strong>In the app</strong> &ndash; Use the five-step builder to
            configure everything visually: Upload, Craft, Design, Review, and
            Publish.
          </li>
          <li>
            <strong>On Telegram</strong> &ndash; Message{" "}
            <strong>@kodacontentbot</strong> and create carousels through a
            guided conversation. The Production Assistant walks you through
            each step.
          </li>
        </ul>
        <p>Both methods follow the same flow and produce the same results.</p>

        <h2 id="quick-start">Quick Start Guide</h2>
        <p>
          New to KodaPost? The{" "}
          <a href="/quickstart">Quick Start Guide</a> walks you through each
          step with visual mockups so you can follow along. Create your first
          carousel in about 5 minutes.
        </p>

        <h2 id="create-in-app">Create in the App</h2>
        <p>
          The builder walks you through five steps. Each step has its own
          screen with controls tailored to that part of the process.
        </p>
        <ol>
          <li>
            <strong>Upload</strong> &ndash; Drag and drop photos into the
            upload area, or tap to browse. Supports JPEG, PNG, WebP, and HEIC
            (HEIC files convert to JPEG automatically). You can upload 1 to 10
            photos and reorder them by dragging thumbnails.
          </li>
          <li>
            <strong>Craft</strong> &ndash; Describe your carousel theme (the
            story or concept), choose a camera emulation filter (Kodak Gold,
            Fuji Velvia, Polaroid, and more), and add vibe keywords like
            &ldquo;relatable&rdquo; or &ldquo;nostalgic&rdquo; to shape the
            tone. Koda generates text overlays and a caption from these inputs.
          </li>
          <li>
            <strong>Design</strong> &ndash; Fine-tune each slide visually.
            Edit text overlays directly on the preview, change fonts, adjust
            text position and color, and toggle text on or off per slide.
            Open the Stylize panel to apply a style template to all slides at
            once, or pick different templates per slide. Navigate slides using
            the thumbnail strip at the bottom.
          </li>
          <li>
            <strong>Review</strong> &ndash; Preview all your slides in a
            carousel grid. Switch between platform tabs (Instagram, TikTok,
            LinkedIn, etc.) to see format differences. Add an audio track from
            the Music Library, upload your own audio file, or record a voice
            narration for video-format exports.
          </li>
          <li>
            <strong>Publish</strong> &ndash; Select connected social media
            platforms and tap Post Now to publish, or export a ZIP for manual
            posting. Toggle Creator Provenance to embed a cryptographic
            signature and optional watermark in each exported image.
          </li>
        </ol>

        <h2 id="create-on-telegram">Create on Telegram</h2>
        <p>
          The Production Assistant lives on Telegram. Create carousels entirely
          from your phone without opening the app. Just message{" "}
          <a
            href="https://t.me/kodacontentbot"
            target="_blank"
            rel="noopener noreferrer"
          >
            @kodacontentbot
          </a>{" "}
          and follow the guided conversation.
        </p>
        <h3>Getting Started on Telegram</h3>
        <ol>
          <li>
            Open Telegram and search for{" "}
            <strong>@kodacontentbot</strong>, or tap{" "}
            <a
              href="https://t.me/kodacontentbot"
              target="_blank"
              rel="noopener noreferrer"
            >
              this link
            </a>
            .
          </li>
          <li>
            Tap <strong>Start</strong> to begin.
          </li>
          <li>
            <strong>Send your photos</strong> &ndash; Drop 1 to 10 images
            into the chat.
          </li>
          <li>
            <strong>Tell your story</strong> &ndash; The bot will ask what the
            post is about. Just type naturally.
          </li>
          <li>
            <strong>Pick vibes</strong> &ndash; Type a vibe like
            &ldquo;relatable&rdquo; or &ldquo;inspirational&rdquo;, or say
            &ldquo;skip&rdquo; to use defaults.
          </li>
          <li>
            <strong>Review caption</strong> &ndash; The bot generates a caption.
            You can approve it, type a new one, or say
            &ldquo;rewrite&rdquo; for a fresh take.
          </li>
          <li>
            <strong>Generate</strong> &ndash; Say &ldquo;generate&rdquo; and the
            bot will build your carousel and send you a preview link.
          </li>
        </ol>
        <p>
          The preview link lets you view all your slides, copy the caption, and
          download the images, all from your phone.
        </p>

        <h2 id="the-flow">The Flow</h2>
        <p>
          Whether you&rsquo;re in the app or on Telegram, the creation flow
          follows the same five steps:
        </p>
        <table>
          <thead>
            <tr>
              <th>Step</th>
              <th>What You Do</th>
              <th>What Happens</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>1. Upload</strong>
              </td>
              <td>Drag and drop 1 to 10 photos</td>
              <td>Images are analyzed for composition, mood, and color</td>
            </tr>
            <tr>
              <td>
                <strong>2. Craft</strong>
              </td>
              <td>Describe the theme, pick a camera filter, add vibes</td>
              <td>
                Koda generates text overlays and a caption from your inputs
              </td>
            </tr>
            <tr>
              <td>
                <strong>3. Design</strong>
              </td>
              <td>Edit text, apply style templates, adjust position and color</td>
              <td>Each slide is styled individually with live preview</td>
            </tr>
            <tr>
              <td>
                <strong>4. Review</strong>
              </td>
              <td>Preview the carousel grid, add audio, switch platform tabs</td>
              <td>
                Format differences are shown per platform; audio is auto-trimmed
                to match your slides
              </td>
            </tr>
            <tr>
              <td>
                <strong>5. Publish</strong>
              </td>
              <td>Select platforms, post or export</td>
              <td>
                Carousel is published or exported as a ZIP with optional
                provenance signature
              </td>
            </tr>
          </tbody>
        </table>

        <h2 id="style-templates">Style Templates</h2>
        <p>
          Style templates let you apply a complete text look to your slides in
          one tap. Each template sets the font, size, weight, text color,
          background color, and shadow together so everything looks coordinated.
        </p>
        <h3>Available Templates</h3>
        <table>
          <thead>
            <tr>
              <th>Template</th>
              <th>Style</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Bold Statement</strong></td>
              <td>All-caps impact with maximum contrast (Bebas Neue)</td>
            </tr>
            <tr>
              <td><strong>Minimal Clean</strong></td>
              <td>Subtle and modern with soft shadow (Inter)</td>
            </tr>
            <tr>
              <td><strong>Vintage Serif</strong></td>
              <td>Warm cream on dark brown, classic feel (Playfair Display)</td>
            </tr>
            <tr>
              <td><strong>Editorial</strong></td>
              <td>Magazine-inspired serif heading (DM Serif Display)</td>
            </tr>
            <tr>
              <td><strong>Street Pop</strong></td>
              <td>Energetic yellow on black, urban edge (Syne)</td>
            </tr>
            <tr>
              <td><strong>Luxury</strong></td>
              <td>Gold on black, refined italic elegance (Bodoni Moda)</td>
            </tr>
            <tr>
              <td><strong>TikTok Viral</strong></td>
              <td>Bold white on hot pink, maximum energy (Montserrat Black)</td>
            </tr>
            <tr>
              <td><strong>Instagram Clean</strong></td>
              <td>Soft dark overlay, clean modern look (Poppins)</td>
            </tr>
          </tbody>
        </table>
        <h3>How to Use Templates</h3>
        <ol>
          <li>
            In the <strong>Design</strong> step, open the{" "}
            <strong>Stylize</strong> panel.
          </li>
          <li>
            Browse the template grid. Each one shows a live preview with sample
            text so you can see the look before applying it.
          </li>
          <li>
            Tap a template to apply it to your current slide. The text overlay
            updates instantly with the new font, color, and background.
          </li>
          <li>
            To apply the same template to all slides at once, use the{" "}
            <strong>Apply to All</strong> option. You can also mix templates
            across slides for variety.
          </li>
        </ol>
        <p>
          Templates set defaults that you can fine-tune afterward. Change the
          font size, text position, or color on any slide without losing the
          template&apos;s base style.
        </p>

        <h2 id="audio-and-music">Audio and Music</h2>
        <p>
          Add a soundtrack or voice narration to your carousel for video-format
          exports (Reels, TikTok, YouTube Shorts). Audio is configured in the
          Review step using the Audio panel.
        </p>
        <h3>Three Ways to Add Audio</h3>
        <ul>
          <li>
            <strong>Music Library</strong> &ndash; Search and browse licensed
            tracks from Jamendo and Audius. Preview tracks in the browser, then
            select one to add to your project. Attribution information is
            included automatically.
          </li>
          <li>
            <strong>Upload Audio</strong> &ndash; Upload your own audio file.
            Supported formats include MP3, WAV, M4A, OGG, WebM, and AAC. Max
            file size is 50 MB, max duration is 10 minutes.
          </li>
          <li>
            <strong>Record Voice</strong> &ndash; Record a voice narration
            directly in the browser using your microphone. A live waveform shows
            your recording in progress. You can preview the recording and
            re-record if needed before applying it.
          </li>
        </ul>
        <h3>Goldilocks Auto-Trim</h3>
        <p>
          When you add an audio track that is longer than your carousel needs,
          KodaPost automatically trims it to fit. The recommended duration is
          calculated at about 4.5 seconds per slide. For example, a 6-slide
          carousel would auto-trim to roughly 27 seconds.
        </p>
        <p>
          The auto-trim always starts from the beginning of the track. You can
          override this by dragging the trim handles to select a different
          section of the audio.
        </p>
        <h3>Trim Handles</h3>
        <p>
          Tap <strong>Trim Clip</strong> to reveal the trim handles on the
          audio waveform. Drag the start and end handles to select the exact
          portion of audio you want to use. The trimmed region is highlighted
          on the waveform so you can see your selection at a glance.
        </p>
        <h3>Applying Audio</h3>
        <p>
          After selecting or recording audio, tap{" "}
          <strong>Apply to Storyboard</strong> to attach it to your carousel.
          The track is staged first so you can preview it, adjust trimming, and
          confirm before it takes effect. You can change or remove the track at
          any time before publishing.
        </p>

        <h2 id="settings">Settings</h2>
        <p>
          App settings are organized under the menu. Open <strong>Menu &gt;
          Settings</strong> to find three tabs:
        </p>
        <ul>
          <li>
            <strong>General</strong> &ndash; Toggle the Telegram Production
            Assistant and other app-wide preferences.
          </li>
          <li>
            <strong>Accounts</strong> &ndash; Connect and manage your
            social media accounts for direct publishing. Use the Setup Wizard
            for guided onboarding.
          </li>
          <li>
            <strong>Brand</strong> &ndash; Upload your brand logo, set your
            brand name, and configure default watermark settings (mode,
            position, opacity, and scale). These defaults are loaded
            automatically in the Publish step and can be overridden per export.
          </li>
        </ul>

        <h2 id="tips">Tips for Great Posts</h2>
        <ul>
          <li>
            <strong>Use 3 to 6 photos</strong> for the best carousel
            experience. Too few feels sparse, too many can overwhelm.
          </li>
          <li>
            <strong>Write a specific story</strong> rather than something
            generic. &ldquo;Sunrise hike at Joshua Tree last weekend&rdquo;
            produces better results than &ldquo;nature photos.&rdquo;
          </li>
          <li>
            <strong>Mix your shots</strong> &ndash; include a wide shot, a
            close-up, and a detail shot for visual variety across slides.
          </li>
          <li>
            <strong>Try a style template</strong> to set a consistent look
            across all your slides, then fine-tune individual slides as needed.
          </li>
          <li>
            <strong>Edit the caption</strong> before posting. The generated
            caption is a starting point. Your voice makes it authentic.
          </li>
          <li>
            <strong>Try different vibes</strong> on the same story to see how
            the tone changes. &ldquo;Relatable&rdquo; and
            &ldquo;inspirational&rdquo; produce very different captions from the
            same source material.
          </li>
        </ul>

        <h2 id="creator-provenance">Creator Provenance</h2>
        <p>
          Every image you export from KodaPost carries proof that you made it.
          Creator Provenance uses Ed25519 cryptographic signing to create a
          tamper-proof record of authorship. The signature is generated
          instantly, with no external service or crypto wallet required.
        </p>
        <h3>How It Works</h3>
        <ol>
          <li>
            When you export with Creator Provenance enabled, KodaPost computes
            a SHA-256 fingerprint (hash) of each image.
          </li>
          <li>
            The image hashes, your creator name, and a timestamp are combined
            into a provenance claim.
          </li>
          <li>
            KodaPost signs the claim with its Ed25519 private key. The
            resulting signature is stored alongside your provenance record.
          </li>
          <li>
            Anyone can verify the signature using the app&apos;s public key,
            confirming that the images were created by you at the recorded time.
          </li>
        </ol>
        <h3>What Gets Embedded</h3>
        <p>
          When you export with Creator Provenance enabled, KodaPost writes the
          following into each image&apos;s EXIF metadata:
        </p>
        <ul>
          <li>
            <strong>Artist</strong> &ndash; Your creator or brand name.
          </li>
          <li>
            <strong>Copyright</strong> &ndash; &ldquo;Made with
            [your name]&rdquo;.
          </li>
          <li>
            <strong>Software</strong> &ndash; &ldquo;KodaPost&rdquo;.
          </li>
          <li>
            <strong>Image fingerprint</strong> &ndash; A unique SHA-256 hash of
            the image, recorded in the ImageDescription field alongside the
            creation timestamp.
          </li>
        </ul>
        <h3>Cryptographic Verification</h3>
        <p>
          The provenance verification endpoint is public. Anyone with a
          SHA-256 image hash can check whether that image has been registered
          and see the creator name, creation date, and cryptographic signature.
          The app&apos;s Ed25519 public key is available for independent
          verification.
        </p>
        <p>
          You can also check the embedded EXIF metadata using any photo viewer.
          On macOS, right-click an image and select &ldquo;Get Info.&rdquo;
          On Windows, right-click and choose &ldquo;Properties &gt;
          Details.&rdquo; Online tools like exifdata.com also work.
        </p>
        <h3>Watermark Modes</h3>
        <p>
          In the Publish step, choose how your watermark appears on exported
          images. There are four modes:
        </p>
        <ul>
          <li>
            <strong>Visible Text</strong> &ndash; A small semi-transparent line
            reading &ldquo;Made with [your name]&rdquo; in the
            bottom-right corner.
          </li>
          <li>
            <strong>Brand Logo</strong> &ndash; Your uploaded PNG logo,
            composited at a configurable position, opacity, and scale. See the
            Brand Logo Watermark section below for setup details.
          </li>
          <li>
            <strong>Hidden Only</strong> &ndash; No visible watermark. EXIF
            metadata and cryptographic signature are still embedded for
            provenance tracking.
          </li>
          <li>
            <strong>Logo + Hidden</strong> &ndash; Combines the visible logo
            watermark with metadata embedding. The hidden digital fingerprint
            (steganography) is coming in a future update.
          </li>
        </ul>
        <h3>Availability</h3>
        <p>
          Creator Provenance is available on the Creator Mode ($19/mo) and
          Monster Mode ($39/mo) plans. Coming soon: C2PA Content Credentials for
          tamper-evident provenance that works with platforms like Adobe Content
          Authenticity and Google Search.
        </p>

        <h2 id="brand-logo-watermark">Brand Logo Watermark</h2>
        <p>
          Brands and creators can upload a custom logo to use as a visible
          watermark on every exported carousel slide. The logo is composited
          directly onto the image at export time, so it appears on the final
          file regardless of where it is shared.
        </p>
        <h3>Setting Up Your Brand Logo</h3>
        <ol>
          <li>
            Open <strong>Menu &gt; Settings</strong> and select the{" "}
            <strong>Brand</strong> tab.
          </li>
          <li>
            Enter your <strong>Brand Name</strong>. This is used in text
            watermarks and EXIF metadata. It defaults to your account name.
          </li>
          <li>
            Click the upload area under <strong>Brand Logo</strong> and select a
            PNG file. The image should have a transparent background for best
            results. Requirements: 64 to 512 pixels wide, max 500 KB.
          </li>
          <li>
            Choose your preferred defaults for <strong>Watermark Mode</strong>,{" "}
            <strong>Position</strong>, <strong>Opacity</strong>, and{" "}
            <strong>Scale</strong>.
          </li>
          <li>
            Click <strong>Save Settings</strong>. Your logo and defaults are
            stored locally and loaded automatically each time you export.
          </li>
        </ol>
        <h3>Using the Logo at Export Time</h3>
        <p>
          In the Publish step, the Creator Provenance section shows your
          configured watermark mode. If you have a logo uploaded, the
          &ldquo;Brand Logo&rdquo; and &ldquo;Logo + Hidden&rdquo; modes become
          available.
        </p>
        <p>
          You can override the defaults per export. Adjust position, opacity,
          and scale using the controls that appear when a logo mode is selected.
          You can also upload a logo directly from the Publish step if you have
          not set one up in Settings yet.
        </p>
        <h3>Logo Guidelines</h3>
        <ul>
          <li>
            <strong>Format</strong> &ndash; PNG with transparency. Other formats
            are not supported.
          </li>
          <li>
            <strong>Dimensions</strong> &ndash; Between 64 and 512 pixels wide.
            The height adjusts proportionally.
          </li>
          <li>
            <strong>File size</strong> &ndash; 500 KB maximum.
          </li>
          <li>
            <strong>Design tip</strong> &ndash; Use a white or light-colored
            logo for best visibility on photo backgrounds. Avoid overly complex
            artwork that becomes illegible at small sizes.
          </li>
        </ul>
        <h3>Position Options</h3>
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Where It Appears</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Bottom Right</td>
              <td>
                Lower-right corner (default). Best for most carousel formats.
              </td>
            </tr>
            <tr>
              <td>Bottom Left</td>
              <td>Lower-left corner.</td>
            </tr>
            <tr>
              <td>Top Right</td>
              <td>Upper-right corner.</td>
            </tr>
            <tr>
              <td>Top Left</td>
              <td>Upper-left corner.</td>
            </tr>
            <tr>
              <td>Center</td>
              <td>
                Centered on the image. Useful for proof sheets or draft
                previews.
              </td>
            </tr>
          </tbody>
        </table>
        <h3>Opacity and Scale</h3>
        <p>
          <strong>Opacity</strong> controls how transparent the logo appears.
          The range is 10% to 80%. A value around 30% is subtle but readable.
          Higher values make the watermark more prominent.
        </p>
        <p>
          <strong>Scale</strong> controls the logo width as a percentage of the
          image width. The range is 5% to 30%. At 15% (the default), a logo on
          a 1080px-wide image renders at about 162px wide.
        </p>

        <h2 id="platform-notes">Platform Notes</h2>
        <p>
          Each social platform has its own format requirements and limits.
          KodaPost handles formatting automatically, but here are some
          details to keep in mind.
        </p>
        <table>
          <thead>
            <tr>
              <th>Platform</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Instagram</strong></td>
              <td>
                Up to 10 carousel images. Token refresh is handled automatically
                so your connection stays active.
              </td>
            </tr>
            <tr>
              <td><strong>YouTube</strong></td>
              <td>
                Supports up to 10 carousel images in community posts.
              </td>
            </tr>
            <tr>
              <td><strong>YouTube Shorts</strong></td>
              <td>
                Video-format export with OAuth authentication for direct posting.
              </td>
            </tr>
            <tr>
              <td><strong>X (Twitter)</strong></td>
              <td>
                Supports multi-image grid posts for visual variety.
              </td>
            </tr>
            <tr>
              <td><strong>TikTok</strong></td>
              <td>
                Carousel slideshow format with optional audio.
              </td>
            </tr>
            <tr>
              <td><strong>LinkedIn</strong></td>
              <td>
                Multi-image carousel format for professional audiences.
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          If any part of the export encounters an issue (for example, a
          watermark or metadata step fails), KodaPost completes the export with
          warnings rather than blocking the entire process. You will see a
          notification about what was skipped so you can retry if needed.
        </p>

        <h2 id="commands">Commands Reference</h2>
        <h3>Telegram Bot Commands</h3>
        <table>
          <thead>
            <tr>
              <th>Command</th>
              <th>What It Does</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>/start</td>
              <td>Begin a new session</td>
            </tr>
            <tr>
              <td>/status</td>
              <td>Check your current progress</td>
            </tr>
            <tr>
              <td>/reset</td>
              <td>Clear everything and start over</td>
            </tr>
            <tr>
              <td>/help</td>
              <td>Show the help guide</td>
            </tr>
          </tbody>
        </table>

        <p>
          Ready to try it?{" "}
          <a href="/">Start creating in the app</a> or message{" "}
          <a
            href="https://t.me/kodacontentbot"
            target="_blank"
            rel="noopener noreferrer"
          >
            @kodacontentbot on Telegram
          </a>
          .
        </p>
      </article>
      <TableOfContents sections={sections} />
    </div>
  );
}
