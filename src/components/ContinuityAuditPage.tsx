"use client";

/**
 * Family Continuity Audit
 * Pre-calculator experience: shows what breaks financially if income disappears.
 * Produces a lump-sum coverage gap that flows into the existing coverage calculator.
 * No contact capture, no server state, no auth.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import './ContinuityAuditPage.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditState {
  currentStep: 1 | 2 | 3;
  monthlyTakeHome: string;
  partnerMonthlyIncome: string;
  children: number;
  youngestChildAge: number;
  otherDependents: number;
  housing: string;
  debts: string;
  childcareEducation: string;
  coreLivingEssentials: string;
  otherEssentials: string;
  existingCoverage: string;
  emergencySavings: string;
}

interface AuditResult {
  status: 'protected' | 'stable' | 'exposed' | 'critical';
  monthlyObligations: {
    housing: number;
    debts: number;
    childcareEducation: number;
    coreLivingEssentials: number;
    otherEssentials: number;
    total: number;
  };
  monthlyOffsets: {
    partnerIncome: number;
    monthlyInsuranceEquivalent: number;
    total: number;
  };
  monthlyShortfall: number;
  lumpSumGap: number;
  monthlyDrawFromSavings: number;
  runwayMonths: number;
  adjustedRunwayMonths: number;
  planningHorizonYears: number;
  planningHorizonMonths: number;
  hasValues: boolean;
}

export interface AuditAnalytics {
  auditStarted: () => void;
  auditCompleted: (status: string) => void;
  auditToCalculator: (status: string) => void;
}

const defaultAnalytics: AuditAnalytics = {
  auditStarted: () => {},
  auditCompleted: () => {},
  auditToCalculator: () => {},
};

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_STATE: AuditState = {
  currentStep: 1,
  monthlyTakeHome: '',
  partnerMonthlyIncome: '',
  children: 0,
  youngestChildAge: 0,
  otherDependents: 0,
  housing: '',
  debts: '',
  childcareEducation: '',
  coreLivingEssentials: '',
  otherEssentials: '',
  existingCoverage: '',
  emergencySavings: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseInput(value: string): number {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function formatCurrency(value: number): string {
  if (isNaN(value) || value < 0) return '$0';
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function getStatusInfo(status: AuditResult['status']): {
  label: string;
  description: string;
  className: string;
} {
  switch (status) {
    case 'protected':
      return {
        label: 'Protected',
        description: "Your family's obligations are fully covered with a real cash buffer.",
        className: 'audit-status--protected',
      };
    case 'stable':
      return {
        label: 'Stable',
        description: 'Covered month-to-month, but thin on cash reserves.',
        className: 'audit-status--stable',
      };
    case 'exposed':
      return {
        label: 'Exposed',
        description: 'A gap exists, but insurance would buy meaningful time.',
        className: 'audit-status--exposed',
      };
    case 'critical':
      return {
        label: 'Critical',
        description: 'A real gap with a short runway — the most urgent situation.',
        className: 'audit-status--critical',
      };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ContinuityAuditPageProps {
  analytics?: AuditAnalytics;
}

export function ContinuityAuditPage({
  analytics = defaultAnalytics,
}: ContinuityAuditPageProps): React.ReactElement {
  const [state, setState] = useState<AuditState>(DEFAULT_STATE);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    analytics.auditStarted();
  }, [analytics]);

  // ─── Computed result ──────────────────────────────────────────────────────

  const result = useMemo<AuditResult>(() => {
    const monthlyTakeHome = parseInput(state.monthlyTakeHome);
    const partnerIncome = parseInput(state.partnerMonthlyIncome);
    const housing = parseInput(state.housing);
    const debts = parseInput(state.debts);
    const childcareEducation = parseInput(state.childcareEducation);
    const coreLivingEssentials = parseInput(state.coreLivingEssentials);
    const otherEssentials = parseInput(state.otherEssentials);
    const existingCoverage = parseInput(state.existingCoverage);
    const savings = parseInput(state.emergencySavings);

    // Planning horizon
    let planningHorizonMonths: number;
    if (state.children > 0) {
      planningHorizonMonths = Math.min((state.youngestChildAge + 20) * 12, 360);
    } else {
      planningHorizonMonths = 120;
    }
    const planningHorizonYears = planningHorizonMonths / 12;

    // Monthly obligations
    const monthlyObligationsTotal = housing + debts + childcareEducation + coreLivingEssentials + otherEssentials;

    // Monthly offsets
    const monthlyInsuranceEquivalent = existingCoverage / planningHorizonMonths;
    const monthlyOffsetsTotal = partnerIncome + monthlyInsuranceEquivalent;

    // Shortfall
    const monthlyShortfall = Math.max(0, monthlyObligationsTotal - monthlyOffsetsTotal);

    // Savings runway
    const monthlyDrawFromSavings = Math.max(0, monthlyObligationsTotal - partnerIncome);
    const runwayMonths = monthlyDrawFromSavings > 0 ? savings / monthlyDrawFromSavings : Infinity;
    const adjustedRunwayMonths = monthlyDrawFromSavings > 0
      ? (savings + existingCoverage) / monthlyDrawFromSavings
      : Infinity;

    // Lump sum gap
    const lumpSumGap = monthlyShortfall * planningHorizonMonths;

    // Status
    let status: AuditResult['status'];
    if (monthlyShortfall <= 0 && runwayMonths >= 3) {
      status = 'protected';
    } else if (monthlyShortfall <= 0 && runwayMonths < 3) {
      status = 'stable';
    } else if (monthlyShortfall > 0 && adjustedRunwayMonths >= 6) {
      status = 'exposed';
    } else {
      status = 'critical';
    }

    const hasValues = monthlyTakeHome > 0 || housing > 0 || debts > 0;

    return {
      status,
      monthlyObligations: {
        housing,
        debts,
        childcareEducation,
        coreLivingEssentials,
        otherEssentials,
        total: monthlyObligationsTotal,
      },
      monthlyOffsets: {
        partnerIncome,
        monthlyInsuranceEquivalent,
        total: monthlyOffsetsTotal,
      },
      monthlyShortfall,
      lumpSumGap,
      monthlyDrawFromSavings,
      runwayMonths,
      adjustedRunwayMonths,
      planningHorizonYears,
      planningHorizonMonths,
      hasValues,
    };
  }, [state]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (field: keyof AuditState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!hasInteracted) setHasInteracted(true);
      setState((prev) => ({ ...prev, [field]: e.target.value }));
    },
    [hasInteracted]
  );

  const handleNumberChange = useCallback(
    (field: keyof AuditState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!hasInteracted) setHasInteracted(true);
      const val = parseInt(e.target.value, 10);
      setState((prev) => ({
        ...prev,
        [field]: isNaN(val) ? 0 : Math.max(0, val),
      }));
    },
    [hasInteracted]
  );

  const goToStep = useCallback((step: 1 | 2 | 3) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const handleReset = useCallback(() => {
    setState(DEFAULT_STATE);
    setHasInteracted(false);
    setShowResults(false);
  }, []);

  const handleSeeResults = useCallback(() => {
    setShowResults(true);
    analytics.auditCompleted(result.status);
  }, [analytics, result.status]);

  const handleGoToCalculator = useCallback(() => {
    const monthlyTakeHome = parseInput(state.monthlyTakeHome);
    const housing = parseInput(state.housing);
    const debts = parseInput(state.debts);
    const childcareEducation = parseInput(state.childcareEducation);
    const existingCoverage = parseInput(state.existingCoverage);
    const savings = parseInput(state.emergencySavings);

    const monthlyNeed = housing + debts + childcareEducation + parseInput(state.coreLivingEssentials) + parseInput(state.otherEssentials);

    const params = new URLSearchParams({
      pre: 'audit',
      annualIncome: String(Math.round((monthlyTakeHome * 12) / 0.7)),
      debtsToCover: String(Math.round(monthlyNeed * 12)),
      educationFunding: String(Math.round(childcareEducation * 12)),
      existingCoverage: String(Math.round(existingCoverage)),
      liquidAssets: String(Math.round(savings)),
      yearsToReplace: String(Math.round(result.planningHorizonYears)),
      incomeReplacementPercent: '70',
    });

    analytics.auditToCalculator(result.status);
    window.location.href = `/coverage-need?${params.toString()}`;
  }, [state, result, analytics]);

  // ─── Render helpers ────────────────────────────────────────────────────────

  const statusInfo = getStatusInfo(result.status);
  const canProceedStep1 = parseInput(state.monthlyTakeHome) > 0;
  const canProceedStep2 = parseInput(state.housing) > 0 || parseInput(state.debts) > 0 || parseInput(state.coreLivingEssentials) > 0;

  // ─── JSX ────────────────────────────────────────────────────────────────────

  return (
    <main className="audit-page" role="main" aria-label="Family Continuity Audit">
      {/* Hero */}
      <section className="audit-hero">
        <h1 className="audit-hero__title">What happens to your family if your income stops?</h1>
        <p className="audit-hero__subtitle">
          A quick audit of your financial continuity — no account required.
        </p>
      </section>

      {/* Stepper */}
      <div className="audit-stepper" role="navigation" aria-label="Audit steps">
        {([1, 2, 3] as const).map((step) => (
          <button
            key={step}
            type="button"
            className={`audit-stepper__step ${state.currentStep === step ? 'audit-stepper__step--active' : ''} ${
              state.currentStep > step ? 'audit-stepper__step--completed' : ''
            }`}
            onClick={() => state.currentStep > step && goToStep(step)}
            disabled={state.currentStep < step}
            aria-current={state.currentStep === step ? 'step' : undefined}
          >
            <span className="audit-stepper__number">{step}</span>
            <span className="audit-stepper__label">
              {step === 1 ? 'Household' : step === 2 ? 'Obligations' : 'Offsets'}
            </span>
          </button>
        ))}
      </div>

      {/* Step 1: Household */}
      {state.currentStep === 1 && (
        <fieldset className="audit-group">
          <legend>Your Household</legend>

          <div className="audit-field">
            <label htmlFor="monthly-take-home">Monthly take-home income</label>
            <div className="audit-field__input-wrapper">
              <span className="audit-field__prefix">$</span>
              <input
                id="monthly-take-home"
                type="text"
                inputMode="numeric"
                value={state.monthlyTakeHome}
                onChange={handleInputChange('monthlyTakeHome')}
                placeholder="e.g., 5,000"
                aria-describedby="monthly-take-home-help"
                autoFocus
              />
            </div>
            <span id="monthly-take-home-help" className="audit-field__help">
              Your income after taxes — the money that keeps things running
            </span>
          </div>

          <div className="audit-field">
            <label htmlFor="partner-income">Partner's monthly income <span className="audit-field__optional">(optional)</span></label>
            <div className="audit-field__input-wrapper">
              <span className="audit-field__prefix">$</span>
              <input
                id="partner-income"
                type="text"
                inputMode="numeric"
                value={state.partnerMonthlyIncome}
                onChange={handleInputChange('partnerMonthlyIncome')}
                placeholder="e.g., 4,000"
              />
            </div>
            <span className="audit-field__help">
              If your partner would continue earning, this offsets the gap
            </span>
          </div>

          <div className="audit-field-row">
            <div className="audit-field audit-field--narrow">
              <label htmlFor="children">Children</label>
              <input
                id="children"
                type="number"
                min="0"
                max="6"
                value={state.children}
                onChange={handleNumberChange('children')}
              />
            </div>
            {state.children > 0 && (
              <div className="audit-field audit-field--narrow">
                <label htmlFor="youngest-age">Youngest child's age</label>
                <input
                  id="youngest-age"
                  type="number"
                  min="0"
                  max="25"
                  value={state.youngestChildAge}
                  onChange={handleNumberChange('youngestChildAge')}
                />
              </div>
            )}
            <div className="audit-field audit-field--narrow">
              <label htmlFor="other-dependents">Other dependents</label>
              <input
                id="other-dependents"
                type="number"
                min="0"
                max="4"
                value={state.otherDependents}
                onChange={handleNumberChange('otherDependents')}
              />
            </div>
          </div>

          <button
            type="button"
            className="audit-button audit-button--primary"
            disabled={!canProceedStep1}
            onClick={() => goToStep(2)}
          >
            Next: Monthly obligations →
          </button>
        </fieldset>
      )}

      {/* Step 2: Obligations */}
      {state.currentStep === 2 && (
        <fieldset className="audit-group">
          <legend>Monthly Obligations</legend>
          <p className="audit-group__intro">
            What does your household actually spend each month to keep things running?
          </p>

          <div className="audit-field">
            <label htmlFor="housing">Housing (mortgage/rent)</label>
            <div className="audit-field__input-wrapper">
              <span className="audit-field__prefix">$</span>
              <input
                id="housing"
                type="text"
                inputMode="numeric"
                value={state.housing}
                onChange={handleInputChange('housing')}
                placeholder="e.g., 2,000"
              />
            </div>
            <span className="audit-field__help">
              Mortgage or rent payment, property tax, insurance
            </span>
          </div>

          <div className="audit-field">
            <label htmlFor="debts">Debt payments</label>
            <div className="audit-field__input-wrapper">
              <span className="audit-field__prefix">$</span>
              <input
                id="debts"
                type="text"
                inputMode="numeric"
                value={state.debts}
                onChange={handleInputChange('debts')}
                placeholder="e.g., 500"
              />
            </div>
            <span className="audit-field__help">
              Car loans, student loans, credit card minimums
            </span>
          </div>

          <div className="audit-field">
            <label htmlFor="childcare-education">Childcare &amp; education</label>
            <div className="audit-field__input-wrapper">
              <span className="audit-field__prefix">$</span>
              <input
                id="childcare-education"
                type="text"
                inputMode="numeric"
                value={state.childcareEducation}
                onChange={handleInputChange('childcareEducation')}
                placeholder="e.g., 1,200"
              />
            </div>
            <span className="audit-field__help">
              Daycare, tuition, after-school programs
            </span>
          </div>

          <div className="audit-field">
            <label htmlFor="core-essentials">Core living essentials</label>
            <div className="audit-field__input-wrapper">
              <span className="audit-field__prefix">$</span>
              <input
                id="core-essentials"
                type="text"
                inputMode="numeric"
                value={state.coreLivingEssentials}
                onChange={handleInputChange('coreLivingEssentials')}
                placeholder="e.g., 1,500"
              />
            </div>
            <span className="audit-field__help">
              Groceries, utilities, transportation, health insurance
            </span>
          </div>

          <div className="audit-field">
            <label htmlFor="other-essentials">Other essentials <span className="audit-field__optional">(optional)</span></label>
            <div className="audit-field__input-wrapper">
              <span className="audit-field__prefix">$</span>
              <input
                id="other-essentials"
                type="text"
                inputMode="numeric"
                value={state.otherEssentials}
                onChange={handleInputChange('otherEssentials')}
                placeholder="e.g., 300"
              />
            </div>
            <span className="audit-field__help">
              Anything else your household must cover monthly
            </span>
          </div>

          <div className="audit-group__total">
            <span className="audit-group__total-label">Monthly obligations:</span>
            <span className="audit-group__total-value">
              {formatCurrency(result.monthlyObligations.total)}<span className="audit-group__total-unit">/mo</span>
            </span>
          </div>

          <div className="audit-step-buttons">
            <button type="button" className="audit-button audit-button--secondary" onClick={() => goToStep(1)}>
              ← Back
            </button>
            <button
              type="button"
              className="audit-button audit-button--primary"
              disabled={!canProceedStep2}
              onClick={() => goToStep(3)}
            >
              Next: Offsets →
            </button>
          </div>
        </fieldset>
      )}

      {/* Step 3: Offsets */}
      {state.currentStep === 3 && (
        <fieldset className="audit-group">
          <legend>Offsets</legend>
          <p className="audit-group__intro">
            What already exists to cover things if your income stopped?
          </p>

          <div className="audit-field">
            <label htmlFor="existing-coverage">Existing life insurance coverage</label>
            <div className="audit-field__input-wrapper">
              <span className="audit-field__prefix">$</span>
              <input
                id="existing-coverage"
                type="text"
                inputMode="numeric"
                value={state.existingCoverage}
                onChange={handleInputChange('existingCoverage')}
                placeholder="e.g., 250,000"
              />
            </div>
            <span className="audit-field__help">
              Total death benefit from all policies, including employer coverage
            </span>
          </div>

          <div className="audit-field">
            <label htmlFor="emergency-savings">Emergency savings</label>
            <div className="audit-field__input-wrapper">
              <span className="audit-field__prefix">$</span>
              <input
                id="emergency-savings"
                type="text"
                inputMode="numeric"
                value={state.emergencySavings}
                onChange={handleInputChange('emergencySavings')}
                placeholder="e.g., 20,000"
              />
            </div>
            <span className="audit-field__help">
              Liquid savings you could access immediately
            </span>
          </div>

          <div className="audit-group__total">
            <span className="audit-group__total-label">Monthly offsets:</span>
            <span className="audit-group__total-value">
              {formatCurrency(result.monthlyOffsets.total)}<span className="audit-group__total-unit">/mo</span>
            </span>
          </div>

          <div className="audit-step-buttons">
            <button type="button" className="audit-button audit-button--secondary" onClick={() => goToStep(2)}>
              ← Back
            </button>
            <button
              type="button"
              className="audit-button audit-button--primary"
              onClick={handleSeeResults}
            >
              See your audit results →
            </button>
          </div>
        </fieldset>
      )}

      {/* Results */}
      {showResults && (
        <section className="audit-results" aria-label="Audit results">
          <div className={`audit-status ${statusInfo.className}`}>
            <h2 className="audit-status__label">{statusInfo.label}</h2>
            <p className="audit-status__description">{statusInfo.description}</p>
          </div>

          <div className="audit-results__headline">
            <div className="audit-results__headline-amount" aria-live="polite">
              {formatCurrency(result.lumpSumGap)}
            </div>
            <div className="audit-results__headline-label">
              Coverage gap over {result.planningHorizonYears} year{result.planningHorizonYears !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="audit-results__details">
            <div className="audit-results__row">
              <span>Monthly obligations</span>
              <span>{formatCurrency(result.monthlyObligations.total)}/mo</span>
            </div>
            <div className="audit-results__row">
              <span>Monthly offsets</span>
              <span>{formatCurrency(result.monthlyOffsets.total)}/mo</span>
            </div>
            <div className="audit-results__row audit-results__row--highlight">
              <span>Monthly shortfall</span>
              <span>{formatCurrency(result.monthlyShortfall)}/mo</span>
            </div>
            {result.monthlyShortfall <= 0 && (
              <div className="audit-results__row audit-results__row--good">
                <span>Surplus</span>
                <span>{formatCurrency(Math.abs(result.monthlyObligations.total - result.monthlyOffsets.total))}/mo</span>
              </div>
            )}
            <div className="audit-results__row">
              <span>Cash runway (savings only)</span>
              <span>
                {result.runwayMonths === Infinity ? '∞' : `${result.runwayMonths.toFixed(1)} months`}
              </span>
            </div>
            <div className="audit-results__row">
              <span>Adjusted runway (with insurance)</span>
              <span>
                {result.adjustedRunwayMonths === Infinity ? '∞' : `${result.adjustedRunwayMonths.toFixed(1)} months`}
              </span>
            </div>
            <div className="audit-results__row">
              <span>Planning horizon</span>
              <span>
                {result.planningHorizonYears} year{result.planningHorizonYears !== 1 ? 's' : ''} ({result.planningHorizonMonths} months)
              </span>
            </div>
          </div>

          <div className="audit-results__explanation">
            <h3>How this works</h3>
            <p>
              The <strong>coverage gap</strong> is what your family would still need each month,
              multiplied across your planning horizon. This is the lump sum that life insurance
              would need to replace.
            </p>
            <p>
              <strong>Monthly shortfall</strong> shows the gap between obligations and offsets on a
              monthly basis. A positive number means your family falls short even before savings run out.
            </p>
            <p>
              <strong>Cash runway</strong> shows how long savings last without any insurance payout.
              <strong> Adjusted runway</strong> includes your existing coverage.
            </p>
          </div>

          <div className="audit-results__actions">
            <button
              type="button"
              className="audit-button audit-button--primary audit-button--large"
              onClick={handleGoToCalculator}
            >
              See coverage calculator with these numbers →
            </button>
            <button
              type="button"
              className="audit-button audit-button--secondary"
              onClick={handleReset}
            >
              Start over
            </button>
          </div>
        </section>
      )}

      {/* Framing — always visible */}
      <section className="audit-framing" aria-labelledby="audit-framing-title">
        <h2 id="audit-framing-title">Why this audit?</h2>
        <p>
          Most people guess their life insurance need based on a rule of thumb. This audit
          starts from what actually matters: your real monthly obligations and what's
          already in place to cover them.
        </p>
        <p>
          It doesn't replace a full financial review, but it gives you a concrete number
          based on your actual situation — not a multiplier of your salary.
        </p>
      </section>
    </main>
  );
}

export default ContinuityAuditPage;