/**
 * Asset Growth Calculator
 *
 * Calculates asset growth, compound interest, and retirement projections.
 */

import type { Cents, Rate } from '@models/common';
import type { Asset } from '@models/asset';
import type { AssetState } from '@models/trajectory';

/**
 * Result of a single year's asset growth calculation.
 */
export interface AssetGrowthResult {
  /** Starting balance */
  startingBalance: Cents;
  /** Ending balance */
  endingBalance: Cents;
  /** User contributions during the year */
  contributions: Cents;
  /** Employer match contributions */
  employerMatch: Cents;
  /** Total contributions (user + employer) */
  totalContributions: Cents;
  /** Growth from returns */
  growth: Cents;
}

/**
 * Calculate compound growth for a single year.
 * Assumes monthly contributions.
 */
export function calculateYearlyGrowth(
  startingBalance: Cents,
  monthlyContribution: Cents,
  annualReturn: Rate
): { endingBalance: Cents; growth: Cents; contributions: Cents } {
  const monthlyReturn = annualReturn / 12;
  let balance = startingBalance;
  let totalContributions = 0;

  // Monthly compounding with contributions at start of each month
  for (let month = 0; month < 12; month++) {
    balance += monthlyContribution;
    totalContributions += monthlyContribution;
    balance = Math.round(balance * (1 + monthlyReturn));
  }

  const growth = balance - startingBalance - totalContributions;

  return {
    endingBalance: balance,
    growth,
    contributions: totalContributions,
  };
}

/**
 * Calculate employer match for a year.
 */
export function calculateEmployerMatch(
  monthlyContribution: Cents,
  annualSalary: Cents,
  matchRate: Rate,
  matchLimit: Rate
): Cents {
  const annualContribution = monthlyContribution * 12;
  const maxMatchableContribution = Math.round(annualSalary * matchLimit);
  const matchableAmount = Math.min(annualContribution, maxMatchableContribution);
  return Math.round(matchableAmount * matchRate);
}

/**
 * Calculate asset growth for a single year including employer match.
 */
export function calculateAssetYearWithMatch(
  asset: Asset,
  annualSalary: Cents
): AssetGrowthResult {
  const contributions = asset.monthlyContribution * 12;
  const employerMatch =
    asset.employerMatch !== null && asset.matchLimit !== null
      ? calculateEmployerMatch(
          asset.monthlyContribution,
          annualSalary,
          asset.employerMatch,
          asset.matchLimit
        )
      : 0;

  const totalContributions = contributions + employerMatch;
  const monthlyReturn = asset.expectedReturn / 12;
  let balance = asset.balance;

  // Monthly compounding with contributions at start of each month
  const monthlyContributionWithMatch = Math.round(totalContributions / 12);
  for (let month = 0; month < 12; month++) {
    balance += monthlyContributionWithMatch;
    balance = Math.round(balance * (1 + monthlyReturn));
  }

  const growth = balance - asset.balance - totalContributions;

  return {
    startingBalance: asset.balance,
    endingBalance: balance,
    contributions,
    employerMatch,
    totalContributions,
    growth,
  };
}

/**
 * Convert asset growth result to trajectory AssetState.
 */
export function assetGrowthToState(
  assetId: string,
  result: AssetGrowthResult
): AssetState {
  return {
    assetId,
    balance: result.endingBalance,
    contributionsThisYear: result.contributions,
    growthThisYear: result.growth,
    employerMatchThisYear: result.employerMatch,
  };
}

/**
 * Project asset value over multiple years.
 */
export function projectAssetOverYears(
  startingBalance: Cents,
  monthlyContribution: Cents,
  annualReturn: Rate,
  years: number
): { yearlyBalances: Cents[]; finalBalance: Cents; totalContributions: Cents; totalGrowth: Cents } {
  const yearlyBalances: Cents[] = [startingBalance];
  let balance = startingBalance;
  let totalContributions = 0;
  let totalGrowth = 0;

  for (let year = 0; year < years; year++) {
    const result = calculateYearlyGrowth(balance, monthlyContribution, annualReturn);
    balance = result.endingBalance;
    totalContributions += result.contributions;
    totalGrowth += result.growth;
    yearlyBalances.push(balance);
  }

  return {
    yearlyBalances,
    finalBalance: balance,
    totalContributions,
    totalGrowth,
  };
}

