import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageWrapper } from "@/components/layout/PageWrapper";
import ThemeInitializer from "@/components/ThemeInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Strava Hub — Your Training, Visualized",
    template: "%s · Strava Hub",
  },
  description:
    "Personal Strava dashboard to track, compare, and analyze every run, ride, and walk. Km splits, route maps, personal records, and session comparisons — all in one place.",
  keywords: [
    "Strava", "running", "cycling", "fitness dashboard",
    "activity tracker", "km splits", "personal records",
    "pace chart", "route map", "training analytics",
  ],
  authors: [{ name: "Ashwin" }],
  creator: "Ashwin",
  applicationName: "Strava Hub",
  metadataBase: new URL("https://strava-activity-hub.vercel.app"),
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://strava-activity-hub.vercel.app",
    siteName: "Strava Hub",
    title: "Strava Hub — Your Training, Visualized",
    description:
      "Personal dashboard for runs, rides, and walks. Km splits, route maps, personal records, and head-to-head session comparison.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Strava Hub",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Strava Hub — Your Training, Visualized",
    description:
      "Km splits, route maps, personal records, and session comparison for your Strava activities.",
    images: ["/logo.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://strava-activity-hub.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-text-primary overflow-hidden relative">
        <ThemeInitializer />
        {/* Layer 1: Atmosphere (Ambient Base Gradients & Directional Soft Light) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-15%] left-[-15%] w-[85vw] h-[85vw] sm:w-[65vw] sm:h-[65vw] md:w-[50vw] md:h-[50vw] rounded-full bg-gradient-to-br from-[#fc4c02]/15 to-[#f59e0b]/10 blur-[100px] sm:blur-[120px] md:blur-[140px] animate-float-1" />
          <div className="absolute bottom-[-20%] right-[-15%] w-[95vw] h-[95vw] sm:w-[70vw] sm:h-[70vw] md:w-[55vw] md:h-[55vw] rounded-full bg-gradient-to-tl from-[#f97316]/12 to-[#fb923c]/5 blur-[100px] sm:blur-[130px] md:blur-[150px] animate-float-2" />
          <div className="absolute top-[40%] right-[25%] w-[40vw] h-[40vw] rounded-full bg-[#fc4c02]/5 blur-[120px] pointer-events-none" />
        </div>

        <div className="flex h-screen relative z-10">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <PageWrapper>{children}</PageWrapper>
          </div>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
