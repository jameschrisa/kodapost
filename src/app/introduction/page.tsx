import type { Metadata } from "next";
import IntroductionContent from "./IntroductionContent";

export const metadata: Metadata = {
  title: "Introduction - KodaPost",
  description:
    "Learn about KodaPost's philosophy of human-first creativity and who the platform is built for.",
};

export default function IntroductionPage() {
  return <IntroductionContent />;
}