/**
 * Calculate future value of a lump sum.
 */
export function calculateFutureValue(
  presentValue: Cents,
  annualReturn: Rate,
  years: number
): Cents {
  return Math.round(presentValue * Math.pow(1 + annualReturn, years));
}

/**
 * Calculate present value of a future amount.
 */
export function calculatePresentValue(
  futureValue: Cents,
  annualReturn: Rate,
  years: number
): Cents {
  return Math.round(futureValue / Math.pow(1 + annualReturn, years));
}

/**
 * Calculate how long until an investment reaches a target.
 */
export function yearsToTarget(
  startingBalance: Cents,
  monthlyContribution: Cents,
  annualReturn: Rate,
  targetBalance: Cents,
  maxYears: number = 100
): number | null {
  let balance = startingBalance;

  for (let year = 0; year < maxYears; year++) {
    if (balance >= targetBalance) return year;
    const result = calculateYearlyGrowth(balance, monthlyContribution, annualReturn);
    balance = result.endingBalance;
  }

  return balance >= targetBalance ? maxYears : null;
}

/**
 * Calculate required monthly savings to reach a target.
 */
export function requiredMonthlySavings(
  startingBalance: Cents,
  targetBalance: Cents,
  annualReturn: Rate,
  years: number
): Cents {
  if (years <= 0) return targetBalance - startingBalance;

  // Future value of starting balance
  const fvStarting = calculateFutureValue(startingBalance, annualReturn, years);

  // Amount needed from contributions
  const needed = targetBalance - fvStarting;
  if (needed <= 0) return 0;

  // Future value of annuity formula: FV = PMT * (((1+r)^n - 1) / r)
  // Solving for PMT: PMT = FV * r / ((1+r)^n - 1)
  const monthlyReturn = annualReturn / 12;
  const months = years * 12;
  const factor = Math.pow(1 + monthlyReturn, months) - 1;

  if (factor === 0) return Math.round(needed / months);

  const monthlyPayment = (needed * monthlyReturn) / factor;
  return Math.round(monthlyPayment);
}

/**
 * Calculate retirement readiness.
 */
export interface RetirementReadiness {
  /** Current retirement assets */
  currentAssets: Cents;
  /** Required nest egg for desired income */
  requiredNestEgg: Cents;
  /** Percentage of goal achieved */
  percentageComplete: Rate;
  /** Is user ready to retire? */
  isReady: boolean;
  /** Sustainable annual withdrawal */
  sustainableWithdrawal: Cents;
  /** Monthly income from sustainable withdrawal */
  monthlyIncome: Cents;
}

export function calculateRetirementReadiness(
  retirementAssets: Cents,
  desiredAnnualIncome: Cents,
  withdrawalRate: Rate
): RetirementReadiness {
  const requiredNestEgg =
    withdrawalRate > 0 ? Math.round(desiredAnnualIncome / withdrawalRate) : Infinity;
  const percentageComplete =
    requiredNestEgg === Infinity ? 0 : retirementAssets / requiredNestEgg;
  const sustainableWithdrawal = Math.round(retirementAssets * withdrawalRate);

  return {
    currentAssets: retirementAssets,
    requiredNestEgg: requiredNestEgg === Infinity ? 0 : requiredNestEgg,
    percentageComplete: Math.min(1, percentageComplete),
    isReady: retirementAssets >= requiredNestEgg,
    sustainableWithdrawal,
    monthlyIncome: Math.round(sustainableWithdrawal / 12),
  };
}

/**
 * Calculate property appreciation.
 */
export function calculatePropertyAppreciation(
  currentValue: Cents,
  appreciationRate: Rate,
  years: number
): { futureValue: Cents; totalAppreciation: Cents } {
  const futureValue = calculateFutureValue(currentValue, appreciationRate, years);
  return {
    futureValue,
    totalAppreciation: futureValue - currentValue,
  };
}
