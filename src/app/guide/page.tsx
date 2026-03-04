import type { Metadata } from "next";
import GuideContent from "./GuideContent";

export const metadata: Metadata = {
  title: "Getting Started Guide - KodaPost",
  description:
    "Learn how to create carousel posts with KodaPost, in the app or directly from Telegram.",
};

export default function GuidePage() {
  return <GuideContent />;
}
