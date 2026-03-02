import type { Metadata } from "next";
import Link from "next/link";
import { KodaPostIcon } from "@/components/icons";
import { PageTransition } from "@/components/shared/PageTransition";

export const metadata: Metadata = {
  title: "About - KodaPost",
  description:
    "KodaPost empowers content creators with AI-assisted tools that amplify your voice — never replace it.",
};

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/billing" },
  { label: "About", href: "/about" },
  { label: "Support", href: "/support" },
];

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3.5">
          {/* Brand — links home */}
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/[0.06]">
              <KodaPostIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">KodaPost</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  link.href === "/about"
                    ? "text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Spacer to balance layout on mobile when nav is hidden */}
          <div className="w-8 md:hidden" />
        </div>
      </header>
      <PageTransition>
        <main className="w-full">
          {children}
        </main>
      </PageTransition>
    </div>
  );
}
