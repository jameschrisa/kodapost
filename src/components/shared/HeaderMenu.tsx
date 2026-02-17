"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SignedIn, SignedOut, UserButton } from "@/components/shared/ClerkComponents";
import { CircleUser, HelpCircle, Menu, Moon, RefreshCw, Settings, Sun } from "lucide-react";
import { AutomationIcon } from "@/components/icons";
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
  onResetApp: () => void;
  assistantMode?: boolean;
  onToggleAssistant?: () => void;
}

export function HeaderMenu({ onOpenHelp, onOpenProfile, onOpenSettings, onResetApp, assistantMode, onToggleAssistant }: HeaderMenuProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render placeholder until mounted
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-2">
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
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
          {/* Assistant mode toggle */}
          {onToggleAssistant && (
            <DropdownMenuItem onClick={onToggleAssistant}>
              <AutomationIcon className="h-4 w-4" />
              {assistantMode ? "Manual Mode" : "Assistant Mode"}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onOpenHelp}>
            <HelpCircle className="h-4 w-4" />
            Help
          </DropdownMenuItem>
          <SignedOut>
            <DropdownMenuItem onClick={onOpenProfile}>
              <CircleUser className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
          </SignedOut>
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
