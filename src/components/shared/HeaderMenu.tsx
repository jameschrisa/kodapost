"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { CircleUser, HelpCircle, Menu, Moon, RefreshCw, Settings, Sun } from "lucide-react";
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
}

export function HeaderMenu({ onOpenHelp, onOpenProfile, onOpenSettings, onResetApp }: HeaderMenuProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render placeholder until mounted
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenHelp}>
          <HelpCircle className="h-4 w-4" />
          Help
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenProfile}>
          <CircleUser className="h-4 w-4" />
          Profile
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
  );
}
