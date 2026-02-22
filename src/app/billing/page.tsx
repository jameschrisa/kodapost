import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BillingDashboard } from "@/components/billing/BillingDashboard";

interface BillingPageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const successParam = params.success === "1" ? "1" : params.canceled === "1" ? "canceled" : undefined;

  return (
    <>
      {/* Back nav */}
      <div className="border-b border-white/10 px-4 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to KodaPost
        </Link>
      </div>

      <BillingDashboard successParam={successParam} />
    </>
  );
}
