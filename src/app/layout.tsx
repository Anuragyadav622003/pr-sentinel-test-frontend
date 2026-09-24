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
  description: "PR Sentinel is a private workspace for AI-powered GitHub pull request reviews and actionable code-quality findings.",
  applicationName: "PR Sentinel",
  authors: [{ name: "PR Sentinel" }],
  creator: "PR Sentinel",
  publisher: "PR Sentinel",
  alternates: { canonical: "/" },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
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
