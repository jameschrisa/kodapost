"use client";

import { CreditCard, LogIn, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Profile / Account dialog — currently a placeholder for future Clerk integration.
 *
 * When Clerk is integrated, replace the stub buttons with:
 *
 *   import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
 *
 *   <SignedOut>
 *     <SignInButton mode="modal" />
 *     <SignUpButton mode="modal" />
 *   </SignedOut>
 *   <SignedIn>
 *     <UserButton />
 *   </SignedIn>
 *
 * Also wrap the app's root layout with <ClerkProvider> from @clerk/nextjs.
 */

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>
            Sign in to save your projects and publish directly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Auth buttons — stubs for future Clerk integration */}
          <Button
            variant="default"
            className="w-full gap-2"
            onClick={() => {
              // TODO: Replace with Clerk <SignInButton mode="modal">
            }}
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              // TODO: Replace with Clerk <SignUpButton mode="modal">
            }}
          >
            <UserPlus className="h-4 w-4" />
            Create Account
          </Button>

          {/* Divider */}
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

          {/* Billing placeholder */}
          <div className="rounded-lg border border-dashed p-4 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              Billing & Payments
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Subscription plans and payment management will be available after
              account creation.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
