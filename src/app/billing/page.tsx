import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { KodaPostIcon } from "@/components/icons";
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
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to KodaPost
          </Link>
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 border border-white/[0.06]">
              <KodaPostIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">KodaPost</span>
          </Link>
        </div>
      </div>

      <BillingDashboard successParam={successParam} />
    </>
  );
}
