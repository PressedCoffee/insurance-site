'use client';

import { usePrivacyOptOut } from './OptOutProvider';

export default function OptOutButton() {
  const { optedOut, gpcActive, setOptOut } = usePrivacyOptOut();

  if (optedOut) {
    return (
      <p style={{
        margin: '0.75rem 0 0',
        padding: '0.75rem',
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: '#166534',
      }}>
        {gpcActive
          ? 'Your browser\'s Global Privacy Control signal is active. Ad tracking has been automatically suppressed on this site.'
          : 'You have opted out of ad tracking. Google Ads conversion tracking will not collect personal data from your visits.'}
      </p>
    );
  }

  return (
    <button
      onClick={setOptOut}
      style={{
        marginTop: '0.75rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#dc2626',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      Opt out of ad tracking
    </button>
  );
}