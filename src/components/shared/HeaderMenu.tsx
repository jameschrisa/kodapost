"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { SignedIn } from "@/components/shared/ClerkComponents";
import { useSignOut } from "@/components/shared/ClerkComponents";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useUserPlan } from "@/hooks/useUserPlan";
import {
  Activity,
  BookOpen,
  Bot,
  Bug,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  HelpCircle,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Moon,
  Palette,
  RefreshCw,
  Settings,
  Shield,
  Sun,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { AvatarDisplay } from "@/components/shared/AvatarDisplay";
import { useTestMode } from "@/hooks/useTestMode";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderMenuProps {
  onOpenHelp: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenAdvancedSettings: () => void;
  onOpenContentBot: () => void;
  onResetApp: () => void;
  onOpenTour: () => void;
  onOpenAvatarPicker?: () => void;
}

export function HeaderMenu({
  onOpenHelp,
  onOpenProfile,
  onOpenSettings,
  onOpenAdvancedSettings,
  onOpenContentBot,
  onResetApp,
  onOpenTour,
  onOpenAvatarPicker,
}: HeaderMenuProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { signOut } = useSignOut();
  const role = useUserRole();
  const userInfo = useUserInfo();
  const userPlan = useUserPlan();
  const testMode = useTestMode();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render placeholder until mounted
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  // Display name for profile dropdown
  const displayName =
    [userInfo.firstName, userInfo.lastName].filter(Boolean).join(" ") || "User";

  return (
    <div className="flex items-center gap-2">
      {/* Test Mode indicator */}
      {testMode.enabled && (
        <button
          onClick={testMode.download}
          className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-mono text-orange-400 hover:bg-orange-500/25 transition-colors"
          title="Test Mode active. Click to download debug log."
        >
          <Bug className="h-3 w-3" />
          TEST
          <span className="tabular-nums">{testMode.logCount}</span>
        </button>
      )}
      {/* ── Profile Dropdown (signed-in users) ── */}
      <SignedIn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Profile menu"
              className="h-11 w-11 sm:h-9 sm:w-9 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              <AvatarDisplay size="sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* User info header */}
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3">
                <AvatarDisplay size="md" />
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

            {/* Change Avatar */}
            {onOpenAvatarPicker && (
              <DropdownMenuItem onClick={onOpenAvatarPicker}>
                <Palette className="h-4 w-4" />
                Change Avatar
              </DropdownMenuItem>
            )}

            {/* Plans and Pricing */}
            <DropdownMenuItem asChild>
              <Link href="/billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="flex-1">Plans and Pricing</span>
                <span className="text-[10px] font-semibold text-purple-400">
                  {role.isAdmin ? "Admin" : userPlan.config.displayName}
                </span>
              </Link>
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={testMode.toggle}>
                  <Bug className="h-4 w-4" />
                  {testMode.enabled ? "Disable Test Mode" : "Enable Test Mode"}
                  {testMode.enabled && (
                    <span className="ml-auto text-[10px] font-mono text-orange-400">
                      {testMode.logCount}
                    </span>
                  )}
                </DropdownMenuItem>
                {testMode.enabled && (
                  <DropdownMenuItem onClick={testMode.download}>
                    <Download className="h-4 w-4" />
                    Download Debug Log
                  </DropdownMenuItem>
                )}
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
          <Button variant="ghost" size="icon" aria-label="Menu" data-tour="header-settings" className="h-11 w-11 sm:h-9 sm:w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Settings submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={onOpenContentBot}>
                <Bot className="h-4 w-4" />
                Content Bot
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="h-4 w-4" />
                Social Media
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenAdvancedSettings}>
                <Activity className="h-4 w-4" />
                Advanced
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {/* Help submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <HelpCircle className="h-4 w-4" />
              Help
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={onOpenHelp}>
                <HelpCircle className="h-4 w-4" />
                Help Center
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenTour}>
                <MapPin className="h-4 w-4" />
                Take a Tour
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/guide" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  User Guide
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/quickstart" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Quick Start
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/support" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Support FAQ
                </Link>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
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
