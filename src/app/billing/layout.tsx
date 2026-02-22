import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing & Plan — KodaPost",
  description: "Manage your KodaPost subscription and payment method.",
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {children}
    </div>
  );
}
