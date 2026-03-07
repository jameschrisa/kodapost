import type { Metadata, Viewport } from "next";
import {
  Inter,
  Montserrat,
  Poppins,
  Playfair_Display,
  Merriweather,
  Lora,
  Bodoni_Moda,
  Cinzel,
  Abril_Fatface,
  DM_Serif_Display,
  Prata,
  Syne,
  Bebas_Neue,
} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { LanguageProvider } from "@/i18n/context";
import { ApiProgressBar } from "@/components/shared/ApiProgressBar";
import "./globals.css";

const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-merriweather",
});

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-bodoni-moda",
  adjustFontFallback: false,
});

const cinzel = Cinzel({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cinzel",
});

const abrilFatface = Abril_Fatface({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-abril-fatface",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-dm-serif-display",
});

const prata = Prata({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-prata",
});

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-bebas-neue",
});

// Allow server actions (generation, compositing) up to 60s on Vercel Pro.
// Without this, the default 10s timeout causes silent failures for large carousels.
export const maxDuration = 60;

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: "KodaPost - Create Stunning Phonographic Carousels",
  description:
    "Transform your photos into stunning phonographic carousels for social media",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KodaPost",
    startupImage: [
      {
        url: "/icons/apple-startup-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/icons/apple-startup-1179x2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/icons/apple-startup-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/icons/apple-startup-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyClasses = `${inter.variable} ${montserrat.variable} ${poppins.variable} ${playfairDisplay.variable} ${merriweather.variable} ${lora.variable} ${bodoniModa.variable} ${cinzel.variable} ${abrilFatface.variable} ${dmSerifDisplay.variable} ${prata.variable} ${syne.variable} ${bebasNeue.variable} font-sans antialiased`;

  // When Clerk is configured, ClerkProvider wraps the entire tree (required
  // by Clerk — must be the outermost provider above any useAuth/useUser calls).
  const swScript = (
    <script
      dangerouslySetInnerHTML={{
        __html: `if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}))`,
      }}
    />
  );

  if (clerkPubKey) {
    return (
      <ClerkProvider publishableKey={clerkPubKey}>
        <html lang="en" suppressHydrationWarning>
          <body className={bodyClasses}>
            <ThemeProvider>
              <LanguageProvider>
                <ApiProgressBar />
                {children}
                <Toaster />
              </LanguageProvider>
            </ThemeProvider>
            {swScript}
          </body>
        </html>
      </ClerkProvider>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClasses}>
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
        {swScript}
      </body>
    </html>
  );
}
