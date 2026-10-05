/**
 * Tax Calculator
 *
 * Calculates federal, state, and FICA taxes.
 */

import type { FilingStatus } from '@models/assumptions';
import type { Cents, Rate } from '@models/common';
import type { TaxBracket } from '@data/federal-tax-brackets';
import {
  DEFAULT_TAX_YEAR,
  FEDERAL_TAX_BRACKETS,
  STANDARD_DEDUCTION,
  getAdditionalMedicareThreshold,
  getTaxYearData,
} from '@data/federal-tax-brackets';
import { getStateTaxSchedule } from '@data/state-taxes';

/**
 * Breakdown of all taxes.
 */
export interface TaxBreakdown {
  grossIncome: Cents;
  federalTax: Cents;
  stateTax: Cents;
  socialSecurityTax: Cents;
  medicareTax: Cents;
  totalFica: Cents;
  totalTax: Cents;
  netIncome: Cents;
  effectiveRate: Rate;
  marginalRate: Rate;
}

/**
 * Federal tax calculation result.
 */
export interface FederalTaxResult {
  tax: Cents;
  taxableIncome: Cents;
  effectiveRate: Rate;
  marginalRate: Rate;
}

/**
 * State tax calculation result.
 */
export interface StateTaxResult {
  tax: Cents;
  effectiveRate: Rate;
}

/**
 * FICA tax calculation result.
 */
export interface FicaResult {
  socialSecurity: Cents;
  medicare: Cents;
  total: Cents;
}

/**
 * Options that select which year's tax law applies.
 */
export interface TaxOptions {
  /**
   * Calendar year whose tax law applies. Defaults to the latest year with
   * published data.
   */
  taxYear?: number;
  /**
   * Annual inflation rate used to index brackets, deductions and the Social
   * Security wage base for years after the latest published data.
   * Defaults to 0 (reuse the latest published thresholds unchanged).
   */
  inflationRate?: Rate;
}

/**
 * Options for a complete tax calculation.
 */
export interface TotalTaxOptions extends TaxOptions {
  /**
   * Wages subject to FICA, when different from gross income (passive income
   * such as rent or dividends is not subject to FICA). Defaults to gross income.
   */
  ficaWages?: Cents;
}

/**
 * Apply progressive brackets to a taxable amount.
 */
function applyBrackets(taxableIncome: Cents, brackets: TaxBracket[]): { tax: Cents; marginalRate: Rate } {
  let tax = 0;
  let marginalRate = brackets[0]?.rate ?? 0;

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;

    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += Math.round(taxableInBracket * bracket.rate);
    marginalRate = bracket.rate;
  }

  return { tax, marginalRate };
}

/**
 * Calculate federal income tax using progressive brackets.
 */
export function calculateFederalTax(
  grossIncome: Cents,
  filingStatus: FilingStatus,
  preRetirementContributions: Cents = 0,
  options: TaxOptions = {}
): FederalTaxResult {
  const yearData = getTaxYearData(options.taxYear ?? DEFAULT_TAX_YEAR, options.inflationRate ?? 0);
  const standardDeduction = yearData.standardDeduction[filingStatus];
  const brackets = yearData.brackets[filingStatus];

  // Calculate taxable income
  const adjustedGross = Math.max(0, grossIncome - preRetirementContributions);
  const taxableIncome = Math.max(0, adjustedGross - standardDeduction);

  if (taxableIncome === 0) {
    return {
      tax: 0,
      taxableIncome: 0,
      effectiveRate: 0,
      marginalRate: brackets[0]?.rate ?? 0,
    };
  }

  const { tax, marginalRate } = applyBrackets(taxableIncome, brackets);
  const effectiveRate = grossIncome > 0 ? tax / grossIncome : 0;

  return {
    tax,
    taxableIncome,
    effectiveRate,
    marginalRate,
  };
}

/**
 * Calculate state income tax.
 * Uses the state's married-filing-jointly schedule for joint filers and the
 * single schedule otherwise.
 */
export function calculateStateTax(
  grossIncome: Cents,
  state: string,
  preRetirementContributions: Cents = 0,
  filingStatus: FilingStatus = 'single',
  options: TaxOptions = {}
): StateTaxResult {
  const schedule = getStateTaxSchedule(
    state,
    filingStatus,
    options.taxYear ?? DEFAULT_TAX_YEAR,
    options.inflationRate ?? 0
  );

  if (!schedule) {
    return { tax: 0, effectiveRate: 0 };
  }

  const adjustedGross = Math.max(0, grossIncome - preRetirementContributions);
  const taxableIncome = Math.max(0, adjustedGross - schedule.deduction);

  if (taxableIncome === 0) {
    return { tax: 0, effectiveRate: 0 };
  }

  const { tax } = applyBrackets(taxableIncome, schedule.brackets);
  const effectiveRate = grossIncome > 0 ? tax / grossIncome : 0;

  return { tax, effectiveRate };
}

