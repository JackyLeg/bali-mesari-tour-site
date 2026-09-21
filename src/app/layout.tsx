/**
 * 📚 HOW THIS WORKS — Root Layout (src/app/layout.tsx)
 *
 * This is the outermost wrapper for every page on the site.
 * Whatever you put here appears on ALL pages.
 *
 * CurrencyProvider is placed here so that ANY component anywhere
 * in the app can call useCurrency() and get the current currency state.
 * This is the "top-level context injection" pattern in React.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/lib/currency";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bali Mesari Tour — Authentic Bali Experiences",
  description: "Discover authentic Bali tours and experiences. Book volcano treks, Nusa Penida day trips, Ubud culture tours and more with Bali Mesari Tour.",
};

// LayoutProps is a Next.js 16+ type for the root layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          CurrencyProvider wraps the entire app.
          📚 This means the currency context is available everywhere —
          Header, activity cards, checkout page, admin panel — all
          can call useCurrency() to get/set the currency preference.
        */}
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </body>
    </html>
  );
}
