import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans and Pricing — KodaPost",
  description: "Choose the right KodaPost plan for your creative workflow.",
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {children}
    </div>
  );
}
