import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnalyticsProvider from "../components/Analytics";

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
    default: 'Ryan Rostine | Life Insurance | rostineinsurance.com',
    template: '%s | rostineinsurance.com',
  },
  description: 'Independent life insurance for California. Calculate your coverage need and understand the process.',
  openGraph: {
    title: 'Ryan Rostine | Life Insurance',
    description: 'Independent life insurance for California. Calculate your coverage need and understand the process.',
    siteName: 'rostineinsurance.com',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ryan Rostine | Life Insurance',
    description: 'Independent life insurance for California.',
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <AnalyticsProvider />
      </body>
    </html>
  );
}
