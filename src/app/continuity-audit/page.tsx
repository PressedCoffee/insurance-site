"use client";

import ContinuityAuditPage, { type AuditAnalytics } from '@/components/ContinuityAuditPage';
import { analytics } from '@/components/Analytics';

const auditAnalytics: AuditAnalytics = {
  auditStarted: () => analytics.auditStarted(),
  auditCompleted: (status: string) => analytics.auditCompleted(status),
  auditToCalculator: (status: string) => analytics.auditToCalculator(status),
};

export default function ContinuityAuditRoute() {
  return (
    <div className="min-h-screen bg-slate-50">
      <ContinuityAuditPage analytics={auditAnalytics} />
    </div>
  );
}