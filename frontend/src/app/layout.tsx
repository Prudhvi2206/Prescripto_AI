import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prescripto AI — AI Medical Assistant",
  description: "AI-powered healthcare application for prescription scanning, medicine tracking, and intelligent medical advice.",
  keywords: ["healthcare", "AI", "prescription", "medicine", "medical assistant"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Prescripto AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Navigation />
          <main className="flex-grow lg:desktop-content w-full">
            <div className="container mx-auto px-4 pt-8 pb-32 lg:pb-8 max-w-4xl">
              <div className="w-full max-w-2xl mx-auto lg:max-w-3xl">
                {children}
              </div>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
