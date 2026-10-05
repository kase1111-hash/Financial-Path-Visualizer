/**
 * Federal Tax Brackets
 *
 * Tax brackets and standard deductions for federal income tax.
 * Supports multiple tax years — keyed by year. Years after the latest
 * published year are estimated by indexing the latest year's thresholds
 * for inflation, as the IRS does each year.
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
  // Rev. Proc. 2023-34; SSA 2024 wage base; IRS Notice 2023-75; Rev. Proc. 2023-23
  2024: {
    brackets: {
      single: [
        { min: 0, max: 1160000, rate: 0.10 },
        { min: 1160000, max: 4715000, rate: 0.12 },
        { min: 4715000, max: 10052500, rate: 0.22 },
        { min: 10052500, max: 19195000, rate: 0.24 },
        { min: 19195000, max: 24372500, rate: 0.32 },
        { min: 24372500, max: 60935000, rate: 0.35 },
        { min: 60935000, max: Infinity, rate: 0.37 },
      ],
      married_joint: [
        { min: 0, max: 2320000, rate: 0.10 },
        { min: 2320000, max: 9430000, rate: 0.12 },
        { min: 9430000, max: 20105000, rate: 0.22 },
        { min: 20105000, max: 38390000, rate: 0.24 },
        { min: 38390000, max: 48745000, rate: 0.32 },
        { min: 48745000, max: 73120000, rate: 0.35 },
        { min: 73120000, max: Infinity, rate: 0.37 },
      ],
      married_separate: [
        { min: 0, max: 1160000, rate: 0.10 },
        { min: 1160000, max: 4715000, rate: 0.12 },
        { min: 4715000, max: 10052500, rate: 0.22 },
        { min: 10052500, max: 19195000, rate: 0.24 },
        { min: 19195000, max: 24372500, rate: 0.32 },
        { min: 24372500, max: 36560000, rate: 0.35 },
        { min: 36560000, max: Infinity, rate: 0.37 },
      ],
      head_of_household: [
        { min: 0, max: 1655000, rate: 0.10 },
        { min: 1655000, max: 6310000, rate: 0.12 },
        { min: 6310000, max: 10050000, rate: 0.22 },
        { min: 10050000, max: 19195000, rate: 0.24 },
        { min: 19195000, max: 24370000, rate: 0.32 },
        { min: 24370000, max: 60935000, rate: 0.35 },
        { min: 60935000, max: Infinity, rate: 0.37 },
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
      limit401kCatchUp: 750000,
      limitIRA: 700000,
      limitIRACatchUp: 100000,
      limitHSAIndividual: 415000,
      limitHSAFamily: 830000,
      limitHSACatchUp: 100000,
    },
  },
  // Rev. Proc. 2024-40; standard deduction as amended by P.L. 119-21 (OBBBA); SSA 2025 wage base; IRS Notice 2024-80; Rev. Proc. 2024-25
  2025: {
    brackets: {
      single: [
        { min: 0, max: 1192500, rate: 0.10 },
        { min: 1192500, max: 4847500, rate: 0.12 },
        { min: 4847500, max: 10335000, rate: 0.22 },
        { min: 10335000, max: 19730000, rate: 0.24 },
        { min: 19730000, max: 25052500, rate: 0.32 },
        { min: 25052500, max: 62635000, rate: 0.35 },
        { min: 62635000, max: Infinity, rate: 0.37 },
      ],
      married_joint: [
        { min: 0, max: 2385000, rate: 0.10 },
        { min: 2385000, max: 9695000, rate: 0.12 },
        { min: 9695000, max: 20670000, rate: 0.22 },
        { min: 20670000, max: 39460000, rate: 0.24 },
        { min: 39460000, max: 50105000, rate: 0.32 },
        { min: 50105000, max: 75160000, rate: 0.35 },
        { min: 75160000, max: Infinity, rate: 0.37 },
      ],
      married_separate: [
        { min: 0, max: 1192500, rate: 0.10 },
        { min: 1192500, max: 4847500, rate: 0.12 },
        { min: 4847500, max: 10335000, rate: 0.22 },
        { min: 10335000, max: 19730000, rate: 0.24 },
        { min: 19730000, max: 25052500, rate: 0.32 },
        { min: 25052500, max: 37580000, rate: 0.35 },
        { min: 37580000, max: Infinity, rate: 0.37 },
      ],
      head_of_household: [
        { min: 0, max: 1700000, rate: 0.10 },
        { min: 1700000, max: 6485000, rate: 0.12 },
        { min: 6485000, max: 10335000, rate: 0.22 },
        { min: 10335000, max: 19730000, rate: 0.24 },
        { min: 19730000, max: 25050000, rate: 0.32 },
        { min: 25050000, max: 62635000, rate: 0.35 },
        { min: 62635000, max: Infinity, rate: 0.37 },
      ],
    },
    standardDeduction: {
      single: 1575000,
      married_joint: 3150000,
      married_separate: 1575000,
      head_of_household: 2362500,
    },
    ficaRates: {
      socialSecurity: 0.062,
      medicare: 0.0145,
      additionalMedicare: 0.009,
      socialSecurityWageBase: 17610000,
      additionalMedicareThresholdSingle: 20000000,
      additionalMedicareThresholdJoint: 25000000,
      additionalMedicareThresholdSeparate: 12500000,
    },
    retirementLimits: {
      limit401k: 2350000,
      limit401kCatchUp: 750000,
      limitIRA: 700000,
      limitIRACatchUp: 100000,
      limitHSAIndividual: 430000,
      limitHSAFamily: 855000,
      limitHSACatchUp: 100000,
    },
  },
  // Rev. Proc. 2025-32; SSA 2026 wage base; IRS Notice 2025-67; Rev. Proc. 2025-19
  2026: {
    brackets: {
      single: [
        { min: 0, max: 1240000, rate: 0.10 },
        { min: 1240000, max: 5040000, rate: 0.12 },
        { min: 5040000, max: 10570000, rate: 0.22 },
        { min: 10570000, max: 20177500, rate: 0.24 },
        { min: 20177500, max: 25622500, rate: 0.32 },
        { min: 25622500, max: 64060000, rate: 0.35 },
        { min: 64060000, max: Infinity, rate: 0.37 },
      ],
      married_joint: [
        { min: 0, max: 2480000, rate: 0.10 },
        { min: 2480000, max: 10080000, rate: 0.12 },
        { min: 10080000, max: 21140000, rate: 0.22 },
        { min: 21140000, max: 40355000, rate: 0.24 },
        { min: 40355000, max: 51245000, rate: 0.32 },
        { min: 51245000, max: 76870000, rate: 0.35 },
        { min: 76870000, max: Infinity, rate: 0.37 },
      ],
      married_separate: [
        { min: 0, max: 1240000, rate: 0.10 },
        { min: 1240000, max: 5040000, rate: 0.12 },
        { min: 5040000, max: 10570000, rate: 0.22 },
        { min: 10570000, max: 20177500, rate: 0.24 },
        { min: 20177500, max: 25622500, rate: 0.32 },
        { min: 25622500, max: 38435000, rate: 0.35 },
        { min: 38435000, max: Infinity, rate: 0.37 },
      ],
      head_of_household: [
        { min: 0, max: 1770000, rate: 0.10 },
        { min: 1770000, max: 6745000, rate: 0.12 },
        { min: 6745000, max: 10570000, rate: 0.22 },
        { min: 10570000, max: 20177500, rate: 0.24 },
        { min: 20177500, max: 25620000, rate: 0.32 },
        { min: 25620000, max: 64060000, rate: 0.35 },
        { min: 64060000, max: Infinity, rate: 0.37 },
      ],
    },
    standardDeduction: {
      single: 1610000,
      married_joint: 3220000,
      married_separate: 1610000,
      head_of_household: 2415000,
    },
    ficaRates: {
      socialSecurity: 0.062,
      medicare: 0.0145,
      additionalMedicare: 0.009,
      socialSecurityWageBase: 18450000,
      additionalMedicareThresholdSingle: 20000000,
      additionalMedicareThresholdJoint: 25000000,
      additionalMedicareThresholdSeparate: 12500000,
    },
    retirementLimits: {
      limit401k: 2450000,
      limit401kCatchUp: 800000,
      limitIRA: 750000,
      limitIRACatchUp: 110000,
      limitHSAIndividual: 440000,
      limitHSAFamily: 875000,
      limitHSACatchUp: 100000,
    },
  },
};

/** All available tax years, sorted ascending. */
export const AVAILABLE_TAX_YEARS: number[] = Object.keys(TAX_YEAR_DATA)
  .map(Number)
  .sort((a, b) => a - b);

