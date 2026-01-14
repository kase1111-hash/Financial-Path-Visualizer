import { describe, it, expect } from 'vitest';
import {
  calculateYearlyGrowth,
  calculateEmployerMatch,
  calculateFutureValue,
  calculatePresentValue,
  yearsToTarget,
  requiredMonthlySavings,
  calculateRetirementReadiness,
} from '@engine/growth';
import { dollarsToCents } from '@models/common';

describe('growth', () => {
  describe('calculateYearlyGrowth', () => {
    it('should calculate growth with no contributions', () => {
      const result = calculateYearlyGrowth(
        dollarsToCents(100000),
        0,
        0.07
      );

      // ~7% growth on $100,000 = ~$7,000
      expect(result.growth).toBeGreaterThan(dollarsToCents(6500));
      expect(result.growth).toBeLessThan(dollarsToCents(7500));
      expect(result.contributions).toBe(0);
      expect(result.endingBalance).toBeGreaterThan(dollarsToCents(106000));
    });

    it('should include contributions in growth', () => {
      const result = calculateYearlyGrowth(
        dollarsToCents(100000),
        dollarsToCents(1000), // $1,000/month
        0.07
      );

      // $12,000 in contributions
      expect(result.contributions).toBe(dollarsToCents(12000));
      // Ending balance should be starting + contributions + growth
      expect(result.endingBalance).toBeGreaterThan(
        dollarsToCents(100000) + result.contributions
      );
    });

    it('should handle zero return', () => {
      const result = calculateYearlyGrowth(
        dollarsToCents(100000),
        dollarsToCents(1000),
        0
      );

      expect(result.growth).toBe(0);
      expect(result.endingBalance).toBe(dollarsToCents(112000));
    });
  });

  describe('calculateEmployerMatch', () => {
    it('should calculate match up to limit', () => {
      // 50% match on up to 6% of salary
      // Salary: $100,000, Contributing $500/month ($6,000/year = 6%)
      const match = calculateEmployerMatch(
        dollarsToCents(500),
        dollarsToCents(100000),
        0.50,
        0.06
      );

      // Match: $6,000 * 50% = $3,000
      expect(match).toBe(dollarsToCents(3000));
    });

    it('should cap match at limit', () => {
      // Contributing more than limit
      // $1,000/month = $12,000/year = 12% of $100,000 salary
      // But match only applies to 6% = $6,000
      const match = calculateEmployerMatch(
        dollarsToCents(1000),
        dollarsToCents(100000),
        0.50,
        0.06
      );

      // Match: $6,000 * 50% = $3,000 (capped)
      expect(match).toBe(dollarsToCents(3000));
    });

    it('should return zero with no contribution', () => {
      const match = calculateEmployerMatch(
        0,
        dollarsToCents(100000),
        0.50,
        0.06
      );

      expect(match).toBe(0);
    });
  });

  describe('calculateFutureValue', () => {
    it('should calculate compound growth', () => {
      // Rule of 72: at 7%, money doubles in ~10 years
      const fv = calculateFutureValue(
        dollarsToCents(100000),
        0.07,
        10
      );

      expect(fv).toBeGreaterThan(dollarsToCents(190000));
      expect(fv).toBeLessThan(dollarsToCents(210000));
    });

    it('should handle zero years', () => {
      const fv = calculateFutureValue(dollarsToCents(100000), 0.07, 0);
      expect(fv).toBe(dollarsToCents(100000));
    });
  });

  describe('calculatePresentValue', () => {
    it('should be inverse of future value', () => {
      const original = dollarsToCents(100000);
      const fv = calculateFutureValue(original, 0.07, 10);
      const pv = calculatePresentValue(fv, 0.07, 10);

      // Should get back close to original (rounding may cause small difference)
      expect(Math.abs(pv - original)).toBeLessThan(100);
    });
  });

  describe('yearsToTarget', () => {
    it('should calculate years to reach target', () => {
      // $100,000 starting, $1,000/month, 7% return, target $500,000
      const years = yearsToTarget(
        dollarsToCents(100000),
        dollarsToCents(1000),
        0.07,
        dollarsToCents(500000)
      );

      expect(years).not.toBeNull();
      expect(years).toBeGreaterThan(10);
      expect(years).toBeLessThan(20);
    });

    it('should return 0 if already at target', () => {
      const years = yearsToTarget(
        dollarsToCents(100000),
        dollarsToCents(1000),
        0.07,
        dollarsToCents(50000)
      );

      expect(years).toBe(0);
    });

    it('should return null if target unreachable', () => {
      // Huge target with small savings
      const years = yearsToTarget(
        dollarsToCents(1000),
        dollarsToCents(10),
        0.01,
        dollarsToCents(100000000),
        50
      );

      expect(years).toBeNull();
    });
  });

  describe('requiredMonthlySavings', () => {
    it('should calculate required savings', () => {
      // Need $500,000 in 20 years, starting with $100,000, 7% return
      const monthly = requiredMonthlySavings(
        dollarsToCents(100000),
        dollarsToCents(500000),
        0.07,
        20
      );

      expect(monthly).toBeGreaterThan(0);
      expect(monthly).toBeLessThan(dollarsToCents(1500)); // Should be reasonable
    });

    it('should return zero if already at target', () => {
      const monthly = requiredMonthlySavings(
        dollarsToCents(600000),
        dollarsToCents(500000),
        0.07,
        20
      );

      expect(monthly).toBe(0);
    });
  });

  describe('calculateRetirementReadiness', () => {
    it('should calculate readiness with 4% rule', () => {
      // $1M portfolio, want $40,000/year
      const readiness = calculateRetirementReadiness(
        dollarsToCents(1000000),
        dollarsToCents(40000),
        0.04
      );

      expect(readiness.requiredNestEgg).toBe(dollarsToCents(1000000));
      expect(readiness.isReady).toBe(true);
      expect(readiness.percentageComplete).toBe(1);
      expect(readiness.sustainableWithdrawal).toBe(dollarsToCents(40000));
      expect(readiness.monthlyIncome).toBe(dollarsToCents(40000 / 12));
    });

    it('should show not ready when below target', () => {
      // $500K portfolio, want $40,000/year (need $1M)
      const readiness = calculateRetirementReadiness(
        dollarsToCents(500000),
        dollarsToCents(40000),
        0.04
      );

      expect(readiness.isReady).toBe(false);
      expect(readiness.percentageComplete).toBe(0.5);
    });

    it('should cap percentage at 100%', () => {
      // Overfunded
      const readiness = calculateRetirementReadiness(
        dollarsToCents(2000000),
        dollarsToCents(40000),
        0.04
      );

      expect(readiness.percentageComplete).toBe(1);
      expect(readiness.isReady).toBe(true);
    });
  });
});
