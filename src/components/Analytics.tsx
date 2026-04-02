'use client';

import Script from 'next/script';
import { useEffect } from 'react';

// GA4 Measurement ID (placeholder - Ryan to provide real one)
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX';

// Meta Pixel ID (placeholder - Ryan to provide real one)
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || 'XXXXXXXXXX';

// Google Ads Conversion ID (placeholder)
const GADS_CONVERSION_ID = process.env.NEXT_PUBLIC_GADS_ID || 'AW-XXXXXXXXXX';

/**
 * Analytics Provider Component
 * Loads GA4, Meta Pixel, Google Ads tags
 * Coarse-grained tracking only - no PII
 */
export function AnalyticsProvider() {
  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: true,
            cookie_flags: 'Secure;SameSite=None',
            cookie_expires: 63072000, // 2 years
            custom_map: {
              'custom_parameter_1': 'engagement_bucket',
              'custom_parameter_2': 'coverage_bucket',
              'custom_parameter_3': 'age_bucket'
            }
          });
        `}
      </Script>

      {/* Meta Pixel */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>

      {/* Google Ads Tag */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GADS_CONVERSION_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GADS_CONVERSION_ID}');
        `}
      </Script>
    </>
  );
}

// Coarse bucket definitions (privacy-compliant)
export const COARSE_BUCKETS = {
  coverage: [
    { min: 0, max: 250000, label: 'under-250k' },
    { min: 250000, max: 500000, label: '250k-500k' },
    { min: 500000, max: 1000000, label: '500k-1m' },
    { min: 1000000, max: 2000000, label: '1m-2m' },
    { min: 2000000, max: Infinity, label: '2m-plus' }
  ],
  age: [
    { min: 18, max: 34, label: '25-34' },
    { min: 35, max: 44, label: '35-44' },
    { min: 45, max: 54, label: '45-54' },
    { min: 55, max: 64, label: '55-64' },
    { min: 65, max: Infinity, label: '65-plus' }
  ]
} as const;

/**
 * Get coarse bucket for a value
 * @param value - numeric value
 * @param type - 'coverage' | 'age'
 * @returns bucket label string
 */
export function getCoarseBucket(value: number, type: 'coverage' | 'age'): string {
  const buckets = COARSE_BUCKETS[type];
  const bucket = buckets.find(b => value >= b.min && value < b.max);
  return bucket?.label || 'unknown';
}

/**
 * Track custom event in GA4
 * @param eventName - event name (snake_case)
 * @param params - event parameters
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
  
  // Also track in Meta Pixel for retargeting
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('trackCustom', eventName, params);
  }
}

/**
 * Predefined event tracking functions
 * Coarse-grained only - no PII, no raw values
 */
export const analytics = {
  // Calculator funnel events
  calculatorStart: () => {
    trackEvent('calculator_start', {
      event_category: 'engagement',
      event_label: 'coverage_calculator'
    });
  },
  
  calculatorStepComplete: (stepNumber: number) => {
    trackEvent('calculator_step_complete', {
      event_category: 'engagement',
      step: stepNumber
    });
  },
  
  estimateGenerated: (params: {
    coverageBucket: string;
    ageBucket: string;
    termYears: number;
  }) => {
    trackEvent('estimate_generated', {
      event_category: 'conversion',
      coverage_bucket: params.coverageBucket,
      age_bucket: params.ageBucket,
      term_years: params.termYears
    });
    
    // Fire Meta Pixel lead event for retargeting
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead', {
        content_name: 'coverage_estimate',
        value: 0.00,
        currency: 'USD'
      });
    }
  },
  
  quoteApplyClick: (source: string) => {
    trackEvent('quote_apply_click', {
      event_category: 'conversion',
      event_label: source
    });
    
    // Fire Meta Pixel conversion
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout');
    }
  },
  
  // Engagement events
  pageEngaged: (page: string, scrollDepth: number) => {
    trackEvent('page_engaged', {
      event_category: 'engagement',
      page_path: page,
      scroll_depth_bucket: scrollDepth >= 90 ? '90-100' : scrollDepth >= 50 ? '50-89' : '25-49'
    });
  },
  
  timeOnPage: (seconds: number) => {
    const bucket = seconds >= 120 ? '120-plus' : seconds >= 60 ? '60-119' : seconds >= 30 ? '30-59' : 'under-30';
    trackEvent('time_on_page', {
      event_category: 'engagement',
      seconds_bucket: bucket
    });
  }
};

/**
 * Hook for scroll depth tracking
 */
export function useScrollTracking(pagePath: string) {
  useEffect(() => {
    let maxScroll = 0;
    const thresholds = [25, 50, 75, 90];
    const fired = new Set<number>();
    
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      maxScroll = Math.max(maxScroll, scrollPercent);
      
      thresholds.forEach(threshold => {
        if (maxScroll >= threshold && !fired.has(threshold)) {
          fired.add(threshold);
          analytics.pageEngaged(pagePath, threshold);
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pagePath]);
}

/**
 * Hook for time on page tracking
 */
export function useTimeTracking() {
  useEffect(() => {
    const startTime = Date.now();
    const thresholds = [30, 60, 120];
    const fired = new Set<number>();
    
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      
      thresholds.forEach(threshold => {
        if (seconds >= threshold && !fired.has(threshold)) {
          fired.add(threshold);
          analytics.timeOnPage(threshold);
        }
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
}

export default AnalyticsProvider;
