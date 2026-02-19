"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CalendarDays, CalendarRange, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/history/CalendarGrid";
import { PostCard } from "@/components/history/PostCard";
import { cn } from "@/lib/utils";
import type { PostRecord, CalendarView } from "@/lib/types";

// ---------------------------------------------------------------------------
// View toggle button group
// ---------------------------------------------------------------------------

const VIEW_OPTIONS: { key: CalendarView; label: string; icon: React.ReactNode }[] = [
  { key: "daily", label: "Day", icon: <Calendar className="h-3.5 w-3.5" /> },
  { key: "weekly", label: "Week", icon: <CalendarRange className="h-3.5 w-3.5" /> },
  { key: "monthly", label: "Month", icon: <CalendarDays className="h-3.5 w-3.5" /> },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function HistoryPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<CalendarView>("monthly");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch posts
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const res = await fetch("/api/posts");
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  // Navigation handler
  const handleNavigate = useCallback(
    (direction: "prev" | "next") => {
      setSelectedDate((prev) => {
        const d = new Date(prev);
        const delta = direction === "prev" ? -1 : 1;

        if (view === "monthly") {
          d.setMonth(d.getMonth() + delta);
        } else if (view === "weekly") {
          d.setDate(d.getDate() + delta * 7);
        } else {
          d.setDate(d.getDate() + delta);
        }

        return d;
      });
    },
    [view]
  );

  // Separate drafts for the sidebar list
  const drafts = posts.filter((p) => p.status === "draft");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Post History</h1>
            <p className="text-sm text-muted-foreground">
              View your published, scheduled, and draft posts
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
          {VIEW_OPTIONS.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium">No posts yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Create your first carousel and publish it to see your content
            history here.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/")}
          >
            Create a Carousel
          </Button>
        </div>
      )}

      {/* Content */}
      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Calendar */}
          <div className="rounded-xl border bg-card p-4">
            <CalendarGrid
              posts={posts}
              view={view}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onNavigate={handleNavigate}
            />
          </div>

          {/* Sidebar — Drafts */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">Drafts</h3>
              {drafts.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No draft posts.
                </p>
              ) : (
                <div className="space-y-2">
                  {drafts.map((post) => (
                    <PostCard key={post.id} post={post} compact />
                  ))}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">Summary</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Published</span>
                  <span className="font-medium">
                    {posts.filter((p) => p.status === "published").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheduled</span>
                  <span className="font-medium">
                    {posts.filter((p) => p.status === "scheduled").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Drafts</span>
                  <span className="font-medium">{drafts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{posts.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
