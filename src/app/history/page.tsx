"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect /history to the main page's Content Schedule tab.
 * The calendar is now integrated directly into the main page.
 */
export default function HistoryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
