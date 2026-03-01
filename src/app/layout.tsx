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
    images: [{ url: "/og-image.png", width: 1536, height: 1024 }],
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("habitflow-theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${instrumentSans.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <div
          id="splash"
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            transition: "opacity 0.4s ease-out",
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
                #splash{background:#f7f3ec}
                .dark #splash{background:#13100d}
                #splash img{width:72px;height:72px;border-radius:16px;animation:splash-pulse 1.8s ease-in-out infinite}
                #splash .splash-name{font-size:1.25rem;font-weight:600;letter-spacing:-0.01em;color:#1a1714}
                .dark #splash .splash-name{color:#e8e0d4}
                #splash .splash-tagline{font-size:0.8rem;color:#8a8078}
                .dark #splash .splash-tagline{color:#6b6560}
                @keyframes splash-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.85;transform:scale(1.04)}}
              `,
            }}
          />
          <img src="/icons/icon-192.png" alt="" width={72} height={72} />
          <div style={{ textAlign: "center" }}>
            <div className="splash-name">HabitFlow</div>
            <div className="splash-tagline">Consistency wins.</div>
          </div>
        </div>
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
