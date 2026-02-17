import type { Metadata } from "next";
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
import "./globals.css";

const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-merriweather",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-bodoni-moda",
  adjustFontFallback: false,
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const abrilFatface = Abril_Fatface({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-abril-fatface",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-dm-serif-display",
});

const prata = Prata({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-prata",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas-neue",
});

// When Clerk is configured, the root layout wraps ClerkProvider which
// requires runtime context — so we force dynamic rendering.
export const dynamic = clerkPubKey ? "force-dynamic" : "auto";

export const metadata: Metadata = {
  title: "KodaPost - Create Stunning Carousels",
  description:
    "Transform your photos into stunning social media carousels",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyClasses = `${inter.variable} ${montserrat.variable} ${poppins.variable} ${playfairDisplay.variable} ${merriweather.variable} ${lora.variable} ${bodoniModa.variable} ${cinzel.variable} ${abrilFatface.variable} ${dmSerifDisplay.variable} ${prata.variable} ${syne.variable} ${bebasNeue.variable} font-sans antialiased`;

  // When Clerk is configured, ClerkProvider wraps the entire tree (required
  // by Clerk — must be the outermost provider above any useAuth/useUser calls).
  if (clerkPubKey) {
    return (
      <ClerkProvider publishableKey={clerkPubKey}>
        <html lang="en" suppressHydrationWarning>
          <body className={bodyClasses}>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </body>
        </html>
      </ClerkProvider>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClasses}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
