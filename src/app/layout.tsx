import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnalyticsProvider from "../components/Analytics";
import Footer from "../components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://rostineinsurance.com'),
  title: {
    default: 'How Much Life Insurance Do I Need? | Free Calculator | rostineinsurance.com',
    template: '%s | rostineinsurance.com',
  },
  description: 'Calculate your life insurance coverage need in 2 minutes. Transparent assumptions. No phone number required. California independent advisor.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'How Much Life Insurance Do I Need? | Free Calculator',
    description: 'Calculate your life insurance coverage need in 2 minutes. Transparent assumptions. No phone number required.',
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
      <head>
        {/* Google Ads Conversion Tag */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18062438278"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18062438278');
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
        <AnalyticsProvider />
      </body>
    </html>
  );
}
