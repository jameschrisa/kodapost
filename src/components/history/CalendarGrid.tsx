"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PostCard } from "./PostCard";
import type { PostRecord, CalendarView } from "@/lib/types";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getPostDate(post: PostRecord): Date {
  return new Date(post.publishedAt || post.scheduledAt || post.createdAt);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CalendarGridProps {
  posts: PostRecord[];
  view: CalendarView;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onNavigate: (direction: "prev" | "next") => void;
}

// ---------------------------------------------------------------------------
// Monthly View
// ---------------------------------------------------------------------------

function MonthlyView({
  posts,
  selectedDate,
  onDateSelect,
}: {
  posts: PostRecord[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = startOfDay(new Date());

  // Group posts by date
  const postsByDate = useMemo(() => {
    const map = new Map<string, PostRecord[]>();
    for (const post of posts) {
      const d = getPostDate(post);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate().toString();
        const list = map.get(key) || [];
        list.push(post);
        map.set(key, list);
      }
    }
    return map;
  }, [posts, year, month]);

  const cells: (number | null)[] = [];

  // Leading empty cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div>
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center text-[11px] font-medium text-muted-foreground py-1"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="min-h-[72px]" />;
          }

          const cellDate = new Date(year, month, day);
          const isToday = isSameDay(cellDate, today);
          const isSelected = isSameDay(cellDate, selectedDate);
          const dayPosts = postsByDate.get(day.toString()) || [];

          // Status dots
          const hasPublished = dayPosts.some((p) => p.status === "published");
          const hasScheduled = dayPosts.some((p) => p.status === "scheduled");
          const hasDraft = dayPosts.some((p) => p.status === "draft");

          return (
            <button
              key={day}
              type="button"
              onClick={() => onDateSelect(cellDate)}
              className={cn(
                "min-h-[72px] rounded-md border p-1.5 text-left transition-colors hover:bg-accent/50",
                isSelected && "border-primary bg-primary/5",
                isToday && !isSelected && "border-primary/30",
                !isSelected && !isToday && "border-transparent"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  isToday && "text-primary",
                  !isToday && "text-muted-foreground"
                )}
              >
                {day}
              </span>

              {/* Post indicators */}
              {dayPosts.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {hasPublished && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  )}
                  {hasScheduled && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                  {hasDraft && (
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  )}
                  {dayPosts.length > 1 && (
                    <span className="text-[10px] text-muted-foreground ml-0.5">
                      +{dayPosts.length}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day's posts */}
      {(() => {
        const selDay = selectedDate.getDate();
        const selMonth = selectedDate.getMonth();
        const selYear = selectedDate.getFullYear();
        if (selMonth !== month || selYear !== year) return null;

        const dayPosts = postsByDate.get(selDay.toString()) || [];
        if (dayPosts.length === 0) return null;

        return (
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h4>
            {dayPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Weekly View
// ---------------------------------------------------------------------------

function WeeklyView({
  posts,
  selectedDate,
  onDateSelect,
}: {
  posts: PostRecord[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}) {
  const weekStart = getStartOfWeek(selectedDate);
  const today = startOfDay(new Date());

  const days = useMemo(() => {
    const result: { date: Date; posts: PostRecord[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);

      const dayPosts = posts.filter((p) => isSameDay(getPostDate(p), d));
      result.push({ date: d, posts: dayPosts });
    }
    return result;
  }, [posts, weekStart]);

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(({ date, posts: dayPosts }) => {
        const isToday = isSameDay(date, today);
        const isSelected = isSameDay(date, selectedDate);

        return (
          <div key={date.toISOString()}>
            {/* Day header */}
            <button
              type="button"
              onClick={() => onDateSelect(date)}
              className={cn(
                "w-full text-center rounded-md p-1.5 transition-colors hover:bg-accent/50",
                isSelected && "bg-primary/10",
                isToday && !isSelected && "bg-accent/30"
              )}
            >
              <div className="text-[10px] text-muted-foreground">
                {DAY_NAMES[date.getDay()]}
              </div>
              <div
                className={cn(
                  "text-sm font-medium",
                  isToday && "text-primary"
                )}
              >
                {date.getDate()}
              </div>
            </button>

            {/* Post cards */}
            <div className="mt-1.5 space-y-1.5">
              {dayPosts.map((post) => (
                <PostCard key={post.id} post={post} compact />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Daily View
// ---------------------------------------------------------------------------

function DailyView({
  posts,
  selectedDate,
}: {
  posts: PostRecord[];
  selectedDate: Date;
}) {
  const dayPosts = useMemo(
    () => posts.filter((p) => isSameDay(getPostDate(p), selectedDate)),
    [posts, selectedDate]
  );

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">
        {selectedDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </h3>

      {dayPosts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No posts on this day.
        </p>
      ) : (
        <div className="space-y-2">
          {dayPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CalendarGrid (main export)
// ---------------------------------------------------------------------------

export function CalendarGrid({
  posts,
  view,
  selectedDate,
  onDateSelect,
  onNavigate,
}: CalendarGridProps) {
  // Navigation label
  let navLabel: string;
  if (view === "monthly") {
    navLabel = `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  } else if (view === "weekly") {
    const weekStart = getStartOfWeek(selectedDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    navLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  } else {
    navLabel = selectedDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div>
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("prev")}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h3 className="text-sm font-semibold">{navLabel}</h3>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("next")}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* View content */}
      {view === "monthly" && (
        <MonthlyView
          posts={posts}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
        />
      )}
      {view === "weekly" && (
        <WeeklyView
          posts={posts}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
        />
      )}
      {view === "daily" && (
        <DailyView posts={posts} selectedDate={selectedDate} />
      )}
    </div>
  );
}
