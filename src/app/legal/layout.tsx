import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { LegalNav } from "@/components/legal/LegalNav";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to KodaPost
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Camera className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">KodaPost</span>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <LegalNav />
      </div>
      <main className="legal-content mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
