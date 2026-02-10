/**
 * Comparison Engine
 *
 * Compares two financial trajectories to show the impact of changes.
 */

import type { Cents } from '@models/common';
import type { Trajectory, TrajectoryYear } from '@models/trajectory';
import type {
  Comparison,
  Change,
  YearDelta,
  ComparisonSummary,
} from '@models/comparison';
import {
  createEmptyComparisonSummary,
  calculateYearDelta,
  formatCurrencyDelta,
  formatWorkHoursDelta,
} from '@models/comparison';
import { generateId } from '@models/common';

/**
 * Compare two trajectories and generate a detailed comparison.
 */
export function compareTrajectories(
  baseline: Trajectory,
  alternate: Trajectory,
  changes: Change[],
  name = 'Comparison'
): Comparison {
  const deltas = calculateAllDeltas(baseline, alternate);
  const summary = generateComparisonSummary(baseline, alternate, deltas);

  return {
    id: generateId(),
    name,
    baseline,
    alternate,
    changes,
    deltas,
    summary,
    createdAt: new Date(),
  };
}

/**
 * Calculate year-by-year deltas between two trajectories.
 */
function calculateAllDeltas(
  baseline: Trajectory,
  alternate: Trajectory
): YearDelta[] {
  const deltas: YearDelta[] = [];

  // Match years between trajectories
  const baselineYears = new Map(baseline.years.map((y) => [y.year, y]));

  for (const altYear of alternate.years) {
    const baseYear = baselineYears.get(altYear.year);
    if (baseYear) {
      deltas.push(calculateYearDelta(baseYear, altYear));
    }
  }

  return deltas;
}

/**
 * Generate summary of key differences.
 */
function generateComparisonSummary(
  baseline: Trajectory,
  alternate: Trajectory,
  _deltas: YearDelta[]
): ComparisonSummary {
  const summary = createEmptyComparisonSummary();

  // Retirement date delta
  if (baseline.summary.retirementYear !== null && alternate.summary.retirementYear !== null) {
    const baselineMonths = baseline.summary.retirementYear * 12;
    const alternateMonths = alternate.summary.retirementYear * 12;
    summary.retirementDateDelta = alternateMonths - baselineMonths;
  } else if (baseline.summary.retirementYear === null && alternate.summary.retirementYear !== null) {
    // Alternate achieves retirement when baseline doesn't
    summary.retirementDateDelta = -9999; // Special value meaning "enables retirement"
  } else if (baseline.summary.retirementYear !== null && alternate.summary.retirementYear === null) {
    // Baseline achieves retirement but alternate doesn't
    summary.retirementDateDelta = 9999; // Special value meaning "prevents retirement"
  }

  // Lifetime interest delta
  summary.lifetimeInterestDelta =
    alternate.summary.totalLifetimeInterest - baseline.summary.totalLifetimeInterest;

  // Net worth at retirement delta
  summary.netWorthAtRetirementDelta =
    alternate.summary.netWorthAtRetirement - baseline.summary.netWorthAtRetirement;

  // Total work hours delta
  summary.totalWorkHoursDelta =
    alternate.summary.totalLifetimeWorkHours - baseline.summary.totalLifetimeWorkHours;

  // Net worth at end delta
  summary.netWorthAtEndDelta =
    alternate.summary.netWorthAtEnd - baseline.summary.netWorthAtEnd;

  // Generate key insight
  summary.keyInsight = generateKeyInsight(summary, baseline, alternate);

  return summary;
}

/**
 * Generate a human-readable key insight about the comparison.
 */