/** Latest year with published data. Used when no tax year is specified. */
export const DEFAULT_TAX_YEAR: number = Math.max(...AVAILABLE_TAX_YEARS);

const EARLIEST_TAX_YEAR: number = Math.min(...AVAILABLE_TAX_YEARS);

function publishedYearData(year: number): TaxYearData {
  const data = TAX_YEAR_DATA[year];
  if (!data) throw new Error(`No published tax data for ${year}`);
  return data;
}

/**
 * Scale every inflation-indexed threshold in a year's data by a factor.
 * The Additional Medicare Tax thresholds are fixed by statute and not indexed.
 */
function indexTaxYearData(data: TaxYearData, factor: number): TaxYearData {
  const scale = (amount: Cents): Cents => Math.round(amount * factor);
  const scaleBrackets = (brackets: TaxBracket[]): TaxBracket[] =>
    brackets.map((b) => ({
      min: scale(b.min),
      max: b.max === Infinity ? Infinity : scale(b.max),
      rate: b.rate,
    }));

  return {
    brackets: {
      single: scaleBrackets(data.brackets.single),
      married_joint: scaleBrackets(data.brackets.married_joint),
      married_separate: scaleBrackets(data.brackets.married_separate),
      head_of_household: scaleBrackets(data.brackets.head_of_household),
    },
    standardDeduction: {
      single: scale(data.standardDeduction.single),
      married_joint: scale(data.standardDeduction.married_joint),
      married_separate: scale(data.standardDeduction.married_separate),
      head_of_household: scale(data.standardDeduction.head_of_household),
    },
    ficaRates: {
      ...data.ficaRates,
      socialSecurityWageBase: scale(data.ficaRates.socialSecurityWageBase),
    },
    retirementLimits: {
      limit401k: scale(data.retirementLimits.limit401k),
      limit401kCatchUp: scale(data.retirementLimits.limit401kCatchUp),
      limitIRA: scale(data.retirementLimits.limitIRA),
      limitIRACatchUp: scale(data.retirementLimits.limitIRACatchUp),
      limitHSAIndividual: scale(data.retirementLimits.limitHSAIndividual),
      limitHSAFamily: scale(data.retirementLimits.limitHSAFamily),
      limitHSACatchUp: data.retirementLimits.limitHSACatchUp,
    },
  };
}

