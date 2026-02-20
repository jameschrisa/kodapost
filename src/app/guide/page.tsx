import type { Metadata } from "next";
import { TableOfContents } from "@/components/legal/TableOfContents";

export const metadata: Metadata = {
  title: "Getting Started Guide - KodaPost",
  description:
    "Learn how to create carousel posts with KodaPost — in the app or directly from Telegram.",
};

const sections = [
  { id: "overview", title: "Overview" },
  { id: "create-in-app", title: "Create in the App" },
  { id: "create-on-telegram", title: "Create on Telegram" },
  { id: "the-flow", title: "The Flow" },
  { id: "tips", title: "Tips for Great Posts" },
  { id: "commands", title: "Commands Reference" },
];

export default function GuidePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Getting Started</h1>
        <p className="border-l-4 border-foreground/20 pl-4 text-muted-foreground !mt-2">
          Everything you need to create beautiful carousel posts — in the app or
          on Telegram.
        </p>

        <h2 id="overview">Overview</h2>
        <p>
          KodaPost turns your photos into polished, ready-to-post social media
          carousels. You bring the photos and the story — the app handles
          the layout, text overlays, captions, and formatting.
        </p>
        <p>There are two ways to create:</p>
        <ul>
          <li>
            <strong>In the app</strong> &mdash; Use the step-by-step builder to
            configure everything visually.
          </li>
          <li>
            <strong>On Telegram</strong> &mdash; Message{" "}
            <strong>@kodacontentbot</strong> and create carousels through a
            guided conversation. The Production Assistant walks you through
            each step.
          </li>
        </ul>
        <p>Both methods follow the same flow and produce the same results.</p>

        <h2 id="create-in-app">Create in the App</h2>
        <p>
          The builder gives you full control over every step. Upload your photos,
          write your story, pick vibes, adjust slide count, and generate your
          carousel.
        </p>
        <ol>
          <li>
            <strong>Upload photos</strong> &mdash; Drag and drop or tap the
            upload area. Supports JPEG, PNG, WebP, and HEIC.
          </li>
          <li>
            <strong>Write your story</strong> &mdash; Describe the moment, the
            feeling, or what happened. This becomes the foundation for your text
            overlays and caption.
          </li>
          <li>
            <strong>Pick vibes</strong> &mdash; Choose a tone (relatable,
            inspirational, promotional, controversial, or observational) to shape
            how the caption reads.
          </li>
          <li>
            <strong>Generate caption</strong> &mdash; Tap &ldquo;Generate
            Caption from Story&rdquo; to create a caption based on your story
            and vibes. Edit it however you like.
          </li>
          <li>
            <strong>Generate carousel</strong> &mdash; Hit the generate button
            to build your slides with text overlays, camera filters, and
            platform-specific formatting.
          </li>
          <li>
            <strong>Preview and download</strong> &mdash; Review your slides,
            make edits, and download or publish.
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
            <strong>Send your photos</strong> &mdash; Drop 1&ndash;10 images
            into the chat.
          </li>
          <li>
            <strong>Tell your story</strong> &mdash; The bot will ask what the
            post is about. Just type naturally.
          </li>
          <li>
            <strong>Pick vibes</strong> &mdash; Type a vibe like
            &ldquo;relatable&rdquo; or &ldquo;inspirational&rdquo;, or say
            &ldquo;skip&rdquo; to use defaults.
          </li>
          <li>
            <strong>Review caption</strong> &mdash; The bot generates a caption.
            You can approve it, type a new one, or say
            &ldquo;rewrite&rdquo; for a fresh take.
          </li>
          <li>
            <strong>Generate</strong> &mdash; Say &ldquo;generate&rdquo; and the
            bot will build your carousel and send you a preview link.
          </li>
        </ol>
        <p>
          The preview link lets you view all your slides, copy the caption, and
          download the images — all from your phone.
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
                <strong>1. Photos</strong>
              </td>
              <td>Upload 1&ndash;10 images</td>
              <td>Images are analyzed for composition, mood, and color</td>
            </tr>
            <tr>
              <td>
                <strong>2. Story</strong>
              </td>
              <td>Describe the moment or theme</td>
              <td>
                Your words become the foundation for text overlays and captions
              </td>
            </tr>
            <tr>
              <td>
                <strong>3. Vibes</strong>
              </td>
              <td>Pick a tone</td>
              <td>Shapes the voice and style of your caption</td>
            </tr>
            <tr>
              <td>
                <strong>4. Caption</strong>
              </td>
              <td>Review, edit, or write your own</td>
              <td>
                Koda generates a caption from your story, or you write it yourself
              </td>
            </tr>
            <tr>
              <td>
                <strong>5. Generate</strong>
              </td>
              <td>Approve and build</td>
              <td>
                Slides are composited with text overlays, filters, and
                platform-specific formatting
              </td>
            </tr>
          </tbody>
        </table>

        <h2 id="tips">Tips for Great Posts</h2>
        <ul>
          <li>
            <strong>Use 3&ndash;6 photos</strong> for the best carousel
            experience. Too few feels sparse, too many can overwhelm.
          </li>
          <li>
            <strong>Write a specific story</strong> rather than something
            generic. &ldquo;Sunrise hike at Joshua Tree last weekend&rdquo;
            produces better results than &ldquo;nature photos.&rdquo;
          </li>
          <li>
            <strong>Mix your shots</strong> &mdash; include a wide shot, a
            close-up, and a detail shot for visual variety across slides.
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
