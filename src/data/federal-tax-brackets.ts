/**
 * Federal Tax Brackets (2024)
 *
 * Tax brackets and standard deductions for federal income tax.
 * Updated annually - these are 2024 values.
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
 * Federal tax brackets by filing status (2024).
 * Amounts are in cents.
 */
export const FEDERAL_TAX_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
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
};

/**
 * Standard deduction amounts by filing status (2024).
 * Amounts are in cents.
 */
export const STANDARD_DEDUCTION: Record<FilingStatus, Cents> = {
  single: 1460000, // $14,600
  married_joint: 2920000, // $29,200
  married_separate: 1460000, // $14,600
  head_of_household: 2190000, // $21,900
};

/**
 * FICA tax rates (2024).
 */
export const FICA_RATES = {
  /** Social Security tax rate (employee portion) */
  socialSecurity: 0.062,
  /** Medicare tax rate (employee portion) */
  medicare: 0.0145,
  /** Additional Medicare tax rate for high earners */
  additionalMedicare: 0.009,
  /** Social Security wage base limit (in cents) */
  socialSecurityWageBase: 16860000, // $168,600
  /** Threshold for additional Medicare tax - single (in cents) */
  additionalMedicareThresholdSingle: 20000000, // $200,000
  /** Threshold for additional Medicare tax - married joint (in cents) */
  additionalMedicareThresholdJoint: 25000000, // $250,000
  /** Threshold for additional Medicare tax - married separate (in cents) */
  additionalMedicareThresholdSeparate: 12500000, // $125,000
};

/**
 * Retirement contribution limits (2024).
 * Amounts are in cents.
 */
export const RETIREMENT_LIMITS = {
  /** 401(k) employee contribution limit */
  limit401k: 2300000, // $23,000
  /** 401(k) catch-up contribution (age 50+) */
  limit401kCatchUp: 765000, // $7,650
  /** IRA contribution limit */
  limitIRA: 700000, // $7,000
  /** IRA catch-up contribution (age 50+) */
  limitIRACatchUp: 100000, // $1,000
  /** HSA contribution limit - individual */
  limitHSAIndividual: 415000, // $4,150
  /** HSA contribution limit - family */
  limitHSAFamily: 830000, // $8,300
  /** HSA catch-up contribution (age 55+) */
  limitHSACatchUp: 100000, // $1,000
};

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
