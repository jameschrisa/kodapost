"use client";

import Link from "next/link";
import {
  Settings,
  HelpCircle,
  CircleUser,
  BookOpen,
  Shield,
  FileText,
  Database,
} from "lucide-react";
import { KodaPostIcon } from "@/components/icons";
import { useUserRole } from "@/hooks/useUserRole";

interface FooterProps {
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenProfile: () => void;
}

export function Footer({
  onOpenSettings,
  onOpenHelp,
  onOpenProfile,
}: FooterProps) {
  const { isActualAdmin } = useUserRole();

  return (
    <footer className="border-t bg-muted/30 mt-8">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:py-8 sm:px-6">
        {/* Desktop: grid layout, Mobile: collapsible sections */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Legal links */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/legal/privacy"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/data"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Database className="h-3.5 w-3.5" />
                  Data Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* App links */}
          <div>
            <h3 className="text-sm font-semibold mb-3">App</h3>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={onOpenHelp}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Help & FAQ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CircleUser className="h-3.5 w-3.5" />
                  Account
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </button>
              </li>
              <li>
                <Link
                  href="/guide"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Guide
                </Link>
              </li>
              {isActualAdmin && (
                <li>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
              <KodaPostIcon className="h-4 w-4" />
              KodaPost
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Transform your photos into stunning phonographic carousels with
              vintage camera styles, film filters, and Koda-generated text.
            </p>
          </div>
        </div>

        {/* Mobile: two-column compact footer */}
        <div className="sm:hidden grid grid-cols-2 gap-6">
          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Legal</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/legal/privacy" className="text-sm text-muted-foreground">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-sm text-muted-foreground">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/legal/data" className="text-sm text-muted-foreground">
                  Data Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* App */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Product</h3>
            <ul className="space-y-1.5">
              <li>
                <button type="button" onClick={onOpenHelp} className="text-sm text-muted-foreground">
                  Help
                </button>
              </li>
              <li>
                <button type="button" onClick={onOpenSettings} className="text-sm text-muted-foreground">
                  Settings
                </button>
              </li>
              <li>
                <Link href="/guide" className="text-sm text-muted-foreground">
                  Guide
                </Link>
              </li>
              {isActualAdmin && (
                <li>
                  <Link href="/admin" className="text-sm text-muted-foreground">
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-4 sm:mt-8 border-t pt-3 sm:pt-4">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} KodaPost. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
