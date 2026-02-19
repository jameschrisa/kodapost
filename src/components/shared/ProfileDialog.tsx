"use client";

import { useEffect } from "react";
import { CreditCard, Shield, Bell, Link2, Palette, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  SignInButton,
  SignUpButton,
  UserProfile,
  isClerkEnabled,
} from "@/components/shared/ClerkComponents";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { isSignedIn } = useClerkAuth();

  // Lock body scroll when full-screen overlay is open
  useEffect(() => {
    if (open && isSignedIn) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open, isSignedIn]);

  // Close on Escape key
  useEffect(() => {
    if (!open || !isSignedIn) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, isSignedIn, onOpenChange]);

  // ── Signed-in: full-screen overlay ──
  if (isSignedIn) {
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            key="profile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
          >
            {/* Close button — large & visible */}
            <div className="absolute right-4 top-4 z-10">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-md transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            {/* Scrollable content */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="h-full overflow-y-auto"
            >
              <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Clerk UserProfile — full width, unrestricted */}
                <UserProfile routing="hash" />

                {/* Coming Soon / Billing */}
                <div className="mt-8 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <CreditCard className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Billing & Payments
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Subscription plans and payment management will be available soon.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ── Signed-out: compact dialog for sign-in / sign-up ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>
            Manage your profile, security, and account preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in to save your projects, publish directly, and manage your account settings.
            </p>
            <div className="flex flex-col gap-2">
              <SignInButton mode="modal">
                <Button variant="default" className="w-full gap-2">
                  Sign In
                </Button>
              </SignInButton>

              <SignUpButton mode="modal">
                <Button variant="outline" className="w-full gap-2">
                  Create Account
                </Button>
              </SignUpButton>
            </div>
          </div>

          {/* Fallback sections when Clerk is not configured */}
          {!isClerkEnabled && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Account Management</h3>
              <div className="grid gap-2">
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <Shield className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Security & Password</p>
                    <p className="text-xs text-muted-foreground">
                      Update your password, enable two-factor authentication, and manage active sessions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <Link2 className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Connected Accounts</p>
                    <p className="text-xs text-muted-foreground">
                      Link social accounts for easy sign-in and direct publishing.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <Bell className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Configure email notifications and in-app alerts for your projects.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <Palette className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Preferences</p>
                    <p className="text-xs text-muted-foreground">
                      Set your default export formats, language, and display preferences.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-1">
                Configure Clerk to enable full account management.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
