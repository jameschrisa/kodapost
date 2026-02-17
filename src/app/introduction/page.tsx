import type { Metadata } from "next";
import { TableOfContents } from "@/components/legal/TableOfContents";

export const metadata: Metadata = {
  title: "Introduction - KodaPost",
  description:
    "Learn about KodaPost's philosophy of human-first creativity and who the platform is built for.",
};

const sections = [
  { id: "our-philosophy", title: "Our Philosophy" },
  { id: "human-first-creativity", title: "Human-First Creativity" },
  { id: "role-of-ai", title: "The Role of AI" },
  { id: "who-is-kodapost-for", title: "Who Is KodaPost For?" },
  { id: "get-started", title: "Get Started" },
];

export default function IntroductionPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Introduction</h1>
        <p className="border-l-4 border-foreground/20 pl-4 text-muted-foreground !mt-2">
          The story behind KodaPost and what we believe in.
        </p>

        <h2 id="our-philosophy">Our Philosophy</h2>
        <p>
          KodaPost was built on a simple belief:{" "}
          <strong>
            the best content comes from real people with real stories.
          </strong>{" "}
          In a world increasingly filled with algorithmically generated images,
          auto-written captions, and AI-produced art, we chose a different path.
        </p>
        <p>
          We believe that photography, written storytelling, and verbal
          expression are deeply human acts of creativity. A photograph you took
          on a morning walk, a story you wrote about your grandmother&rsquo;s
          kitchen, a voice memo you recorded while an idea was still fresh.
          These are the raw materials of meaningful content. No algorithm
          can replicate the intention, emotion, and perspective you bring to your
          own work.
        </p>

        <h2 id="human-first-creativity">Human-First Creativity</h2>
        <p>
          At KodaPost, <strong>you are the creator.</strong> Every carousel
          starts with your photos, your words, and your vision. We never
          generate images from scratch, fabricate stories, or replace your voice
          with synthetic text. The creative decisions, what to
          photograph, which moments matter, what story to tell, and how to tell
          it, those always belong to you.
        </p>
        <p>
          This is what we mean by <em>human-first creativity</em>: the belief
          that real people should continue to create art through photography,
          written expression, and verbal storytelling. The curation, the
          editorial choices, and the creative direction are yours alone.
          Generative AI is not the artist here. You are.
        </p>

        <h2 id="role-of-ai">The Role of AI</h2>
        <p>
          So where does AI fit in? AI takes a back seat. It handles the
          logistics and technical work that would otherwise slow you down:
        </p>
        <ul>
          <li>
            <strong>Image Processing:</strong> Applying vintage camera filters,
            film grain, and color grading to your photographs so they feel
            cohesive and intentional.
          </li>
          <li>
            <strong>Layout and Formatting:</strong> Arranging your photos into
            properly sized carousel slides for each social media platform,
            handling aspect ratios and safe zones automatically.
          </li>
          <li>
            <strong>Text Suggestions:</strong> Offering headline and caption
            ideas based on your theme and keywords, suggestions you can
            accept, edit, or ignore entirely.
          </li>
          <li>
            <strong>Technical Optimization:</strong> Compositing images with
            text overlays, managing export quality, and formatting for
            multi-platform publishing.
          </li>
        </ul>
        <p>
          In every case, AI serves as your assistant, not your replacement. It
          handles the tedious production work so you can focus on what matters:
          your creative vision.
        </p>

        <h2 id="who-is-kodapost-for">Who Is KodaPost For?</h2>
        <p>
          KodaPost is built for people who want to express their own creativity
          and independence without AI taking over:
        </p>
        <ul>
          <li>
            <strong>Content Creators</strong> who want to share authentic visual
            stories with their audience, not recycled templates or
            AI-generated stock imagery.
          </li>
          <li>
            <strong>Entrepreneurs</strong> building personal brands rooted in
            genuine storytelling, where every post reflects who they actually
            are and what they actually do.
          </li>
          <li>
            <strong>Artists and Photographers</strong> who value the craft of
            image-making and want tools that enhance their work rather than
            replace it.
          </li>
          <li>
            <strong>Anyone</strong> who believes their voice, their perspective,
            and their creative choices matter more than what an algorithm would
            produce for them.
          </li>
        </ul>

        <h2 id="get-started">Get Started</h2>
        <p>
          Ready to create something that&rsquo;s genuinely yours? Upload your
          photos, tell your story, and let KodaPost handle the rest of the
          production work. Your creativity leads, and we just make it easier
          to share.
        </p>
        <p>
          <a href="/">Start creating your first carousel &rarr;</a>
        </p>
      </article>
      <TableOfContents sections={sections} />
    </div>
  );
}
