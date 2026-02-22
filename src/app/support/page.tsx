import type { Metadata } from "next";
import { TableOfContents } from "@/components/legal/TableOfContents";

export const metadata: Metadata = {
  title: "Support FAQ - KodaPost",
  description:
    "Frequently asked questions and support information for KodaPost carousel creator.",
};

const sections = [
  { id: "getting-started", title: "Getting Started" },
  { id: "uploads-formats", title: "Uploads & Formats" },
  { id: "filters-style", title: "Filters & Style" },
  { id: "ai-generation", title: "AI Generation" },
  { id: "publishing", title: "Publishing" },
  { id: "accounts-billing", title: "Accounts & Billing" },
  { id: "troubleshooting", title: "Troubleshooting" },
  { id: "contact", title: "Contact Support" },
];

export default function SupportPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Support FAQ</h1>
        <p className="border-l-4 border-foreground/20 pl-4 text-muted-foreground !mt-2">
          Answers to the most common questions about KodaPost.
        </p>

        <h2 id="getting-started">Getting Started</h2>

        <h3>What is KodaPost?</h3>
        <p>
          KodaPost is a carousel creation tool that transforms your photos into
          polished, share-ready social media posts. You upload photos, Koda (our
          AI assistant) generates text overlays and captions, and you export or
          publish directly to your social accounts.
        </p>

        <h3>Do I need an account to use KodaPost?</h3>
        <p>
          You can create carousels without signing in. An account is required
          if you want to connect social media accounts for direct publishing,
          save drafts across sessions, or access premium features.
        </p>

        <h3>How do I start creating my first carousel?</h3>
        <ol>
          <li>Click <strong>Get Started</strong> on the welcome screen.</li>
          <li>
            Drag and drop your photos onto the upload area, or click to browse
            your files.
          </li>
          <li>
            Follow the five-step workflow: <strong>Upload → Setup →
            Editorial → Finalize → Publish</strong>.
          </li>
          <li>
            Use the interactive tour (Menu → Help → Take a Tour) for a guided
            walkthrough.
          </li>
        </ol>

        <h3>Is there a mobile app?</h3>
        <p>
          KodaPost is a web app that works on all modern browsers including
          mobile. For a fully native mobile experience, you can also create
          carousels via the{" "}
          <a
            href="https://t.me/kodacontentbot"
            target="_blank"
            rel="noopener noreferrer"
          >
            @kodacontentbot Telegram bot
          </a>
          .
        </p>

        <h2 id="uploads-formats">Uploads &amp; Formats</h2>

        <h3>What image formats are supported?</h3>
        <p>
          KodaPost accepts <strong>JPEG, PNG, WebP, and HEIC/HEIF</strong>{" "}
          files. HEIC files (common on iPhones) are automatically converted to
          JPEG during upload.
        </p>

        <h3>What is the maximum file size per image?</h3>
        <p>
          Each image must be <strong>10 MB or smaller</strong>. For best
          results, use high-resolution photos (at least 1080 × 1080 px).
        </p>

        <h3>How many photos can I upload?</h3>
        <p>
          You can upload between <strong>1 and 10 photos</strong> per carousel.
          For the best carousel experience, 3–6 photos is recommended — enough
          for visual variety without overwhelming your audience.
        </p>

        <h3>Can I reorder photos after uploading?</h3>
        <p>
          Yes. In the Editorial step, drag and drop slides to reorder them. The
          first slide becomes the cover image of your carousel.
        </p>

        <h2 id="filters-style">Filters &amp; Style</h2>

        <h3>What are camera emulation filters?</h3>
        <p>
          Camera filters replicate the look of classic film cameras — adjusting
          color grading, grain, contrast, and tone to give your photos a
          distinctive aesthetic. Choose from cameras like Kodak Gold, Fuji
          Velvia, Polaroid, and more.
        </p>

        <h3>Can I adjust the filter intensity?</h3>
        <p>
          Yes. In the Setup step, use the sliders to control <strong>grain,
          vignette, bloom, saturation, contrast</strong>, and other parameters
          independently of the camera preset.
        </p>

        <h3>Can I change the filter after generating?</h3>
        <p>
          Yes. Filters are applied as live CSS overlays at export time. Return
          to the Setup step at any time to change the camera style, predefined
          filter, or fine-tune the sliders — then regenerate.
        </p>

        <h3>What is &ldquo;No Emulation&rdquo;?</h3>
        <p>
          Selecting <strong>No Emulation</strong> in the Camera section uses
          your photos exactly as uploaded with no camera style applied. You can
          still apply predefined filters or adjust individual sliders
          independently.
        </p>

        <h2 id="ai-generation">AI Generation</h2>

        <h3>How does Koda generate text overlays?</h3>
        <p>
          Koda analyzes your uploaded photos and your carousel theme to suggest
          text overlays for each slide. The AI uses visual context (mood,
          composition, subject) combined with your style preferences to write
          concise, compelling slide text.
        </p>

        <h3>Can I edit the generated text?</h3>
        <p>
          Yes. Every text overlay can be edited in the Editorial step. You can
          also toggle text on or off per slide, change font style, and adjust
          text position.
        </p>

        <h3>How do I regenerate text for a single slide?</h3>
        <p>
          In the Editorial step, select a slide and use the regenerate button
          next to the text field to generate a new overlay for that slide only.
        </p>

        <h3>Does Koda store my photos?</h3>
        <p>
          Photos are sent to the Koda processing pipeline (powered by Anthropic
          Claude) solely to generate your carousel content. We do not
          permanently store your images on our servers after processing
          completes. See our{" "}
          <a href="/legal/privacy">Privacy Policy</a> for full details.
        </p>

        <h2 id="publishing">Publishing</h2>

        <h3>Which platforms can I publish to?</h3>
        <p>
          KodaPost supports direct publishing to{" "}
          <strong>Instagram, TikTok, LinkedIn, YouTube, Reddit,</strong> and{" "}
          <strong>Lemon8</strong> via OAuth. You can also export a
          platform-optimised ZIP to post manually.
        </p>

        <h3>How do I connect a social media account?</h3>
        <ol>
          <li>
            Open <strong>Menu → Social Media Settings</strong> (or the Settings
            icon).
          </li>
          <li>Click <strong>Connect</strong> next to the platform you want.</li>
          <li>
            Complete the OAuth authorisation in the new browser tab that opens.
          </li>
          <li>
            Return to KodaPost — the platform will show as connected
            automatically.
          </li>
        </ol>

        <h3>Can I publish to multiple platforms at once?</h3>
        <p>
          Yes. In the Publish step, select all the platforms you want to post
          to, then click <strong>Post Now</strong>. KodaPost publishes
          sequentially and shows a success confirmation for each platform.
        </p>

        <h3>How do I disconnect a social account?</h3>
        <p>
          Go to <strong>Menu → Social Media Settings</strong>, find the
          platform, and click <strong>Disconnect</strong>. This immediately
          removes the stored OAuth token.
        </p>

        <h3>What image sizes are exported?</h3>
        <p>
          KodaPost exports images optimised for each selected platform —
          typically <strong>1:1 (1080 × 1080 px)</strong> for Instagram feed
          posts, and <strong>9:16</strong> for Stories and TikTok. The ZIP
          export includes all sizes.
        </p>

        <h2 id="accounts-billing">Accounts &amp; Billing</h2>

        <h3>Is KodaPost free?</h3>
        <p>
          KodaPost offers a free tier with a limited number of AI-generated
          carousels per month. Premium plans unlock unlimited generation,
          additional platforms, and advanced features. See the pricing page for
          current plans.
        </p>

        <h3>How do I upgrade my plan?</h3>
        <p>
          Sign in and open your Profile (top-right menu → Profile). The billing
          section shows your current plan and upgrade options.
        </p>

        <h3>Can I cancel my subscription?</h3>
        <p>
          Yes. Cancel at any time from your Profile → Billing settings. You
          retain access to premium features until the end of your current
          billing period.
        </p>

        <h2 id="troubleshooting">Troubleshooting</h2>

        <h3>My upload failed — what should I check?</h3>
        <ul>
          <li>Ensure the file is JPEG, PNG, WebP, or HEIC and under 10 MB.</li>
          <li>
            If the file is HEIC, wait for the automatic conversion dialog to
            complete.
          </li>
          <li>Try a different browser if the issue persists (Chrome or Safari recommended).</li>
        </ul>

        <h3>The carousel generation failed — what do I do?</h3>
        <ul>
          <li>Check your internet connection and try again.</li>
          <li>
            If the error persists, try reducing the number of slides or
            uploading fewer images.
          </li>
          <li>
            Contact support at{" "}
            <a href="mailto:support@kodapost.app">support@kodapost.app</a> with
            the error message.
          </li>
        </ul>

        <h3>Publishing to Instagram failed — why?</h3>
        <ul>
          <li>
            Ensure your Instagram account is a <strong>Professional
            account</strong> (Creator or Business). Personal accounts do not
            support API publishing.
          </li>
          <li>
            Try disconnecting and reconnecting your Instagram account in
            Settings.
          </li>
          <li>
            Instagram tokens expire periodically — reconnect to refresh your
            access.
          </li>
        </ul>

        <h3>My project data disappeared — how do I recover it?</h3>
        <p>
          Project data is stored in your browser&rsquo;s local storage. It may
          be lost if you cleared browser data, used a different browser, or
          opened KodaPost in a private/incognito window. We recommend exporting
          your carousel ZIP frequently as a backup.
        </p>

        <h2 id="contact">Contact Support</h2>
        <p>
          If your question isn&rsquo;t answered here, our support team is happy
          to help.
        </p>
        <ul>
          <li>
            <strong>Email:</strong>{" "}
            <a href="mailto:support@kodapost.app">support@kodapost.app</a>
          </li>
          <li>
            <strong>Telegram bot:</strong>{" "}
            <a
              href="https://t.me/kodacontentbot"
              target="_blank"
              rel="noopener noreferrer"
            >
              @kodacontentbot
            </a>
          </li>
          <li>
            <strong>User Guide:</strong>{" "}
            <a href="/guide">Full Getting Started Guide</a>
          </li>
        </ul>
      </article>
      <TableOfContents sections={sections} />
    </div>
  );
}
