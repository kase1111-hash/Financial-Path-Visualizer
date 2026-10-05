import { describe, it, expect } from 'vitest';
import { runAllScanners } from '@scanner/index';
import { TAX_RULES } from '@scanner/tax-rules';
import { generateTrajectory } from '@engine/projector';
import { createProfile } from '@models/profile';
import { createIncome } from '@models/income';
import { createAsset } from '@models/asset';
import { createEmptyTrajectoryYear, createEmptyTrajectorySummary } from '@models/trajectory';
import type { Trajectory } from '@models/trajectory';
import { dollarsToCents } from '@models/common';

const assumptions = {
  inflationRate: 0.03,
  marketReturn: 0.07,
  homeAppreciation: 0.03,
  salaryGrowth: 0.02,
  retirementWithdrawalRate: 0.04,
  incomeReplacementRatio: 0.80,
  lifeExpectancy: 60,
  currentAge: 30,
  taxFilingStatus: 'single' as const,
  state: 'TX',
  taxYear: 2026,
};

const emptyTrajectory: Trajectory = {
  profileId: '',
  generatedAt: new Date(),
  years: [],
  milestones: [],
  summary: createEmptyTrajectorySummary(),
};

describe('scanner', () => {
  describe('runAllScanners', () => {
    it('should report each opportunity once, at the earliest year it applies', () => {
      const profile = createProfile({
        income: [createIncome({ amount: dollarsToCents(90000) })],
        assets: [
          createAsset({
            type: 'retirement_pretax',
            balance: dollarsToCents(20000),
            monthlyContribution: dollarsToCents(200),
            expectedReturn: 0.07,
            employerMatch: 0.5,
            matchLimit: 0.06,
          }),
        ],
        assumptions,
      });

      const trajectory = generateTrajectory(profile);
      const optimizations = runAllScanners(profile, trajectory);
      const titles = optimizations.map((o) => o.title);

      expect(new Set(titles).size).toBe(titles.length);
      const space = optimizations.find((o) => o.title === 'Unused Tax-Advantaged Space');
      expect(space?.yearApplicable).toBe(trajectory.years[0]?.year);
    });
  });

  describe('tax-bracket-boundary rule', () => {
    const rule = TAX_RULES.find((r) => r.id === 'tax-bracket-boundary')!;

    function scanAtGross(gross: number): ReturnType<typeof rule.scan> {
      const profile = createProfile({
        income: [createIncome({ amount: dollarsToCents(gross) })],
        assets: [createAsset({ type: 'retirement_pretax', monthlyContribution: 0 })],
        assumptions,
      });
      const year = createEmptyTrajectoryYear(2026, 30);
      year.grossIncome = dollarsToCents(gross);
      return rule.scan(profile, emptyTrajectory, year, null);
    }

    it('should use taxable income (after the standard deduction), not gross income', () => {
      // $52,000 gross is above the 22% threshold as a gross figure, but taxable
      // income is ~$36k, comfortably inside the 12% bracket
      expect(scanAtGross(52000)).toBeNull();
    });

    it('should trigger when taxable income is just above a bracket boundary', () => {
      // 2026 standard deduction + top of the 12% bracket + $2,000
      const result = scanAtGross(16100 + 50400 + 2000);
      expect(result).not.toBeNull();
      // Deducting the $2,000 taxed at 22% saves $440 (TX has no income tax)
      expect(result?.impact.annualChange).toBe(dollarsToCents(440));
    });
  });
});
