/**
 * Tax Context for Scanner Rules
 *
 * Reconstructs the tax picture of a projected year (the year's tax law,
 * taxable income, pre-tax contributions) so rules reason about the same
 * numbers the projection engine used.
 */

import type { Cents } from '@models/common';
import type { FinancialProfile } from '@models/profile';
import type { Trajectory, TrajectoryYear } from '@models/trajectory';
import type { TaxYearData } from '@data/federal-tax-brackets';
import { getTaxYearData } from '@data/federal-tax-brackets';
import { calculateRetirementTaxSavings } from '@engine/tax-calculator';
import { projectAllIncome } from '@engine/income-projector';

export interface YearTaxContext {
  /** Federal tax law for the year (indexed for inflation beyond published data). */
  data: TaxYearData;
  /** Pre-tax (traditional retirement + HSA) contributions made during the year. */
  preTaxContributions: Cents;
  /** Federal taxable income: gross - pre-tax contributions - standard deduction. */
  taxableIncome: Cents;
  /** Earned (non-passive) income: the FICA wage base and employer match base. */
  earnedIncome: Cents;
}

function isPreTaxAccount(type: string): boolean {
  return type === 'retirement_pretax' || type === 'hsa';
}

/**
 * Build the tax context for a projected year.
 */
export function getYearTaxContext(
  profile: FinancialProfile,
  trajectory: Trajectory,
  year: TrajectoryYear
): YearTaxContext {
  const { inflationRate, taxFilingStatus, salaryGrowth } = profile.assumptions;
  const data = getTaxYearData(year.year, inflationRate);

  // Prefer the contributions the projection actually made this year
  const preTaxAssetIds = new Set(
    profile.assets.filter((a) => isPreTaxAccount(a.type)).map((a) => a.id)
  );
  const preTaxContributions =
    year.assets.length > 0
      ? year.assets
          .filter((s) => preTaxAssetIds.has(s.assetId))
          .reduce((sum, s) => sum + s.contributionsThisYear, 0)
      : profile.assets
          .filter((a) => isPreTaxAccount(a.type))
          .reduce((sum, a) => sum + a.monthlyContribution * 12, 0);

  const taxableIncome = Math.max(
    0,
    year.grossIncome - preTaxContributions - data.standardDeduction[taxFilingStatus]
  );

  const startYear = trajectory.years[0]?.year ?? new Date().getFullYear();
  const earnedIncome = projectAllIncome(profile.income, year.year, startYear, salaryGrowth)
    .earnedIncome;

  return { data, preTaxContributions, taxableIncome, earnedIncome };
}

/**
 * Income tax (federal + state) saved in a year by contributing an additional
 * amount pre-tax, computed with the same tax engine as the projection.
 */
export function estimatePreTaxSavings(
  profile: FinancialProfile,
  year: TrajectoryYear,
  context: YearTaxContext,
  additionalContribution: Cents
): Cents {
  return calculateRetirementTaxSavings(
    year.grossIncome,
    additionalContribution,
    profile.assumptions.taxFilingStatus,
    profile.assumptions.state,
    context.preTaxContributions,
    {
      taxYear: year.year,
      inflationRate: profile.assumptions.inflationRate,
      ficaWages: context.earnedIncome,
    }
  );
}
