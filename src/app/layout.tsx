import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnalyticsProvider from "../components/Analytics";
import Footer from "../components/Footer";
import OptOutProvider from "../components/OptOutProvider";

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

// Google Ads Conversion Tag — only rendered when the env var is set
const GADS_ID = (process.env.NEXT_PUBLIC_GADS_ID || '').trim();

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
        {GADS_ID && (
          <>
            {/* Consent default must be set BEFORE gtag config.
                Reads localStorage + GPC synchronously to determine state.
                This inline script runs before any async gtag scripts. */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  var optOut = (typeof localStorage !== 'undefined' && localStorage.getItem('privacy_opt_out') === 'true')
                    || (typeof navigator !== 'undefined' && 'globalPrivacyControl' in navigator && navigator.globalPrivacyControl === true);
                  gtag('consent', 'default', {
                    ad_storage: optOut ? 'denied' : 'granted',
                    analytics_storage: 'denied',
                  });
                  gtag('js', new Date());
                  gtag('config', '${GADS_ID}');
                `
              }}
            />
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`}></script>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <OptOutProvider>
          {children}
          <Footer />
          <AnalyticsProvider />
        </OptOutProvider>
      </body>
    </html>
  );
}