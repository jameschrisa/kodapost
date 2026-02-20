"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ExternalLink,
  Send,
  BookOpen,
  RefreshCw,
  Users,
  Palette,
  Bot as BotIcon,
  Sparkles,
  Share2,
  Shield,
  Loader2,
} from "lucide-react";
import { KodaPostIcon } from "@/components/icons";
import { useUserRole } from "@/hooks/useUserRole";
import { clearAllStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  plan: string;
  role: string;
  trialStartDate: string | null;
  createdAt: number;
  lastSignInAt: number | null;
}

// ---------------------------------------------------------------------------
// Feature catalog
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    category: "Creation",
    icon: Palette,
    items: [
      "Carousel builder (5-step workflow)",
      "Single post mode",
      "Camera emulation (18 vintage profiles)",
      "Film filters (9 predefined + custom 5-parameter adjustments)",
      "Text overlays (15 font families, freeform positioning)",
      "CSV import for bulk text overrides",
      "HEIC/HEIF image support",
    ],
  },
  {
    category: "Koda Engine",
    icon: Sparkles,
    items: [
      "Claude Vision image analysis",
      "Koda-generated captions from story + vibes",
      "Text overlay generation",
      "Intent classification for assistant",
    ],
  },
  {
    category: "Publishing",
    icon: Share2,
    items: [
      "6 social platforms (Instagram, TikTok, LinkedIn, YouTube, Reddit, Lemon8)",
      "OAuth connection management",
      "Export individual slides or full carousel",
      "Caption copy-to-clipboard",
    ],
  },
  {
    category: "Integrations",
    icon: BotIcon,
    items: [
      "Telegram Content Bot (@kodacontentbot)",
      "Headless API with API key auth",
      "Clerk authentication (email, Google, Apple SSO)",
      "Webhook-based Telegram updates",
      "Public carousel preview links",
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const role = useUserRole();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Guard: redirect non-admins (use isActualAdmin so admin page is
  // accessible even when the admin is in "user" view mode)
  useEffect(() => {
    if (role.isLoaded && !role.isActualAdmin) {
      router.replace("/");
    }
  }, [role.isLoaded, role.isActualAdmin, router]);

  // Load users
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users?limit=50");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users);
      setTotalCount(data.totalCount);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role.isLoaded && role.isActualAdmin) {
      loadUsers();
    }
  }, [role.isLoaded, role.isActualAdmin, loadUsers]);

  // Update user metadata
  const updateUser = useCallback(
    async (userId: string, updates: { plan?: string; role?: string; trialStartDate?: string }) => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error("Failed to update user");
        toast.success("User updated");
        loadUsers(); // refresh
      } catch {
        toast.error("Failed to update user");
      }
    },
    [loadUsers]
  );

  const handleStartFresh = useCallback(() => {
    clearAllStorage();
    toast.success("App reset", {
      description: "All local data cleared.",
    });
  }, []);

  // Loading / guard state
  if (!role.isLoaded || !role.isActualAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Developer tools, feature overview, and user management.
        </p>
      </div>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <a
            href="https://kodapost-command.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <KodaPostIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Command Center</p>
              <p className="text-xs text-muted-foreground truncate">
                kodapost-command.vercel.app
              </p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>

          <a
            href="https://t.me/kodacontentbot"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Send className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Telegram Bot</p>
              <p className="text-xs text-muted-foreground">@kodacontentbot</p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>

          <Link
            href="/guide"
            className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <BookOpen className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Getting Started Guide</p>
              <p className="text-xs text-muted-foreground">/guide</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Feature Overview */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Feature Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ category, icon: Icon, items }) => (
            <div key={category} className="rounded-lg border p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Icon className="h-4 w-4 text-primary" />
                {category}
              </h3>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* User Management */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
            {totalCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({totalCount})
              </span>
            )}
          </h2>
          <Button variant="outline" size="sm" onClick={loadUsers} disabled={usersLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${usersLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {usersLoading && users.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No users found. Make sure Clerk is configured.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">User</th>
                  <th className="px-4 py-2.5 text-left font-medium">Plan</th>
                  <th className="px-4 py-2.5 text-left font-medium">Role</th>
                  <th className="px-4 py-2.5 text-left font-medium">
                    Trial Start
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <div>
                        <p className="font-medium">
                          {u.firstName || u.lastName
                            ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {u.email || "No email"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.plan === "registered"
                            ? "bg-green-500/10 text-green-500"
                            : u.plan === "trial"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.plan || "none"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-purple-500/10 text-purple-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {u.trialStartDate
                        ? new Date(u.trialStartDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1.5">
                        {u.plan !== "registered" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() =>
                              updateUser(u.id, { plan: "registered" })
                            }
                          >
                            Register
                          </Button>
                        )}
                        {u.plan !== "trial" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() =>
                              updateUser(u.id, {
                                plan: "trial",
                                trialStartDate: new Date().toISOString(),
                              })
                            }
                          >
                            Start Trial
                          </Button>
                        )}
                        {u.role !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => updateUser(u.id, { role: "admin" })}
                          >
                            Make Admin
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* App Actions */}
      <section>
        <h2 className="text-lg font-semibold mb-4">App Actions</h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleStartFresh}>
            <RefreshCw className="h-4 w-4" />
            Start Fresh
          </Button>
        </div>
      </section>
    </div>
  );
}
