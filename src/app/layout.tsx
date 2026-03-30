import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HyperAgent | AI Trading Agent for Hyperliquid",
  description:
    "AI-Powered Trading Agent for Hyperliquid. Real-time analysis, intelligent strategies, and autonomous trading on Hyperliquid.",
  keywords: [
    "trading",
    "ai",
    "hyperliquid",
    "cryptocurrency",
    "dex",
    "automated trading",
  ],
  authors: [{ name: "HyperAgent" }],
  openGraph: {
    title: "HyperAgent | AI Trading Agent for Hyperliquid",
    description: "AI-Powered Trading Agent for Hyperliquid",
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-[#0a0a0f] text-gray-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
