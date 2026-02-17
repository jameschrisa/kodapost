"use client";

import { CreditCard } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserProfile,
} from "@/components/shared/ClerkComponents";
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
          <SignedOut>
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
          </SignedOut>

          <SignedIn>
            <UserProfile />
          </SignedIn>

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
