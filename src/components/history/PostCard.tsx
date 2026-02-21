"use client";

import {
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Image as ImageIcon,
  Images,
  ExternalLink,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostRecord } from "@/lib/types";

// ---------------------------------------------------------------------------
// Platform icon mapping
// ---------------------------------------------------------------------------

const TikTokIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.2 8.2 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.14z" />
  </svg>
);

const RedditIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z" />
  </svg>
);


function getPlatformIcon(platform?: string) {
  switch (platform) {
    case "instagram":
      return <Instagram className="h-3.5 w-3.5" />;
    case "tiktok":
      return <TikTokIcon />;
    case "linkedin":
      return <Linkedin className="h-3.5 w-3.5" />;
    case "youtube":
    case "youtube_shorts":
      return <Youtube className="h-3.5 w-3.5" />;
    case "reddit":
      return <RedditIcon />;
    default:
      return null;
  }
}

function getPlatformLabel(platform?: string): string {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    youtube_shorts: "YouTube Shorts",
    reddit: "Reddit",
    x: "X/Twitter",
  };
  return platform ? labels[platform] ?? platform : "";
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  published: {
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Published",
  },
  scheduled: {
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: <Clock className="h-3 w-3" />,
    label: "Scheduled",
  },
  draft: {
    color: "bg-muted text-muted-foreground border-border",
    icon: <FileText className="h-3 w-3" />,
    label: "Draft",
  },
  failed: {
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Failed",
  },
};

// ---------------------------------------------------------------------------
// Timestamp formatting
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return `${mins}m ago`;
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }
  if (diffHours < 48) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// ---------------------------------------------------------------------------
// PostCard component
// ---------------------------------------------------------------------------

interface PostCardProps {
  post: PostRecord;
  compact?: boolean;
}

export function PostCard({ post, compact = false }: PostCardProps) {
  const statusConfig = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft;
  const timestamp = post.publishedAt || post.scheduledAt || post.createdAt;
  const platformIcon = getPlatformIcon(post.platform);
  const platformLabel = getPlatformLabel(post.platform);

  const content = (
    <div
      className={cn(
        "group rounded-lg border bg-card p-3 transition-colors",
        post.postUrl && "hover:border-primary/30 cursor-pointer",
        compact && "p-2"
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Post type icon */}
        <div className="mt-0.5 shrink-0 text-muted-foreground">
          {post.postType === "carousel" ? (
            <Images className="h-4 w-4" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title */}
          <p
            className={cn(
              "font-medium truncate",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {post.title}
          </p>

          {/* Meta row */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {/* Status badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5",
                statusConfig.color
              )}
            >
              {statusConfig.icon}
              {!compact && statusConfig.label}
            </span>

            {/* Platform */}
            {platformIcon && (
              <span className="inline-flex items-center gap-1">
                {platformIcon}
                {!compact && platformLabel}
              </span>
            )}

            {/* Post type */}
            <span>
              {post.postType === "carousel"
                ? `Carousel (${post.slideCount} slides)`
                : "Single"}
            </span>

            {/* Timestamp */}
            <span>{formatTimestamp(timestamp)}</span>

            {/* External link icon */}
            {post.postUrl && (
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (post.postUrl) {
    return (
      <a
        href={post.postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
}