function generateKeyInsight(
  summary: ComparisonSummary,
  _baseline: Trajectory,
  _alternate: Trajectory
): string {
  const insights: string[] = [];

  // Retirement impact
  if (summary.retirementDateDelta === -9999) {
    insights.push('This change enables retirement');
  } else if (summary.retirementDateDelta === 9999) {
    insights.push('This change prevents retirement');
  } else if (summary.retirementDateDelta !== 0) {
    const years = Math.abs(summary.retirementDateDelta) / 12;
    if (summary.retirementDateDelta < 0) {
      insights.push(`Retire ${years.toFixed(1)} years earlier`);
    } else {
      insights.push(`Retire ${years.toFixed(1)} years later`);
    }
  }

  // Net worth impact
  if (Math.abs(summary.netWorthAtEndDelta) >= 10000000) {
    const direction = summary.netWorthAtEndDelta > 0 ? 'more' : 'less';
    insights.push(`${formatCurrencyDelta(Math.abs(summary.netWorthAtEndDelta))} ${direction} at end`);
  }

  // Interest savings
  if (summary.lifetimeInterestDelta < -100000) {
    insights.push(`Save ${formatCurrencyDelta(Math.abs(summary.lifetimeInterestDelta))} in interest`);
  }

  // Work hours
  if (Math.abs(summary.totalWorkHoursDelta) >= 2080) {
    insights.push(formatWorkHoursDelta(summary.totalWorkHoursDelta));
  }

  if (insights.length === 0) {
    return 'Minimal difference between scenarios';
  }

  return insights.join('. ');
}

/**
 * Find the year where two trajectories diverge most significantly.
 */
export function findMaxDivergenceYear(deltas: YearDelta[]): YearDelta | null {
  if (deltas.length === 0) return null;

  return deltas.reduce((max, delta) => {
    const maxDelta = Math.abs(max.netWorthDelta);
    const currentDelta = Math.abs(delta.netWorthDelta);
    return currentDelta > maxDelta ? delta : max;
  }, deltas[0]!);
}

/**
 * Calculate the crossover year where alternate becomes better/worse than baseline.
 */
export function findCrossoverYear(deltas: YearDelta[]): number | null {
  for (let i = 1; i < deltas.length; i++) {
    const prev = deltas[i - 1];
    const curr = deltas[i];
    if (prev && curr) {
      // Check if sign changed
      if (
        (prev.netWorthDelta <= 0 && curr.netWorthDelta > 0) ||
        (prev.netWorthDelta >= 0 && curr.netWorthDelta < 0)
      ) {
        return curr.year;
      }
    }
  }
  return null;
}

/**
 * Calculate cumulative impact over a range of years.
 */
export function calculateCumulativeImpact(
  deltas: YearDelta[],
  startYear: number,
  endYear: number
): {
  totalNetWorthDelta: Cents;
  totalIncomeDelta: Cents;
  totalTaxesDelta: Cents;
  averageYearlyBenefit: Cents;
} {
  const relevantDeltas = deltas.filter(
    (d) => d.year >= startYear && d.year <= endYear
  );

  if (relevantDeltas.length === 0) {
    return {
      totalNetWorthDelta: 0,
      totalIncomeDelta: 0,
      totalTaxesDelta: 0,
      averageYearlyBenefit: 0,
    };
  }

  // For cumulative impact, we want the final delta (not sum of deltas)
  const lastDelta = relevantDeltas[relevantDeltas.length - 1]!;

  const totalIncomeDelta = relevantDeltas.reduce((sum, d) => sum + d.incomeDelta, 0);
  const totalTaxesDelta = relevantDeltas.reduce((sum, d) => sum + d.taxesDelta, 0);

  return {
    totalNetWorthDelta: lastDelta.netWorthDelta,
    totalIncomeDelta,
    totalTaxesDelta,
    averageYearlyBenefit: Math.round(lastDelta.netWorthDelta / relevantDeltas.length),
  };
}

/**
 * Generate comparison at a specific point in time.
 */
export function getComparisonAtYear(
  comparison: Comparison,
  year: number
): {
  baselineYear: TrajectoryYear | undefined;
  alternateYear: TrajectoryYear | undefined;
  delta: YearDelta | undefined;
} {
  return {
    baselineYear: comparison.baseline.years.find((y) => y.year === year),
    alternateYear: comparison.alternate.years.find((y) => y.year === year),
    delta: comparison.deltas.find((d) => d.year === year),
  };
}

/**
 * Calculate break-even year for a decision that has upfront costs but long-term benefits.
 */
export function findBreakEvenYear(deltas: YearDelta[]): number | null {
  // Find first year where cumulative benefit becomes positive
  let cumulative = 0;

  for (const delta of deltas) {
    cumulative += delta.netWorthDelta;
    if (cumulative > 0) {
      return delta.year;
    }
  }

  return null;
}
