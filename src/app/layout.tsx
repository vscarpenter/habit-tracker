import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { ToastProvider } from "@/components/shared/toast";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://habittracker.vinny.dev"),
  title: "HabitFlow",
  description:
    "Track your daily habits with a beautiful, private habit tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HabitFlow",
  },
  openGraph: {
    title: "HabitFlow — Private Habit Tracking",
    description:
      "Build better habits with streaks, stats, and a beautiful offline-first tracker. Your data stays on your device.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HabitFlow — Private Habit Tracking",
    description:
      "Build better habits with streaks, stats, and a beautiful offline-first tracker.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#13100d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${instrumentSans.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-xl focus:bg-accent-blue focus:px-4 focus:py-2 focus:text-white focus:shadow-xl"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <ToastProvider>
            <AppShell>
              <ErrorBoundary>{children}</ErrorBoundary>
            </AppShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