/**
 * Get tax data for a specific year.
 *
 * Returns published data when available. For years after the latest
 * published year, the latest year's thresholds are indexed forward by
 * `inflationRate` per year (pass 0 to reuse them unchanged). Years before
 * the earliest published year use the earliest year's data.
 */
export function getTaxYearData(year: number, inflationRate: Rate = 0): TaxYearData {
  const data = TAX_YEAR_DATA[year];
  if (data) return data;

  if (year < EARLIEST_TAX_YEAR) return publishedYearData(EARLIEST_TAX_YEAR);

  const latest = publishedYearData(DEFAULT_TAX_YEAR);
  if (inflationRate === 0) return latest;

  return indexTaxYearData(latest, Math.pow(1 + inflationRate, year - DEFAULT_TAX_YEAR));
}

// Backward-compatible exports that reference the default (latest) tax year
const defaultYearData = publishedYearData(DEFAULT_TAX_YEAR);

/**
 * Federal tax brackets by filing status (default tax year).
 */
export const FEDERAL_TAX_BRACKETS: Record<FilingStatus, TaxBracket[]> = defaultYearData.brackets;

/**
 * Standard deduction amounts by filing status (default tax year).
 */
export const STANDARD_DEDUCTION: Record<FilingStatus, Cents> = defaultYearData.standardDeduction;

/**
 * FICA tax rates (default tax year).
 */
export const FICA_RATES = defaultYearData.ficaRates;

/**
 * Retirement contribution limits (default tax year).
 */
export const RETIREMENT_LIMITS = defaultYearData.retirementLimits;

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
