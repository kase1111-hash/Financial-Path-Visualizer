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
    const TY2024 = { taxYear: 2024 };

    it('should calculate zero tax for income below standard deduction', () => {
      const result = calculateFederalTax(dollarsToCents(10000), 'single', 0);
      expect(result.tax).toBe(0);
      expect(result.taxableIncome).toBe(0);
      expect(result.effectiveRate).toBe(0);
    });

    it('should calculate tax for income in first bracket', () => {
      // $30,000 income, single, 2024
      // Standard deduction: $14,600 -> taxable $15,400
      // Tax: $11,600 * 10% + $3,800 * 12% = $1,160 + $456 = $1,616
      const result = calculateFederalTax(dollarsToCents(30000), 'single', 0, TY2024);
      expect(result.taxableIncome).toBe(dollarsToCents(15400));
      expect(result.tax).toBe(dollarsToCents(1616));
      expect(result.marginalRate).toBe(0.12);
    });

    it('should calculate tax across multiple brackets', () => {
      // $75,000 income, single, 2024
      // Standard deduction: $14,600 -> taxable $60,400
      // Tax: $11,600 * 10% + ($47,150 - $11,600) * 12% + ($60,400 - $47,150) * 22%
      //    = $1,160 + $4,266 + $2,915 = $8,341
      const result = calculateFederalTax(dollarsToCents(75000), 'single', 0, TY2024);
      expect(result.taxableIncome).toBe(dollarsToCents(60400));
      expect(result.marginalRate).toBe(0.22);
      expect(result.tax).toBe(dollarsToCents(8341));
    });

    it('should use the 2025 brackets and OBBBA standard deduction', () => {
      // $100,000 single, 2025: deduction $15,750 -> taxable $84,250
      // $11,925 * 10% + ($48,475 - $11,925) * 12% + ($84,250 - $48,475) * 22%
      //  = $1,192.50 + $4,386 + $7,870.50 = $13,449
      const result = calculateFederalTax(dollarsToCents(100000), 'single', 0, { taxYear: 2025 });
      expect(result.taxableIncome).toBe(dollarsToCents(84250));
      expect(result.tax).toBe(dollarsToCents(13449));
    });

    it('should use the 2026 brackets', () => {
      // $100,000 single, 2026: deduction $16,100 -> taxable $83,900
      // $12,400 * 10% + ($50,400 - $12,400) * 12% + ($83,900 - $50,400) * 22%
      //  = $1,240 + $4,560 + $7,370 = $13,170
      const result = calculateFederalTax(dollarsToCents(100000), 'single', 0, { taxYear: 2026 });
      expect(result.taxableIncome).toBe(dollarsToCents(83900));
      expect(result.tax).toBe(dollarsToCents(13170));
    });

    it('should use the correct 2024 head of household thresholds', () => {
      // $120,000 HOH, 2024: deduction $21,900 -> taxable $98,100 (22% bracket ends at $100,500)
      // $16,550 * 10% + ($63,100 - $16,550) * 12% + ($98,100 - $63,100) * 22%
      //  = $1,655 + $5,586 + $7,700 = $14,941
      const result = calculateFederalTax(dollarsToCents(120000), 'head_of_household', 0, TY2024);
      expect(result.tax).toBe(dollarsToCents(14941));
      expect(result.marginalRate).toBe(0.22);
    });

    it('should index brackets for inflation beyond the latest published year', () => {
      // Income that keeps pace with inflation should pay the same share in tax
      const base = calculateFederalTax(dollarsToCents(100000), 'single', 0, { taxYear: 2026 });
      const factor = Math.pow(1.03, 10);
      const later = calculateFederalTax(Math.round(dollarsToCents(100000) * factor), 'single', 0, {
        taxYear: 2036,
        inflationRate: 0.03,
      });
      expect(later.effectiveRate).toBeCloseTo(base.effectiveRate, 4);
      expect(later.marginalRate).toBe(base.marginalRate);
    });

    it('should reduce taxable income with retirement contributions', () => {
      const withoutContrib = calculateFederalTax(dollarsToCents(75000), 'single', 0);
      const withContrib = calculateFederalTax(dollarsToCents(75000), 'single', dollarsToCents(10000));

      expect(withContrib.taxableIncome).toBe(withoutContrib.taxableIncome - dollarsToCents(10000));
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
      // Illinois has 4.95% flat tax, no deduction
      const result = calculateStateTax(dollarsToCents(100000), 'IL', 0);
      // $100,000 * 4.95% = $4,950
      expect(result.tax).toBe(dollarsToCents(4950));
    });

    it('should calculate progressive CA tax at $100K using brackets', () => {
      // CA: $100,000 gross, $5,456 standard deduction, taxable = $94,544
      // Bracket calculation (2024 single):
      //   $10,102 * 1%   = $101.02
      //   ($23,968 - $10,102) * 2%  = $277.32
      //   ($37,833 - $23,968) * 4%  = $554.60
      //   ($52,479 - $37,833) * 6%  = $878.76
      //   ($66,362 - $52,479) * 8%  = $1,110.64
      //   ($94,544 - $66,362) * 9.3% = $2,620.93
      // Total ≈ $5,543.27
      const result = calculateStateTax(dollarsToCents(100000), 'CA', 0);
      // Should be close to $5,543 — definitely less than old flat-rate calc
      // Old flat rate: $94,544 * 13.3% = $12,574 (way too high)
      expect(result.tax).toBeGreaterThan(dollarsToCents(5400));
      expect(result.tax).toBeLessThan(dollarsToCents(5700));
    });

    it('should calculate progressive CA tax at $250K using brackets', () => {
      // CA: $250,000 gross, $5,456 deduction, taxable = $244,544
      const result = calculateStateTax(dollarsToCents(250000), 'CA', 0);
      // Progressive calc should be much less than flat 13.3% * $244,544 = $32,524
      expect(result.tax).toBeGreaterThan(dollarsToCents(15000));
      expect(result.tax).toBeLessThan(dollarsToCents(20000));
    });

    it('should calculate progressive CA tax at $500K using brackets', () => {
      // CA: $500,000 gross, $5,456 deduction, taxable = $494,544
      // Progressive calc through 9 brackets = ~$45,181
      const result = calculateStateTax(dollarsToCents(500000), 'CA', 0);
      expect(result.tax).toBeGreaterThan(dollarsToCents(44000));
      expect(result.tax).toBeLessThan(dollarsToCents(46000));
      // Verify it's less than the old flat-rate approach (13.3% * $494,544 = $65,774)
      expect(result.tax).toBeLessThan(dollarsToCents(65774));
    });

    it('should calculate progressive NY tax using brackets', () => {
      // NY: $100,000 gross, $8,000 standard deduction, taxable = $92,000
      // NY has brackets 4%, 4.5%, 5.25%, 5.5%, 6% — bulk falls in 6% bracket
      // Calculated: ~$5,247
      const result = calculateStateTax(dollarsToCents(100000), 'NY', 0);
      expect(result.tax).toBeGreaterThan(dollarsToCents(5000));
      expect(result.tax).toBeLessThan(dollarsToCents(5500));
    });

    it('should calculate progressive NJ tax using brackets', () => {
      // NJ: $100,000 gross, no deduction, taxable = $100,000
      // NJ has low rates at this level (1.4% up to $20k, then 1.75%, 3.5%, 5.525%)
      const result = calculateStateTax(dollarsToCents(100000), 'NJ', 0);
      expect(result.tax).toBeGreaterThan(dollarsToCents(2500));
      expect(result.tax).toBeLessThan(dollarsToCents(4500));
    });

    it('should calculate less tax with progressive brackets than old flat rate for high-bracket states', () => {
      // For CA at moderate income, progressive brackets should yield LESS tax than flat 13.3%
      const result = calculateStateTax(dollarsToCents(100000), 'CA', 0);
      const flatRateWouldBe = Math.round((dollarsToCents(100000) - 545600) * 0.133);
      expect(result.tax).toBeLessThan(flatRateWouldBe);
    });

    it('should handle retirement contributions reducing state tax', () => {
      const without = calculateStateTax(dollarsToCents(100000), 'CA', 0);
      const with10k = calculateStateTax(dollarsToCents(100000), 'CA', dollarsToCents(10000));
      expect(with10k.tax).toBeLessThan(without.tax);
    });

    it('should return zero for income below standard deduction', () => {
      // CA standard deduction is $5,456
      const result = calculateStateTax(dollarsToCents(5000), 'CA', 0);
      expect(result.tax).toBe(0);
    });
  });

  describe('calculateFica', () => {
    const TY2024 = { taxYear: 2024 };

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
      const result = calculateFica(dollarsToCents(200000), 'single', TY2024);

      // 2024 SS wage base is $168,600, so SS tax = $168,600 * 6.2% = $10,453.20
      expect(result.socialSecurity).toBe(dollarsToCents(10453.2));

      // 2026 wage base is $184,500: $184,500 * 6.2% = $11,439
      expect(calculateFica(dollarsToCents(200000), 'single', { taxYear: 2026 }).socialSecurity).toBe(
        dollarsToCents(11439)
      );
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
    it('should exclude non-wage income from FICA', () => {
      const wagesOnly = calculateTotalTax(dollarsToCents(100000), 'single', 'TX', 0);
      const withPassive = calculateTotalTax(dollarsToCents(100000), 'single', 'TX', 0, {
        ficaWages: dollarsToCents(60000),
      });
      expect(withPassive.totalFica).toBe(Math.round(dollarsToCents(60000) * 0.0765));
      expect(withPassive.federalTax).toBe(wagesOnly.federalTax);
    });

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
