"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import CoverageNeedPage from '@/components/CoverageNeedPage';
import { analytics } from '@/components/Analytics';

// Wire real analytics to CoverageNeedPage
const coverageAnalytics = {
  coverage_page_view: () => analytics.calculatorStart(),
  coverage_input_started: () => {}, // Already tracked in calculatorStart
  coverage_estimate_generated: (bucket: string) => analytics.estimateGenerated({
    coverageBucket: bucket,
    ageBucket: 'unknown', // Not collected in this calculator
    termYears: 20 // Default assumption
  }),
  coverage_reset_clicked: () => {}, // Track if needed
  coverage_primary_cta_clicked: () => analytics.quoteApplyClick('coverage_calculator'),
  coverage_secondary_cta_clicked: () => {}, // Underwriting transparency
};

function CoverageNeedRouteInner() {
  const searchParams = useSearchParams();
  const isFromAudit = searchParams.get('pre') === 'audit';

  // Derive initial values from audit params
  const initialValues = isFromAudit ? {
    annualIncome: searchParams.get('annualIncome') || '',
    incomeReplacementPercent: searchParams.get('incomeReplacementPercent') || '70',
    yearsToReplace: searchParams.get('yearsToReplace') || '10',
    debtsToCover: searchParams.get('debtsToCover') || '',
    educationFunding: searchParams.get('educationFunding') || '',
    existingCoverage: searchParams.get('existingCoverage') || '',
    liquidAssets: searchParams.get('liquidAssets') || '',
  } : undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      {isFromAudit && (
        <div style={{
          background: '#eff6ff',
          borderBottom: '1px solid #bfdbfe',
          padding: '0.75rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#1e3a5f',
        }}>
          Your continuity audit numbers have been loaded into the calculator below. You can adjust any value.
        </div>
      )}
      <CoverageNeedPage analytics={coverageAnalytics} initialValues={initialValues} />
    </div>
  );
}

export default function CoverageNeedRoute() {
  return (
    <Suspense>
      <CoverageNeedRouteInner />
    </Suspense>
  );
}