/**
 * Calculate FICA taxes (Social Security and Medicare) on wages.
 */
export function calculateFica(
  wages: Cents,
  filingStatus: FilingStatus,
  options: TaxOptions = {}
): FicaResult {
  const ficaRates = getTaxYearData(
    options.taxYear ?? DEFAULT_TAX_YEAR,
    options.inflationRate ?? 0
  ).ficaRates;

  // Social Security tax (capped at wage base)
  const socialSecurityWages = Math.min(wages, ficaRates.socialSecurityWageBase);
  const socialSecurity = Math.round(socialSecurityWages * ficaRates.socialSecurity);

  // Medicare tax (no cap, but additional tax for high earners)
  let medicare = Math.round(wages * ficaRates.medicare);

  // Additional Medicare tax for high earners (thresholds are not inflation-indexed)
  const additionalMedicareThreshold = getAdditionalMedicareThreshold(filingStatus);
  if (wages > additionalMedicareThreshold) {
    const additionalWages = wages - additionalMedicareThreshold;
    medicare += Math.round(additionalWages * ficaRates.additionalMedicare);
  }

  return {
    socialSecurity,
    medicare,
    total: socialSecurity + medicare,
  };
}

/**
 * Calculate all taxes and return complete breakdown.
 */
export function calculateTotalTax(
  grossIncome: Cents,
  filingStatus: FilingStatus,
  state: string,
  preRetirementContributions: Cents = 0,
  options: TotalTaxOptions = {}
): TaxBreakdown {
  const federal = calculateFederalTax(grossIncome, filingStatus, preRetirementContributions, options);
  const stateTax = calculateStateTax(
    grossIncome,
    state,
    preRetirementContributions,
    filingStatus,
    options
  );
  const fica = calculateFica(options.ficaWages ?? grossIncome, filingStatus, options);

  const totalTax = federal.tax + stateTax.tax + fica.total;
  const netIncome = grossIncome - totalTax;
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;

  return {
    grossIncome,
    federalTax: federal.tax,
    stateTax: stateTax.tax,
    socialSecurityTax: fica.socialSecurity,
    medicareTax: fica.medicare,
    totalFica: fica.total,
    totalTax,
    netIncome,
    effectiveRate,
    marginalRate: federal.marginalRate,
  };
}

/**
 * Calculate tax savings from retirement contribution.
 */
export function calculateRetirementTaxSavings(
  grossIncome: Cents,
  contribution: Cents,
  filingStatus: FilingStatus,
  state: string,
  existingPreTaxContributions: Cents = 0,
  options: TotalTaxOptions = {}
): Cents {
  const taxWithout = calculateTotalTax(
    grossIncome,
    filingStatus,
    state,
    existingPreTaxContributions,
    options
  );
  const taxWith = calculateTotalTax(
    grossIncome,
    filingStatus,
    state,
    existingPreTaxContributions + contribution,
    options
  );
  return taxWithout.totalTax - taxWith.totalTax;
}

/**
 * Calculate optimal retirement contribution to stay in current bracket.
 */
export function calculateOptimalContribution(
  grossIncome: Cents,
  filingStatus: FilingStatus,
  currentContribution: Cents
): { optimalContribution: Cents; taxSavings: Cents } | null {
  const standardDeduction = STANDARD_DEDUCTION[filingStatus];
  const taxableIncome = Math.max(0, grossIncome - currentContribution - standardDeduction);

  // Find current bracket
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus];
  const currentBracketIndex = brackets.findIndex(
    (b) => taxableIncome >= b.min && taxableIncome < b.max
  );

  if (currentBracketIndex <= 0) {
    return null; // Already in lowest bracket or no optimization possible
  }

  // Calculate amount to contribute to drop to previous bracket
  const currentBracket = brackets[currentBracketIndex];
  if (!currentBracket) return null;

  const amountAboveBracket = taxableIncome - currentBracket.min;
  const additionalContribution = amountAboveBracket;
  const optimalContribution = currentContribution + additionalContribution;

  // Calculate tax savings
  const previousBracket = brackets[currentBracketIndex - 1];
  if (!previousBracket) return null;

  const rateDifference = currentBracket.rate - previousBracket.rate;
  const taxSavings = Math.round(additionalContribution * rateDifference);

  return { optimalContribution, taxSavings };
}

/**
 * Estimate taxes for a future year, with brackets, deductions and the Social
 * Security wage base indexed for inflation beyond the latest published year.
 * This is a projection - actual future brackets may differ.
 */
export function estimateFutureTax(
  futureGrossIncome: Cents,
  yearsInFuture: number,
  inflationRate: Rate,
  filingStatus: FilingStatus,
  state: string,
  preRetirementContributions: Cents = 0
): TaxBreakdown {
  return calculateTotalTax(futureGrossIncome, filingStatus, state, preRetirementContributions, {
    taxYear: new Date().getFullYear() + yearsInFuture,
    inflationRate,
  });
}
