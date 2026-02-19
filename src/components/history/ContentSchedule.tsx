"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, CalendarDays, CalendarRange, Loader2, Sparkles, SquarePen } from "lucide-react";
import { CalendarGrid } from "./CalendarGrid";
import { PostCard } from "./PostCard";
import { cn } from "@/lib/utils";
import type { PostRecord, CalendarView } from "@/lib/types";

// ---------------------------------------------------------------------------
// View toggle options
// ---------------------------------------------------------------------------

const VIEW_OPTIONS: { key: CalendarView; label: string; icon: React.ReactNode }[] = [
  { key: "daily", label: "Day", icon: <Calendar className="h-3.5 w-3.5" /> },
  { key: "weekly", label: "Week", icon: <CalendarRange className="h-3.5 w-3.5" /> },
  { key: "monthly", label: "Month", icon: <CalendarDays className="h-3.5 w-3.5" /> },
];

// ---------------------------------------------------------------------------
// ContentSchedule — inline calendar for the main page
// ---------------------------------------------------------------------------

export function ContentSchedule() {
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
        // Silently fail — calendar still renders
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

  // Separate drafts for the sidebar
  const drafts = posts.filter((p) => p.status === "draft");
  const hasAnyPosts = posts.length > 0;

  return (
    <div className="pt-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Content Calendar</h2>
          <p className="text-sm text-muted-foreground">
            {hasAnyPosts
              ? "View your published, scheduled, and draft posts"
              : "Your content calendar — posts will appear here as you publish"}
          </p>
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

      {/* Loading state — overlay on calendar area */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Calendar — always visible */}
          <div className="rounded-xl border bg-card p-4">
            {!hasAnyPosts && (
              <div className="mb-4 rounded-lg border border-dashed border-purple-500/20 bg-purple-500/5 px-6 py-6 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-purple-400">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="text-sm font-semibold">No posts yet</h3>
                </div>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Create your first carousel in the <span className="inline-flex items-center gap-1 font-medium text-foreground"><SquarePen className="h-3 w-3" /> Create Post</span> tab. Once you publish, your posts will appear here on the calendar.
                </p>
                <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/70 pt-1">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500/60" /> Published</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500/60" /> Scheduled</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-500/60" /> Draft</span>
                </div>
              </div>
            )}
            <CalendarGrid
              posts={posts}
              view={view}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onNavigate={handleNavigate}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Drafts */}
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
                <div className="flex justify-between border-t pt-2 mt-2">
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
