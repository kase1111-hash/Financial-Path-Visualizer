/**
 * Federal Tax Brackets
 *
 * Tax brackets and standard deductions for federal income tax.
 * Supports multiple tax years — keyed by year.
 * Falls back to the latest available year for future projections.
 */

import type { FilingStatus } from '@models/assumptions';
import type { Cents, Rate } from '@models/common';

/**
 * A single tax bracket.
 */
export interface TaxBracket {
  /** Minimum income for this bracket (in cents) */
  min: Cents;
  /** Maximum income for this bracket (in cents), Infinity for top bracket */
  max: Cents;
  /** Marginal tax rate for this bracket */
  rate: Rate;
}

/**
 * Tax data for a single year.
 */
export interface TaxYearData {
  brackets: Record<FilingStatus, TaxBracket[]>;
  standardDeduction: Record<FilingStatus, Cents>;
  ficaRates: {
    socialSecurity: Rate;
    medicare: Rate;
    additionalMedicare: Rate;
    socialSecurityWageBase: Cents;
    additionalMedicareThresholdSingle: Cents;
    additionalMedicareThresholdJoint: Cents;
    additionalMedicareThresholdSeparate: Cents;
  };
  retirementLimits: {
    limit401k: Cents;
    limit401kCatchUp: Cents;
    limitIRA: Cents;
    limitIRACatchUp: Cents;
    limitHSAIndividual: Cents;
    limitHSAFamily: Cents;
    limitHSACatchUp: Cents;
  };
}

/**
 * All available tax year data, keyed by year.
 */
export const TAX_YEAR_DATA: Record<number, TaxYearData> = {
  2024: {
    brackets: {
      single: [
        { min: 0, max: 1160000, rate: 0.10 },
        { min: 1160000, max: 4712500, rate: 0.12 },
        { min: 4712500, max: 10052500, rate: 0.22 },
        { min: 10052500, max: 19155000, rate: 0.24 },
        { min: 19155000, max: 24367500, rate: 0.32 },
        { min: 24367500, max: 60962500, rate: 0.35 },
        { min: 60962500, max: Infinity, rate: 0.37 },
      ],
      married_joint: [
        { min: 0, max: 2320000, rate: 0.10 },
        { min: 2320000, max: 9425000, rate: 0.12 },
        { min: 9425000, max: 20105000, rate: 0.22 },
        { min: 20105000, max: 38310000, rate: 0.24 },
        { min: 38310000, max: 48735000, rate: 0.32 },
        { min: 48735000, max: 73162500, rate: 0.35 },
        { min: 73162500, max: Infinity, rate: 0.37 },
      ],
      married_separate: [
        { min: 0, max: 1160000, rate: 0.10 },
        { min: 1160000, max: 4712500, rate: 0.12 },
        { min: 4712500, max: 10052500, rate: 0.22 },
        { min: 10052500, max: 19155000, rate: 0.24 },
        { min: 19155000, max: 24367500, rate: 0.32 },
        { min: 24367500, max: 36581250, rate: 0.35 },
        { min: 36581250, max: Infinity, rate: 0.37 },
      ],
      head_of_household: [
        { min: 0, max: 1650000, rate: 0.10 },
        { min: 1650000, max: 6355000, rate: 0.12 },
        { min: 6355000, max: 10052500, rate: 0.22 },
        { min: 10052500, max: 19155000, rate: 0.24 },
        { min: 19155000, max: 24367500, rate: 0.32 },
        { min: 24367500, max: 60962500, rate: 0.35 },
        { min: 60962500, max: Infinity, rate: 0.37 },
      ],
    },
    standardDeduction: {
      single: 1460000,
      married_joint: 2920000,
      married_separate: 1460000,
      head_of_household: 2190000,
    },
    ficaRates: {
      socialSecurity: 0.062,
      medicare: 0.0145,
      additionalMedicare: 0.009,
      socialSecurityWageBase: 16860000,
      additionalMedicareThresholdSingle: 20000000,
      additionalMedicareThresholdJoint: 25000000,
      additionalMedicareThresholdSeparate: 12500000,
    },
    retirementLimits: {
      limit401k: 2300000,
      limit401kCatchUp: 765000,
      limitIRA: 700000,
      limitIRACatchUp: 100000,
      limitHSAIndividual: 415000,
      limitHSAFamily: 830000,
      limitHSACatchUp: 100000,
    },
  },
  2025: {
    brackets: {
      single: [
        { min: 0, max: 1163000, rate: 0.10 },
        { min: 1163000, max: 4752500, rate: 0.12 },
        { min: 4752500, max: 10060000, rate: 0.22 },
        { min: 10060000, max: 19190000, rate: 0.24 },
        { min: 19190000, max: 24372500, rate: 0.32 },
        { min: 24372500, max: 62675000, rate: 0.35 },
        { min: 62675000, max: Infinity, rate: 0.37 },
      ],
      married_joint: [
        { min: 0, max: 2350000, rate: 0.10 },
        { min: 2350000, max: 9625000, rate: 0.12 },
        { min: 9625000, max: 20600000, rate: 0.22 },
        { min: 20600000, max: 39475000, rate: 0.24 },
        { min: 39475000, max: 50105000, rate: 0.32 },
        { min: 50105000, max: 75187500, rate: 0.35 },
        { min: 75187500, max: Infinity, rate: 0.37 },
      ],
      married_separate: [
        { min: 0, max: 1163000, rate: 0.10 },
        { min: 1163000, max: 4752500, rate: 0.12 },
        { min: 4752500, max: 10060000, rate: 0.22 },
        { min: 10060000, max: 19190000, rate: 0.24 },
        { min: 19190000, max: 24372500, rate: 0.32 },
        { min: 24372500, max: 37593750, rate: 0.35 },
        { min: 37593750, max: Infinity, rate: 0.37 },
      ],
      head_of_household: [
        { min: 0, max: 1665000, rate: 0.10 },
        { min: 1665000, max: 6445000, rate: 0.12 },
        { min: 6445000, max: 10060000, rate: 0.22 },
        { min: 10060000, max: 19190000, rate: 0.24 },
        { min: 19190000, max: 24372500, rate: 0.32 },
        { min: 24372500, max: 62675000, rate: 0.35 },
        { min: 62675000, max: Infinity, rate: 0.37 },
      ],
    },
    standardDeduction: {
      single: 1500000,
      married_joint: 3000000,
      married_separate: 1500000,
      head_of_household: 2250000,
    },
    ficaRates: {
      socialSecurity: 0.062,
      medicare: 0.0145,
      additionalMedicare: 0.009,
      socialSecurityWageBase: 17670000,
      additionalMedicareThresholdSingle: 20000000,
      additionalMedicareThresholdJoint: 25000000,
      additionalMedicareThresholdSeparate: 12500000,
    },
    retirementLimits: {
      limit401k: 2350000,
      limit401kCatchUp: 775000,
      limitIRA: 700000,
      limitIRACatchUp: 100000,
      limitHSAIndividual: 430000,
      limitHSAFamily: 855000,
      limitHSACatchUp: 100000,
    },
  },
};

