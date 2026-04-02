"use client";

/**
 * Coverage Need Calculator Page
 * Independent Insurance Advisor - Ryan Rostine
 * CA Producer License #4479678
 * 
 * Self-serve calculator that helps prospects estimate life insurance coverage need
 * and navigate to Quote & Apply without friction or gating.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import './CoverageNeedPage.css';

// Analytics event types
interface AnalyticsEvents {
  coverage_page_view: () => void;
  coverage_input_started: () => void;
  coverage_estimate_generated: (bucket: string) => void;
  coverage_reset_clicked: () => void;
  coverage_primary_cta_clicked: (amount: string) => void;
  coverage_secondary_cta_clicked: () => void;
}

// Default analytics implementation (no-op, override in production)
const defaultAnalytics: AnalyticsEvents = {
  coverage_page_view: () => {},
  coverage_input_started: () => {},
  coverage_estimate_generated: () => {},
  coverage_reset_clicked: () => {},
  coverage_primary_cta_clicked: () => {},
  coverage_secondary_cta_clicked: () => {},
};

interface CalculatorState {
  annualIncome: string;
  incomeReplacementPercent: string;
  yearsToReplace: string;
  debtsToCover: string;
  educationFunding: string;
  finalExpenses: string;
  existingCoverage: string;
  liquidAssets: string;
}

interface CalculatorConfig {
  defaultIncomeReplacementPercent: number;
  defaultYearsToReplace: number;
  defaultFinalExpenses: number;
  quoteApplyUrl: string;
  underwritingTransparencyPath: string;
}

const CONFIG: CalculatorConfig = {
  defaultIncomeReplacementPercent: 70,
  defaultYearsToReplace: 10,
  defaultFinalExpenses: 15000,
  quoteApplyUrl: 'https://app.back9ins.com/apply/RyanRostine',
  underwritingTransparencyPath: '/underwriting-transparency',
};

const DEFAULT_STATE: CalculatorState = {
  annualIncome: '',
  incomeReplacementPercent: String(CONFIG.defaultIncomeReplacementPercent),
  yearsToReplace: String(CONFIG.defaultYearsToReplace),
  debtsToCover: '',
  educationFunding: '',
  finalExpenses: String(CONFIG.defaultFinalExpenses),
  existingCoverage: '',
  liquidAssets: '',
};

function formatCurrency(value: number): string {
  if (isNaN(value) || value < 0) return '$0';
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function parseInput(value: string): number {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function getCoverageBucket(amount: number): string {
  if (amount < 100000) return '<100k';
  if (amount < 250000) return '100k-250k';
  if (amount < 500000) return '250k-500k';
  if (amount < 1000000) return '500k-1m';
  if (amount < 2000000) return '1m-2m';
  return '2m+';
}

interface CoverageNeedPageProps {
  analytics?: AnalyticsEvents;
}

export function CoverageNeedPage({ analytics = defaultAnalytics }: CoverageNeedPageProps): React.ReactElement {
  const [state, setState] = useState<CalculatorState>(DEFAULT_STATE);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    analytics.coverage_page_view();
  }, [analytics]);

  const calculations = useMemo(() => {
    const annualIncome = parseInput(state.annualIncome);
    const incomeReplacementPercent = parseInput(state.incomeReplacementPercent);
    const yearsToReplace = parseInput(state.yearsToReplace);
    const debtsToCover = parseInput(state.debtsToCover);
    const educationFunding = parseInput(state.educationFunding);
    const finalExpenses = parseInput(state.finalExpenses);
    const existingCoverage = parseInput(state.existingCoverage);
    const liquidAssets = parseInput(state.liquidAssets);

    const incomeReplacementAmount = annualIncome * (incomeReplacementPercent / 100) * yearsToReplace;
    const additionalObligationsAmount = debtsToCover + educationFunding + finalExpenses;
    const coverageToSubtract = existingCoverage + liquidAssets;
    const estimatedCoverageNeed = Math.max(0, incomeReplacementAmount + additionalObligationsAmount - coverageToSubtract);

    return {
      incomeReplacementAmount,
      additionalObligationsAmount,
      coverageToSubtract,
      estimatedCoverageNeed,
      hasValues: annualIncome > 0 || debtsToCover > 0 || educationFunding > 0 || existingCoverage > 0,
    };
  }, [state]);

  const handleInputChange = useCallback((field: keyof CalculatorState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!hasInteracted) {
      setHasInteracted(true);
      analytics.coverage_input_started();
    }
    setState(prev => ({ ...prev, [field]: e.target.value }));
  }, [hasInteracted, analytics]);

  const handleReset = useCallback(() => {
    analytics.coverage_reset_clicked();
    setState(DEFAULT_STATE);
    setHasInteracted(false);
  }, [analytics]);

  // Track when estimate becomes meaningful
  useEffect(() => {
    if (calculations.hasValues && calculations.estimatedCoverageNeed > 0) {
      const bucket = getCoverageBucket(calculations.estimatedCoverageNeed);
      analytics.coverage_estimate_generated(bucket);
    }
  }, [calculations.estimatedCoverageNeed, calculations.hasValues, analytics]);

  const handlePrimaryCta = useCallback(() => {
    const amountStr = String(calculations.estimatedCoverageNeed);
    analytics.coverage_primary_cta_clicked(amountStr);
    
    // Attempt to prefill if supported
    const url = new URL(CONFIG.quoteApplyUrl);
    url.searchParams.set('coverage_amount', amountStr);
    window.location.href = url.toString();
  }, [analytics]);

  const handleSecondaryCta = useCallback(() => {
    analytics.coverage_secondary_cta_clicked();
    window.location.href = '/underwriting-transparency';
  }, [analytics]);

  return (
    <main className="coverage-need-page" role="main" aria-label="Life Insurance Coverage Calculator">
      {/* Hero Section */}
      <section className="coverage-hero">
        <h1 className="coverage-hero__title">
          How Much Life Insurance Do You Actually Need?
        </h1>
        <p className="coverage-hero__subtitle">
          A tool that shows its assumptions
        </p>
      </section>

      {/* Framing */}
      <section className="coverage-frame">
        <p>
          Most calculators give you a number. This one gives you the logic. 
          Because an estimate only works if you know what's underneath it.
        </p>
        <p>
          The common rule of thumb—10 times your annual income—makes sense for some people, 
          not others. It depends on what you're actually trying to cover, what you already have, 
          and how long you need protection.
        </p>
        <p>
          This tool lets you see and adjust those variables. The result is a starting point, 
          not a final answer.
        </p>
      </section>

      {/* Calculator */}
      <div className="coverage-calculator">
        <div className="coverage-calculator__inputs">
          {/* Group 1: Income and Replacement */}
          <fieldset className="coverage-calculator__group">
            <legend>Income and Replacement</legend>
            
            <div className="coverage-calculator__field">
              <label htmlFor="annual-income">Annual income</label>
              <div className="coverage-calculator__input-wrapper">
                <span className="coverage-calculator__prefix">$</span>
                <input
                  id="annual-income"
                  type="text"
                  inputMode="numeric"
                  value={state.annualIncome}
                  onChange={handleInputChange('annualIncome')}
                  placeholder="e.g., 75000"
                  aria-describedby="annual-income-help"
                />
              </div>
              <span id="annual-income-help" className="coverage-calculator__help">
                Your gross annual income before taxes
              </span>
            </div>

            <div className="coverage-calculator__field">
              <label htmlFor="income-replacement-percent">Percent of income to replace</label>
              <div className="coverage-calculator__input-wrapper">
                <input
                  id="income-replacement-percent"
                  type="text"
                  inputMode="numeric"
                  value={state.incomeReplacementPercent}
                  onChange={handleInputChange('incomeReplacementPercent')}
                  placeholder="70"
                  aria-describedby="income-replacement-help"
                />
                <span className="coverage-calculator__suffix">%</span>
              </div>
              <span id="income-replacement-help" className="coverage-calculator__help">
                Suggested: 70% (taxes drop, some expenses change)
              </span>
            </div>

            <div className="coverage-calculator__field">
              <label htmlFor="years-to-replace">Years to replace it</label>
              <div className="coverage-calculator__input-wrapper">
                <input
                  id="years-to-replace"
                  type="text"
                  inputMode="numeric"
                  value={state.yearsToReplace}
                  onChange={handleInputChange('yearsToReplace')}
                  placeholder="10"
                />
                <span className="coverage-calculator__suffix">years</span>
              </div>
            </div>

            <div className="coverage-calculator__computed">
              <span className="coverage-calculator__computed-label">Income replacement:</span>
              <span className="coverage-calculator__computed-value">
                {formatCurrency(calculations.incomeReplacementAmount)}
              </span>
            </div>
          </fieldset>

          {/* Group 2: Additional Obligations */}
          <fieldset className="coverage-calculator__group">
            <legend>Additional Obligations</legend>
            
            <div className="coverage-calculator__field">
              <label htmlFor="debts-to-cover">Debts to cover</label>
              <div className="coverage-calculator__input-wrapper">
                <span className="coverage-calculator__prefix">$</span>
                <input
                  id="debts-to-cover"
                  type="text"
                  inputMode="numeric"
                  value={state.debtsToCover}
                  onChange={handleInputChange('debtsToCover')}
                  placeholder="e.g., 200000"
                />
              </div>
              <span className="coverage-calculator__help">
                Mortgage, auto loans, credit cards, student loans
              </span>
            </div>

            <div className="coverage-calculator__field">
              <label htmlFor="education-funding">Education funding (total)</label>
              <div className="coverage-calculator__input-wrapper">
                <span className="coverage-calculator__prefix">$</span>
                <input
                  id="education-funding"
                  type="text"
                  inputMode="numeric"
                  value={state.educationFunding}
                  onChange={handleInputChange('educationFunding')}
                  placeholder="e.g., 100000"
                />
              </div>
              <span className="coverage-calculator__help">
                Per child if applicable; use total amount
              </span>
            </div>

            <div className="coverage-calculator__field">
              <label htmlFor="final-expenses">Final expenses</label>
              <div className="coverage-calculator__input-wrapper">
                <span className="coverage-calculator__prefix">$</span>
                <input
                  id="final-expenses"
                  type="text"
                  inputMode="numeric"
                  value={state.finalExpenses}
                  onChange={handleInputChange('finalExpenses')}
                  placeholder="15000"
                />
              </div>
              <span className="coverage-calculator__help">
                Funeral, administrative costs (suggested: $15,000)
              </span>
            </div>

            <div className="coverage-calculator__computed">
              <span className="coverage-calculator__computed-label">Additional obligations:</span>
              <span className="coverage-calculator__computed-value">
                {formatCurrency(calculations.additionalObligationsAmount)}
              </span>
            </div>
          </fieldset>

          {/* Group 3: Offsets */}
          <fieldset className="coverage-calculator__group">
            <legend>Offsets</legend>
            
            <div className="coverage-calculator__field">
              <label htmlFor="existing-coverage">Existing life insurance coverage</label>
              <div className="coverage-calculator__input-wrapper">
                <span className="coverage-calculator__prefix">$</span>
                <input
                  id="existing-coverage"
                  type="text"
                  inputMode="numeric"
                  value={state.existingCoverage}
                  onChange={handleInputChange('existingCoverage')}
                  placeholder="e.g., 100000"
                />
              </div>
              <span className="coverage-calculator__help">
                Include employer coverage if you have it
              </span>
            </div>

            <div className="coverage-calculator__field">
              <label htmlFor="liquid-assets">Liquid assets you could use <span className="coverage-calculator__optional">(optional)</span></label>
              <div className="coverage-calculator__input-wrapper">
                <span className="coverage-calculator__prefix">$</span>
                <input
                  id="liquid-assets"
                  type="text"
                  inputMode="numeric"
                  value={state.liquidAssets}
                  onChange={handleInputChange('liquidAssets')}
                  placeholder="e.g., 50000"
                />
              </div>
              <span className="coverage-calculator__help">
                Savings, investments you could access if needed
              </span>
            </div>

            <div className="coverage-calculator__computed">
              <span className="coverage-calculator__computed-label">Coverage to subtract:</span>
              <span className="coverage-calculator__computed-value">
                {formatCurrency(calculations.coverageToSubtract)}
              </span>
            </div>
          </fieldset>

          {/* Reset */}
          <button
            type="button"
            className="coverage-calculator__reset"
            onClick={handleReset}
            aria-label="Reset all calculator inputs to defaults"
          >
            Reset inputs
          </button>
        </div>

        {/* Results Card */}
        <div className="coverage-results" role="region" aria-label="Calculated coverage need">
          <div className="coverage-results__card">
            <h2 className="coverage-results__title">
              Your estimated coverage need
            </h2>
            <div className="coverage-results__amount" aria-live="polite">
              {formatCurrency(calculations.estimatedCoverageNeed)}
            </div>
          </div>
        </div>
      </div>

      {/* What This Number Means */}
      <section className="coverage-explanation" aria-labelledby="what-this-number-means">
        <h2 id="what-this-number-means">What this number means</h2>
        <p>
          This is a rough estimate based on the inputs you provided. It assumes you want to 
          replace a portion of your income for a set number of years, cover specific debts 
          and obligations, and account for coverage you already have.
        </p>
        <p>
          <strong>What it doesn't include:</strong> Future income changes, inflation, non-wage 
          income, employer benefits details, complex financial situations that would need 
          individual review.
        </p>
      </section>

      {/* How To Use This Estimate */}
      <section className="coverage-usage" aria-labelledby="how-to-use">
        <h2 id="how-to-use">How to use this estimate</h2>
        <ul>
          <li>Start with it. Compare quotes using this amount, then adjust up or down based on what you learn.</li>
          <li>Consider whether you prefer more coverage for fewer years, or less coverage for longer.</li>
          <li>If you have employer coverage, it's already factored into the calculation if you entered it above.</li>
        </ul>
      </section>

      {/* CTAs */}
      <section className="coverage-ctas" aria-label="Next steps">
        <div className="coverage-ctas__primary">
          <button
            type="button"
            className="coverage-ctas__button coverage-ctas__button--primary"
            onClick={handlePrimaryCta}
          >
            See quotes from multiple carriers
          </button>
          <p className="coverage-ctas__helper">
            You can enter your estimated coverage amount when you get to the application.{' '}
            If a medical exam is required for your quote, the system may let you schedule it 
            directly in the flow, which can reduce follow-up steps.
          </p>
        </div>
        <div className="coverage-ctas__secondary">
          <button
            type="button"
            className="coverage-ctas__button coverage-ctas__button--secondary"
            onClick={handleSecondaryCta}
          >
            Learn what happens after you apply
          </button>
        </div>
      </section>

      {/* Why This Approach */}
      <section className="coverage-approach" aria-labelledby="why-this-approach">
        <h2 id="why-this-approach">Why this approach?</h2>
        <p>
          An estimate works best when you can see the logic behind it. This tool exposes 
          each variable so you can decide what matters for your situation. Some people want 
          to replace more income for fewer years. Some want to account for existing assets 
          more conservatively. The inputs let you explore those tradeoffs.
        </p>
        <p>
          If your situation involves business interests, estate planning, or other complexities, 
          a licensed advisor (Ryan Rostine, CA Producer #4479678) can review. You don't need 
          to talk to anyone to see rates and explore options.
        </p>
      </section>

      {/* FAQ */}
      <section className="coverage-faq" aria-labelledby="faq">
        <h2 id="faq">Common questions</h2>
        
        <details className="coverage-faq__item">
          <summary>Does this replace financial advice?</summary>
          <p>
            No. This produces a rough estimate for a straightforward situation. Complex 
            finances, health considerations, or non-standard needs may warrant individual review.
          </p>
        </details>

        <details className="coverage-faq__item">
          <summary>Why 70% for income replacement?</summary>
          <p>
            Many people don't need to replace 100% of income—taxes drop, some expenses change. 
            But you can adjust this. If you want to be conservative, use 100%. If your household 
            has other income sources, you might use less.
          </p>
        </details>

        <details className="coverage-faq__item">
          <summary>Should I include liquid assets?</summary>
          <p>
            Optional. Some people subtract accessible savings because they could use them. 
            Others prefer the estimate without this offset, treating it as a more conservative 
            target. You decide based on your comfort level.
          </p>
        </details>

        <details className="coverage-faq__item">
          <summary>How accurate is this?</summary>
          <p>
            It's a directional estimate based on the assumptions you enter. Your actual need 
            depends on factors this tool cannot see: how your income might change, exact 
            future expenses, your partner's financial situation, and other variables. Use this 
            as a starting point, not a precise figure.
          </p>
        </details>
      </section>
    </main>
  );
}

export default CoverageNeedPage;
