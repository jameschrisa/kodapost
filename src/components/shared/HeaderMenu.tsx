"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { SignedIn } from "@/components/shared/ClerkComponents";
import { useSignOut } from "@/components/shared/ClerkComponents";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserInfo } from "@/hooks/useUserInfo";
import {
  Bot,
  Eye,
  EyeOff,
  HelpCircle,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Settings,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { UserHexagonIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderMenuProps {
  onOpenHelp: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenContentBot: () => void;
  onResetApp: () => void;
}

export function HeaderMenu({
  onOpenHelp,
  onOpenProfile,
  onOpenSettings,
  onOpenContentBot,
  onResetApp,
}: HeaderMenuProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { signOut } = useSignOut();
  const role = useUserRole();
  const userInfo = useUserInfo();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render placeholder until mounted
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  // Display name for profile dropdown
  const displayName =
    [userInfo.firstName, userInfo.lastName].filter(Boolean).join(" ") || "User";

  return (
    <div className="flex items-center gap-1">
      {/* ── Profile Dropdown (signed-in users) ── */}
      <SignedIn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Profile menu"
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              {userInfo.imageUrl ? (
                <img
                  src={userInfo.imageUrl}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <UserHexagonIcon className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* User info header */}
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3">
                {userInfo.imageUrl ? (
                  <img
                    src={userInfo.imageUrl}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  {userInfo.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {userInfo.email}
                    </p>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Profile */}
            <DropdownMenuItem onClick={onOpenProfile}>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>

            {/* Admin-only items */}
            {role.isActualAdmin && (
              <>
                <DropdownMenuItem onClick={() => router.push("/admin")}>
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    role.setAdminViewMode(
                      role.adminViewMode === "admin" ? "user" : "admin"
                    )
                  }
                >
                  {role.adminViewMode === "admin" ? (
                    <>
                      <Eye className="h-4 w-4" />
                      View as User
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      View as Admin
                    </>
                  )}
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            {/* Log Out */}
            <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
              <LogOut className="h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SignedIn>

      {/* ── App Menu (hamburger) ── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Theme toggle */}
          <DropdownMenuItem
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {mounted ? (isDark ? "Light Mode" : "Dark Mode") : "Toggle Theme"}
          </DropdownMenuItem>
          {/* Content Bot panel */}
          <DropdownMenuItem onClick={onOpenContentBot}>
            <Bot className="h-4 w-4" />
            Content Bot
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onOpenHelp}>
            <HelpCircle className="h-4 w-4" />
            Help
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenSettings}>
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onResetApp}>
            <RefreshCw className="h-4 w-4" />
            Start Fresh
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
