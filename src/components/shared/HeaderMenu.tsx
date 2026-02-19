"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { SignedIn } from "@/components/shared/ClerkComponents";
import { useSignOut } from "@/components/shared/ClerkComponents";
import { useUserRole } from "@/hooks/useUserRole";
import { Bot, HelpCircle, LogOut, Menu, Moon, RefreshCw, Settings, Shield, Sun } from "lucide-react";
import { UserHexagonIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export function HeaderMenu({ onOpenHelp, onOpenProfile, onOpenSettings, onOpenContentBot, onResetApp }: HeaderMenuProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { signOut } = useSignOut();
  const role = useUserRole();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render placeholder until mounted
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-2">
      <SignedIn>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenProfile}
          aria-label="Open profile"
          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
        >
          <UserHexagonIcon className="h-5 w-5" />
        </Button>
      </SignedIn>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Theme toggle */}
          <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
          {/* Admin Dashboard — admin only */}
          {role.isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/admin")}>
                <Shield className="h-4 w-4" />
                Admin Dashboard
              </DropdownMenuItem>
            </>
          )}
          {/* Log Out — signed in only */}
          <SignedIn>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
              <LogOut className="h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </SignedIn>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
