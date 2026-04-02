"use client";

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

export default function CoverageNeedRoute() {
  return (
    <div className="min-h-screen bg-slate-50">
      <CoverageNeedPage analytics={coverageAnalytics} />
    </div>
  );
}
