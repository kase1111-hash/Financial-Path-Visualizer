import { describe, it, expect } from 'vitest';
import {
  calculateFederalTax,
  calculateStateTax,
  calculateFica,
  calculateTotalTax,
  calculateRetirementTaxSavings,
} from '@engine/tax-calculator';
import { dollarsToCents } from '@models/common';

describe('tax-calculator', () => {
  describe('calculateFederalTax', () => {
    it('should calculate zero tax for income below standard deduction', () => {
      const result = calculateFederalTax(dollarsToCents(10000), 'single', 0);
      expect(result.tax).toBe(0);
      expect(result.taxableIncome).toBe(0);
      expect(result.effectiveRate).toBe(0);
    });

    it('should calculate tax for income in first bracket', () => {
      // $30,000 income, single
      // Standard deduction: $14,600
      // Taxable: $15,400
      const result = calculateFederalTax(dollarsToCents(30000), 'single', 0);
      expect(result.taxableIncome).toBe(dollarsToCents(15400));
      // Tax should be approximately 10-12% of taxable income
      expect(result.tax).toBeGreaterThan(dollarsToCents(1500));
      expect(result.tax).toBeLessThan(dollarsToCents(2000));
      // Should be in 12% bracket (taxable income > $11,600)
      expect(result.marginalRate).toBe(0.12);
    });

    it('should calculate tax across multiple brackets', () => {
      // $75,000 income, single
      // Standard deduction: $14,600
      // Taxable: $60,400
      // Tax: $11,600 * 10% + ($47,125 - $11,600) * 12% + ($60,400 - $47,125) * 22%
      const result = calculateFederalTax(dollarsToCents(75000), 'single', 0);
      expect(result.taxableIncome).toBe(dollarsToCents(60400));
      expect(result.marginalRate).toBe(0.22);
      expect(result.tax).toBeGreaterThan(0);
    });

    it('should reduce taxable income with retirement contributions', () => {
      const withoutContrib = calculateFederalTax(dollarsToCents(75000), 'single', 0);
      const withContrib = calculateFederalTax(dollarsToCents(75000), 'single', dollarsToCents(10000));

      expect(withContrib.taxableIncome).toBeLessThan(withoutContrib.taxableIncome);
      expect(withContrib.tax).toBeLessThan(withoutContrib.tax);
    });

    it('should use different brackets for married filing jointly', () => {
      // Same income should have lower tax for married joint
      const single = calculateFederalTax(dollarsToCents(100000), 'single', 0);
      const joint = calculateFederalTax(dollarsToCents(100000), 'married_joint', 0);

      expect(joint.tax).toBeLessThan(single.tax);
    });
  });

  describe('calculateStateTax', () => {
    it('should return zero for no-income-tax states', () => {
      const result = calculateStateTax(dollarsToCents(100000), 'TX', 0);
      expect(result.tax).toBe(0);
      expect(result.effectiveRate).toBe(0);
    });

    it('should calculate tax for flat-tax states', () => {
      // Illinois has 4.95% flat tax
      const result = calculateStateTax(dollarsToCents(100000), 'IL', 0);
      expect(result.tax).toBeGreaterThan(0);
    });

    it('should calculate tax for progressive-tax states', () => {
      // California has high progressive tax
      const result = calculateStateTax(dollarsToCents(200000), 'CA', 0);
      expect(result.tax).toBeGreaterThan(0);
    });
  });

  describe('calculateFica', () => {
    it('should calculate Social Security and Medicare', () => {
      const result = calculateFica(dollarsToCents(100000), 'single');

      // Social Security: 6.2% of income (capped at wage base)
      expect(result.socialSecurity).toBe(dollarsToCents(6200));

      // Medicare: 1.45% of income
      expect(result.medicare).toBe(dollarsToCents(1450));

      expect(result.total).toBe(result.socialSecurity + result.medicare);
    });

    it('should cap Social Security at wage base', () => {
      // $200,000 income - Social Security should be capped
      const result = calculateFica(dollarsToCents(200000), 'single');

      // SS wage base is $168,600, so SS tax = $168,600 * 6.2% = $10,453.20
      expect(result.socialSecurity).toBe(dollarsToCents(10453.2));
    });

    it('should add additional Medicare tax for high earners', () => {
      // $250,000 income - above $200,000 threshold for single
      const result = calculateFica(dollarsToCents(250000), 'single');

      // Additional Medicare: 0.9% on amount over $200,000
      // $50,000 * 0.9% = $450
      // Total Medicare: $250,000 * 1.45% + $450 = $4,075
      expect(result.medicare).toBe(dollarsToCents(4075));
    });
  });

  describe('calculateTotalTax', () => {
    it('should combine all taxes', () => {
      const result = calculateTotalTax(dollarsToCents(100000), 'single', 'CA', 0);

      expect(result.grossIncome).toBe(dollarsToCents(100000));
      expect(result.federalTax).toBeGreaterThan(0);
      expect(result.stateTax).toBeGreaterThan(0);
      expect(result.totalFica).toBeGreaterThan(0);
      expect(result.totalTax).toBe(result.federalTax + result.stateTax + result.totalFica);
      expect(result.netIncome).toBe(result.grossIncome - result.totalTax);
    });

    it('should calculate reasonable effective rate', () => {
      const result = calculateTotalTax(dollarsToCents(100000), 'single', 'CA', 0);

      // Effective rate should be between 20-40% for CA at this income
      expect(result.effectiveRate).toBeGreaterThan(0.20);
      expect(result.effectiveRate).toBeLessThan(0.40);
    });
  });

  describe('calculateRetirementTaxSavings', () => {
    it('should calculate tax savings from retirement contribution', () => {
      const savings = calculateRetirementTaxSavings(
        dollarsToCents(100000),
        dollarsToCents(10000),
        'single',
        'CA'
      );

      // Should have some savings (exact amount depends on marginal rate)
      expect(savings).toBeGreaterThan(0);
    });

    it('should return zero for zero contribution', () => {
      const savings = calculateRetirementTaxSavings(
        dollarsToCents(100000),
        0,
        'single',
        'CA'
      );

      expect(savings).toBe(0);
    });
  });
});