/** Default tax year to use. */
export const DEFAULT_TAX_YEAR = 2024;

/** All available tax years, sorted ascending. */
export const AVAILABLE_TAX_YEARS: number[] = Object.keys(TAX_YEAR_DATA)
  .map(Number)
  .sort((a, b) => a - b);

/**
 * Get tax data for a specific year.
 * Falls back to the latest available year if the requested year isn't available.
 */
export function getTaxYearData(year: number): TaxYearData {
  const data = TAX_YEAR_DATA[year];
  if (data) return data;

  // Fall back to the latest available year
  const latestYear = AVAILABLE_TAX_YEARS[AVAILABLE_TAX_YEARS.length - 1] ?? DEFAULT_TAX_YEAR;
  return TAX_YEAR_DATA[latestYear] ?? TAX_YEAR_DATA[DEFAULT_TAX_YEAR]!;
}

// Backward-compatible exports that reference 2024 data
const data2024 = TAX_YEAR_DATA[2024]!;

/**
 * Federal tax brackets by filing status (2024 — for backward compatibility).
 */
export const FEDERAL_TAX_BRACKETS: Record<FilingStatus, TaxBracket[]> = data2024.brackets;

/**
 * Standard deduction amounts by filing status (2024 — for backward compatibility).
 */
export const STANDARD_DEDUCTION: Record<FilingStatus, Cents> = data2024.standardDeduction;

/**
 * FICA tax rates (2024 — for backward compatibility).
 */
export const FICA_RATES = data2024.ficaRates;

/**
 * Retirement contribution limits (2024 — for backward compatibility).
 */
export const RETIREMENT_LIMITS = data2024.retirementLimits;

/**
 * Get the marginal tax bracket for a given taxable income.
 */
export function getMarginalBracket(
  taxableIncome: Cents,
  filingStatus: FilingStatus
): TaxBracket | undefined {
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus];
  return brackets.find((b) => taxableIncome >= b.min && taxableIncome < b.max);
}

/**
 * Get the next tax bracket (for optimization suggestions).
 */
export function getNextBracket(
  taxableIncome: Cents,
  filingStatus: FilingStatus
): TaxBracket | undefined {
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus];
  const currentIndex = brackets.findIndex(
    (b) => taxableIncome >= b.min && taxableIncome < b.max
  );
  if (currentIndex === -1 || currentIndex === brackets.length - 1) {
    return undefined;
  }
  return brackets[currentIndex + 1];
}

/**
 * Calculate distance to next tax bracket.
 */
export function distanceToNextBracket(
  taxableIncome: Cents,
  filingStatus: FilingStatus
): Cents | null {
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus];
  const currentBracket = brackets.find(
    (b) => taxableIncome >= b.min && taxableIncome < b.max
  );
  if (!currentBracket || currentBracket.max === Infinity) {
    return null;
  }
  return currentBracket.max - taxableIncome;
}

/**
 * Get the additional Medicare threshold for a filing status.
 */
export function getAdditionalMedicareThreshold(filingStatus: FilingStatus): Cents {
  switch (filingStatus) {
    case 'married_joint':
      return FICA_RATES.additionalMedicareThresholdJoint;
    case 'married_separate':
      return FICA_RATES.additionalMedicareThresholdSeparate;
    default:
      return FICA_RATES.additionalMedicareThresholdSingle;
  }
}
