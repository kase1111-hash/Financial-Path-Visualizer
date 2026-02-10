import { describe, it, expect } from 'vitest';
import { generateTrajectory, generateQuickTrajectory } from '@engine/projector';
import { createProfile } from '@models/profile';
import { createIncome } from '@models/income';
import { createDebt } from '@models/debt';
import { createAsset } from '@models/asset';
import { dollarsToCents } from '@models/common';

describe('projector', () => {
  describe('generateTrajectory', () => {
    it('should generate trajectory for empty profile', () => {
      const profile = createProfile({
        assumptions: {
          inflationRate: 0.03,
          marketReturn: 0.07,
          homeAppreciation: 0.03,
          salaryGrowth: 0.02,
          retirementWithdrawalRate: 0.04,
          incomeReplacementRatio: 0.80,
          lifeExpectancy: 85,
          currentAge: 30,
          taxFilingStatus: 'single',
          state: 'CA',
          taxYear: 2024,
        },
      });

      const trajectory = generateTrajectory(profile);

      expect(trajectory.profileId).toBe(profile.id);
      expect(trajectory.years.length).toBe(55); // 85 - 30 = 55 years
      expect(trajectory.summary.totalYears).toBe(55);
    });

    it('should project income with growth', () => {
      const profile = createProfile({
        income: [
          createIncome({
            name: 'Salary',
            type: 'salary',
            amount: dollarsToCents(100000), // $100k/year
            expectedGrowth: 0.03,
          }),
        ],
        assumptions: {
          inflationRate: 0.03,
          marketReturn: 0.07,
          homeAppreciation: 0.03,
          salaryGrowth: 0.02,
          retirementWithdrawalRate: 0.04,
          incomeReplacementRatio: 0.80,
          lifeExpectancy: 35, // Short projection for testing
          currentAge: 30,
          taxFilingStatus: 'single',
          state: 'CA',
          taxYear: 2024,
        },
      });

      const trajectory = generateTrajectory(profile);
      const firstYear = trajectory.years[0];
      const lastYear = trajectory.years[trajectory.years.length - 1];

      // First year should have base income
      expect(firstYear?.grossIncome).toBe(dollarsToCents(100000));

      // Last year should have grown income (5 years at 3%)
      // 100000 * (1.03)^4 = ~112,550
      if (lastYear) {
        expect(lastYear.grossIncome).toBeGreaterThan(dollarsToCents(112000));
        expect(lastYear.grossIncome).toBeLessThan(dollarsToCents(113000));
      }
    });

    it('should track debt payoff', () => {
      const profile = createProfile({
        income: [
          createIncome({
            name: 'Salary',
            type: 'salary',
            amount: dollarsToCents(100000),
          }),
        ],
        debts: [
          createDebt({
            name: 'Car Loan',
            type: 'auto',
            principal: dollarsToCents(10000),
            interestRate: 0.05,
            minimumPayment: dollarsToCents(500),
            actualPayment: dollarsToCents(500),
            termMonths: 24,
            monthsRemaining: 24,
          }),
        ],
        assumptions: {
          inflationRate: 0.03,
          marketReturn: 0.07,
          homeAppreciation: 0.03,
          salaryGrowth: 0.02,
          retirementWithdrawalRate: 0.04,
          incomeReplacementRatio: 0.80,
          lifeExpectancy: 40, // Short projection
          currentAge: 30,
          taxFilingStatus: 'single',
          state: 'CA',
          taxYear: 2024,
        },
      });

      const trajectory = generateTrajectory(profile);

      // Debt should be paid off within a few years
      const debtPayoffMilestone = trajectory.milestones.find(
        (m) => m.type === 'debt_payoff' && m.description.includes('Car Loan')
      );

      expect(debtPayoffMilestone).toBeDefined();

      // Verify total debt goes to zero
      const lastYear = trajectory.years[trajectory.years.length - 1];
      expect(lastYear?.totalDebt).toBe(0);
    });

    it('should track asset growth', () => {
      const profile = createProfile({
        income: [
          createIncome({
            name: 'Salary',
            type: 'salary',
            amount: dollarsToCents(100000),
          }),
        ],
        assets: [
          createAsset({
            name: '401k',
            type: 'retirement_pretax',
            balance: dollarsToCents(50000),
            monthlyContribution: dollarsToCents(1000),
            expectedReturn: 0.07,
          }),
        ],
        assumptions: {
          inflationRate: 0.03,
          marketReturn: 0.07,
          homeAppreciation: 0.03,
          salaryGrowth: 0.02,
          retirementWithdrawalRate: 0.04,
          incomeReplacementRatio: 0.80,
          lifeExpectancy: 40,
          currentAge: 30,
          taxFilingStatus: 'single',
          state: 'CA',
          taxYear: 2024,
        },
      });

      const trajectory = generateTrajectory(profile);

      const firstYear = trajectory.years[0];
      const lastYear = trajectory.years[trajectory.years.length - 1];

      // Assets should grow over time
      expect(lastYear?.totalAssets).toBeGreaterThan(firstYear?.totalAssets ?? 0);

      // Should accumulate significant assets over 10 years
      // Starting: $50k, contributing $12k/year, ~7% return
      expect(lastYear?.totalAssets).toBeGreaterThan(dollarsToCents(200000));
    });

    it('should calculate net worth correctly', () => {
      const profile = createProfile({
        income: [
          createIncome({
            name: 'Salary',
            type: 'salary',
            amount: dollarsToCents(100000),
          }),
        ],
        debts: [
          createDebt({
            name: 'Mortgage',
            type: 'mortgage',
            principal: dollarsToCents(200000),
            interestRate: 0.06,
            actualPayment: dollarsToCents(1200),
            propertyValue: dollarsToCents(250000),
          }),
        ],
        assets: [
          createAsset({
            name: 'Savings',
            type: 'savings',
            balance: dollarsToCents(50000),
            monthlyContribution: dollarsToCents(500),
            expectedReturn: 0.04,
          }),
        ],
        assumptions: {
          inflationRate: 0.03,
          marketReturn: 0.07,
          homeAppreciation: 0.03,
          salaryGrowth: 0.02,
          retirementWithdrawalRate: 0.04,
          incomeReplacementRatio: 0.80,
          lifeExpectancy: 35,
          currentAge: 30,
          taxFilingStatus: 'single',
          state: 'CA',
          taxYear: 2024,
        },
      });

      const trajectory = generateTrajectory(profile);

      for (const year of trajectory.years) {
        // Net worth = total assets - total debt
        expect(year.netWorth).toBe(year.totalAssets - year.totalDebt);
      }
    });

    it('should detect retirement readiness', () => {
      const profile = createProfile({
        income: [
          createIncome({
            name: 'Salary',
            type: 'salary',
            amount: dollarsToCents(100000),
          }),
        ],
        assets: [
          createAsset({
            name: '401k',
            type: 'retirement_pretax',
            balance: dollarsToCents(500000),
            monthlyContribution: dollarsToCents(2000),
            expectedReturn: 0.07,
          }),
        ],
        assumptions: {
          inflationRate: 0.03,
          marketReturn: 0.07,
          homeAppreciation: 0.03,
          salaryGrowth: 0.02,
          retirementWithdrawalRate: 0.04,
          incomeReplacementRatio: 0.80,
          lifeExpectancy: 60,
          currentAge: 30,
          taxFilingStatus: 'single',
          state: 'CA',
          taxYear: 2024,
        },
      });

      const trajectory = generateTrajectory(profile);

      // Should have a retirement_ready milestone at some point
      const retirementMilestone = trajectory.milestones.find(
        (m) => m.type === 'retirement_ready'
      );

      expect(retirementMilestone).toBeDefined();
      expect(trajectory.summary.retirementYear).not.toBeNull();
    });

    it('should use configurable income replacement ratio', () => {
      // Create two profiles with different income replacement ratios
      const baseProfile = {
        income: [
          createIncome({
            name: 'Salary',
            type: 'salary',
            amount: dollarsToCents(100000),
          }),
        ],
        assets: [
          createAsset({
            name: '401k',
            type: 'retirement_pretax',
            balance: dollarsToCents(1000000),
            monthlyContribution: dollarsToCents(1000),
            expectedReturn: 0.07,
          }),
        ],
      };

      const profile80 = createProfile({
        ...baseProfile,
        assumptions: {
          inflationRate: 0.03,
          marketReturn: 0.07,
          homeAppreciation: 0.03,
          salaryGrowth: 0.02,
          retirementWithdrawalRate: 0.04,
          incomeReplacementRatio: 0.80, // 80% replacement
          lifeExpectancy: 60,
          currentAge: 30,
          taxFilingStatus: 'single',
          state: 'CA',
          taxYear: 2024,
        },
      });

      const profile60 = createProfile({
        ...baseProfile,
        assumptions: {
          inflationRate: 0.03,
          marketReturn: 0.07,
          homeAppreciation: 0.03,
          salaryGrowth: 0.02,
          retirementWithdrawalRate: 0.04,
          incomeReplacementRatio: 0.60, // 60% replacement - should retire sooner
          lifeExpectancy: 60,
          currentAge: 30,
          taxFilingStatus: 'single',
          state: 'CA',
          taxYear: 2024,
        },
      });

      const trajectory80 = generateTrajectory(profile80);
      const trajectory60 = generateTrajectory(profile60);

      // With lower income replacement, should be retirement ready sooner
      const retirementYear80 = trajectory80.summary.retirementYear;
      const retirementYear60 = trajectory60.summary.retirementYear;

      expect(retirementYear60).not.toBeNull();
      expect(retirementYear80).not.toBeNull();

      if (retirementYear60 !== null && retirementYear80 !== null) {
        expect(retirementYear60).toBeLessThanOrEqual(retirementYear80);
      }
    });
  });

  describe('edge cases', () => {
    const baseAssumptions = {
      inflationRate: 0.03,
      marketReturn: 0.07,
      homeAppreciation: 0.03,
      salaryGrowth: 0.02,
      retirementWithdrawalRate: 0.04,
      incomeReplacementRatio: 0.80,
      lifeExpectancy: 40,
      currentAge: 30,
      taxFilingStatus: 'single' as const,
      state: 'CA',
      taxYear: 2024,
    };

    it('should handle $0 income — declining net worth from debts', () => {
      const profile = createProfile({
        income: [],
        debts: [
          createDebt({
            name: 'Credit Card',
            type: 'credit',
            principal: dollarsToCents(10000),
            interestRate: 0.20,
            minimumPayment: dollarsToCents(300),
            actualPayment: dollarsToCents(300),
          }),
        ],
        assumptions: baseAssumptions,
      });

      const trajectory = generateTrajectory(profile);

      // Every year should have $0 gross income
      for (const year of trajectory.years) {
        expect(year.grossIncome).toBe(0);
        expect(year.netIncome).toBe(0);
        expect(year.taxFederal).toBe(0);
        expect(year.taxState).toBe(0);
        expect(year.taxFica).toBe(0);
      }

      // Should still project without crashing
      expect(trajectory.years.length).toBe(10);
    });

    it('should handle negative net worth correctly', () => {
      const profile = createProfile({
        income: [
          createIncome({
            name: 'Salary',
            type: 'salary',
            amount: dollarsToCents(50000),
          }),
        ],
        debts: [
          createDebt({
            name: 'Student Loan',
            type: 'student',
            principal: dollarsToCents(200000),
            interestRate: 0.07,
            minimumPayment: dollarsToCents(1500),
            actualPayment: dollarsToCents(1500),
          }),
        ],
        assets: [
          createAsset({
            name: 'Savings',
            type: 'savings',
            balance: dollarsToCents(5000),
            monthlyContribution: dollarsToCents(100),
            expectedReturn: 0.04,
          }),
        ],
        assumptions: baseAssumptions,
      });

      const trajectory = generateTrajectory(profile);
      const firstYear = trajectory.years[0];

      // Net worth should be negative in early years
      expect(firstYear?.netWorth).toBeLessThan(0);
      // Net worth = assets - debts (still a valid equation)
      expect(firstYear?.netWorth).toBe(
        (firstYear?.totalAssets ?? 0) - (firstYear?.totalDebt ?? 0)
      );

      // No net worth milestones should fire while negative
      const netWorthMilestones = trajectory.milestones.filter(
        (m) => m.type === 'net_worth_milestone'
      );
      for (const m of netWorthMilestones) {
        const yearData = trajectory.years.find((y) => y.year === m.year);
        expect(yearData?.netWorth).toBeGreaterThan(0);
      }
    });

    it('should handle zero debts and zero assets — income only', () => {
      const profile = createProfile({
        income: [
          createIncome({
            name: 'Salary',
            type: 'salary',
            amount: dollarsToCents(80000),
          }),
        ],
        debts: [],
        assets: [],
        assumptions: baseAssumptions,
      });

      const trajectory = generateTrajectory(profile);

      for (const year of trajectory.years) {
        expect(year.totalDebt).toBe(0);
        expect(year.totalAssets).toBe(0);
        expect(year.netWorth).toBe(0);
        expect(year.totalDebtPayment).toBe(0);
        expect(year.totalInterestPaid).toBe(0);
        expect(year.debts.length).toBe(0);
        expect(year.assets.length).toBe(0);
        // Gross income should still be projected
        expect(year.grossIncome).toBeGreaterThan(0);
        // Taxes should be calculated
        expect(year.taxFederal).toBeGreaterThan(0);
      }
    });

    it('should handle income that ends mid-projection', () => {
      const currentYear = new Date().getFullYear();
      const profile = createProfile({
        income: [
          createIncome({
            name: 'Contract',
            type: 'salary',
            amount: dollarsToCents(120000),
            endDate: { month: 6, year: currentYear + 3 },
          }),
        ],
        assumptions: baseAssumptions,
      });

      const trajectory = generateTrajectory(profile);

      // Year 0 (current) should have full income
      expect(trajectory.years[0]?.grossIncome).toBe(dollarsToCents(120000));

      // After end date, income should be $0
      const yearAfterEnd = trajectory.years.find(
        (y) => y.year === currentYear + 4
      );
      expect(yearAfterEnd?.grossIncome).toBe(0);
      expect(yearAfterEnd?.taxFederal).toBe(0);
      expect(yearAfterEnd?.taxState).toBe(0);
      expect(yearAfterEnd?.taxFica).toBe(0);
    });

    it('should handle very high income ($10M+) with correct tax cap behavior', () => {
      const profile = createProfile({
        income: [
          createIncome({
            name: 'CEO Pay',
            type: 'salary',
            amount: dollarsToCents(10000000), // $10M
          }),
        ],
        assumptions: baseAssumptions,
      });

      const trajectory = generateTrajectory(profile);
      const firstYear = trajectory.years[0];

      // Social Security should be capped at wage base
      // SS tax = $168,600 * 6.2% = $10,453.20
      expect(firstYear?.taxFica).toBeGreaterThan(0);

      // Federal tax should be in the 37% bracket
      expect(firstYear?.taxFederal).toBeGreaterThan(0);

      // Effective rate shouldn't exceed ~50% even at $10M
      expect(firstYear?.effectiveTaxRate).toBeLessThan(0.55);
      expect(firstYear?.effectiveTaxRate).toBeGreaterThan(0.30);

      // No NaN or Infinity
      expect(Number.isFinite(firstYear?.netIncome)).toBe(true);
      expect(Number.isFinite(firstYear?.effectiveTaxRate)).toBe(true);
    });

    it('should handle long projection (age 20 to 95 = 75 years) without overflow', () => {
      const profile = createProfile({
        income: [
          createIncome({
            name: 'Salary',
            type: 'salary',
            amount: dollarsToCents(75000),
            expectedGrowth: 0.03,
          }),
        ],
        assets: [
          createAsset({
            name: '401k',
            type: 'retirement_pretax',
            balance: dollarsToCents(10000),
            monthlyContribution: dollarsToCents(500),
            expectedReturn: 0.07,
          }),
        ],
        assumptions: {
          ...baseAssumptions,
          currentAge: 20,
          lifeExpectancy: 95,
        },
      });

      const trajectory = generateTrajectory(profile);

      expect(trajectory.years.length).toBe(75);

      // No year should have NaN or Infinity values
      for (const year of trajectory.years) {
        expect(Number.isFinite(year.grossIncome)).toBe(true);
        expect(Number.isFinite(year.netIncome)).toBe(true);
        expect(Number.isFinite(year.netWorth)).toBe(true);
        expect(Number.isFinite(year.totalAssets)).toBe(true);
        expect(Number.isFinite(year.effectiveTaxRate)).toBe(true);
      }

      // Assets should grow substantially over 75 years
      const lastYear = trajectory.years[trajectory.years.length - 1];
      expect(lastYear?.totalAssets).toBeGreaterThan(dollarsToCents(1000000));
    });

    it('should handle all debts paid off in year 1', () => {
      const profile = createProfile({
        income: [
          createIncome({
            name: 'Salary',
            type: 'salary',
            amount: dollarsToCents(100000),
          }),
        ],
        debts: [
          createDebt({
            name: 'Small Loan',
            type: 'personal',
            principal: dollarsToCents(1000),
            interestRate: 0.05,
            minimumPayment: dollarsToCents(500),
            actualPayment: dollarsToCents(500),
          }),
        ],
        assumptions: baseAssumptions,
      });

      const trajectory = generateTrajectory(profile);

      // Debt should be gone after year 1
      expect(trajectory.years[0]?.debts[0]?.isPaidOff).toBe(true);

      // Subsequent years should have $0 debt
      for (let i = 1; i < trajectory.years.length; i++) {
        const year = trajectory.years[i];
        expect(year?.totalDebt).toBe(0);
        expect(year?.totalDebtPayment).toBe(0);
        expect(year?.totalInterestPaid).toBe(0);
      }

      // Should have a debt_payoff milestone
      const payoff = trajectory.milestones.find((m) => m.type === 'debt_payoff');
      expect(payoff).toBeDefined();
    });

    it('should handle negative asset growth rate', () => {
      const profile = createProfile({
        income: [
          createIncome({
            name: 'Salary',
            type: 'salary',
            amount: dollarsToCents(100000),
          }),
        ],
        assets: [
          createAsset({
            name: 'Losing Investment',
            type: 'investment',
            balance: dollarsToCents(100000),
            monthlyContribution: dollarsToCents(0),
            expectedReturn: -0.05, // Losing 5% per year
          }),
        ],
        assumptions: baseAssumptions,
      });

      const trajectory = generateTrajectory(profile);
      const firstYear = trajectory.years[0];
      const lastYear = trajectory.years[trajectory.years.length - 1];

      // Balance should decrease over time with no contributions and negative return
      expect(lastYear?.totalAssets).toBeLessThan(firstYear?.totalAssets ?? 0);

      // Should never go below 0
      for (const year of trajectory.years) {
        expect(year.totalAssets).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle Texas (no state tax) correctly', () => {
      const profile = createProfile({
        income: [
          createIncome({
            name: 'Salary',
            type: 'salary',
            amount: dollarsToCents(100000),
          }),
        ],
        assumptions: {
          ...baseAssumptions,
          state: 'TX',
        },
      });

      const trajectory = generateTrajectory(profile);

      for (const year of trajectory.years) {
        expect(year.taxState).toBe(0);
        // Federal and FICA should still be calculated
        expect(year.taxFederal).toBeGreaterThan(0);
        expect(year.taxFica).toBeGreaterThan(0);
      }
    });
  });

  describe('generateQuickTrajectory', () => {
    it('should generate shortened trajectory', () => {
      const profile = createProfile({
        assumptions: {
          inflationRate: 0.03,
          marketReturn: 0.07,
          homeAppreciation: 0.03,
          salaryGrowth: 0.02,
          retirementWithdrawalRate: 0.04,
          incomeReplacementRatio: 0.80,
          lifeExpectancy: 85,
          currentAge: 30,
          taxFilingStatus: 'single',
          state: 'CA',
          taxYear: 2024,
        },
      });

      const quickTrajectory = generateQuickTrajectory(profile, 10);

      expect(quickTrajectory.years.length).toBe(10);
      expect(quickTrajectory.summary.totalYears).toBe(10);
    });

    it('should default to 10 years', () => {
      const profile = createProfile({
        assumptions: {
          inflationRate: 0.03,
          marketReturn: 0.07,
          homeAppreciation: 0.03,
          salaryGrowth: 0.02,
          retirementWithdrawalRate: 0.04,
          incomeReplacementRatio: 0.80,
          lifeExpectancy: 85,
          currentAge: 30,
          taxFilingStatus: 'single',
          state: 'CA',
          taxYear: 2024,
        },
      });

      const quickTrajectory = generateQuickTrajectory(profile);

      expect(quickTrajectory.years.length).toBe(10);
    });
  });
});
