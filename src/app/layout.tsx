import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import StoreProvider from "@/lib/store/StoreProvider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PR Sentinel | AI-powered pull request reviews",
    template: "%s | PR Sentinel",
  },
  description: "PR Sentinel helps engineering teams review pull requests faster with AI-powered risk analysis, actionable findings, and deployment-aware insights.",
  applicationName: "PR Sentinel",
  keywords: ["pull request review", "code review", "AI code review", "GitHub reviews", "developer productivity"],
  authors: [{ name: "PR Sentinel" }],
  creator: "PR Sentinel",
  publisher: "PR Sentinel",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "PR Sentinel",
    title: "PR Sentinel | AI-powered pull request reviews",
    description: "Review pull requests with clear, risk-aware engineering intelligence.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "PR Sentinel" }],
  },
  twitter: {
    card: "summary",
    title: "PR Sentinel | AI-powered pull request reviews",
    description: "AI-powered pull request reviews with actionable findings.",
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/pr-sentinel-mark.svg", type: "image/svg+xml" }],
    apple: "/pr-sentinel-mark.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
