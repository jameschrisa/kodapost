"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, FileText, Database } from "lucide-react";

const legalPages = [
  { href: "/legal/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/legal/terms", label: "Terms of Use", icon: FileText },
  { href: "/legal/data", label: "Data Policy", icon: Database },
];

export function LegalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Legal pages">
      {legalPages.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
            pathname === href
              ? "bg-foreground text-background font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
