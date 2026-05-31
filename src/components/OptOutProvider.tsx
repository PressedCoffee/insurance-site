'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'privacy_opt_out';

type PrivacyState = {
  optedOut: boolean;
  gpcActive: boolean;
  setOptOut: () => void;
};

const PrivacyContext = createContext<PrivacyState>({
  optedOut: false,
  gpcActive: false,
  setOptOut: () => {},
});

export function usePrivacyOptOut() {
  return useContext(PrivacyContext);
}

function gtag(...args: unknown[]) {
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(args);
}

/**
 * OptOutProvider — reads localStorage + GPC on mount,
 * sets Google consent mode accordingly, provides hook
 * for UI components to read/set opt-out state.
 *
 * Must be rendered BEFORE the gtag config call in layout.tsx
 * so that the consent default is set first.
 */
export default function OptOutProvider({ children }: { children: ReactNode }) {
  const [optedOut, setOptedOutState] = useState(false);
  const [gpcActive, setGpcActive] = useState(false);

  useEffect(() => {
    // Check GPC signal
    const gpcSignal = typeof navigator !== 'undefined' &&
      'globalPrivacyControl' in navigator &&
      (navigator as any).globalPrivacyControl === true;

    // Check localStorage
    const storedOptOut = typeof localStorage !== 'undefined' &&
      localStorage.getItem(STORAGE_KEY) === 'true';

    const shouldOptOut = gpcSignal || storedOptOut;

    setGpcActive(gpcSignal);
    setOptedOutState(shouldOptOut);

    // Set Google consent mode BEFORE config
    if (shouldOptOut) {
      gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
      });
    } else {
      gtag('consent', 'default', {
        ad_storage: 'granted',
        analytics_storage: 'denied',
      });
    }
  }, []);

  const setOptOut = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOptedOutState(true);
    // Update consent retroactively
    gtag('consent', 'update', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
    });
  };

  return (
    <PrivacyContext.Provider value={{ optedOut, gpcActive, setOptOut }}>
      {children}
    </PrivacyContext.Provider>
  );
}