/**
 * State Income Tax Data
 *
 * Single and married-filing-jointly schedules for all 50 states + DC.
 * Values carried over from the previous 2024 single-filer data set (pending update).
 *
 * Simplifications:
 * - Local/county/city income taxes are not included.
 * - "deduction" combines the standard deduction and any personal exemptions
 *   that reduce taxable income; exemption *credits* and income-based
 *   phase-outs are not modeled.
 * - Married filing separately and head of household use the single schedule.
 * - Years after STATE_TAX_YEAR index thresholds for inflation.
 */

import type { Cents, Rate } from '@models/common';
import type { FilingStatus } from '@models/assumptions';
import type { TaxBracket } from '@data/federal-tax-brackets';

/**
 * One filing status's tax schedule.
 */
export interface StateTaxSchedule {
  /** Progressive brackets (a flat tax is a single bracket), amounts in cents */
  brackets: TaxBracket[];
  /** Standard deduction plus personal exemptions, in cents */
  deduction: Cents;
}

/**
 * State tax configuration.
 */
export interface StateTaxConfig {
  /** State name */
  name: string;
  /** Whether the state taxes wage income */
  hasIncomeTax: boolean;
  /** Tax type: none, flat, or progressive */
  type: 'none' | 'flat' | 'progressive';
  /** Schedule for single filers */
  single: StateTaxSchedule;
  /** Schedule for married couples filing jointly */
  marriedJoint: StateTaxSchedule;
}

/** Tax year the state data reflects. */
export const STATE_TAX_YEAR = 2024;

const NO_TAX: StateTaxSchedule = { brackets: [], deduction: 0 };

/**
 * State tax data by state code. Amounts in cents.
 */
export const STATE_TAX_DATA: Record<string, StateTaxConfig> = {
  AK: { name: 'Alaska', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  AL: {
    name: 'Alabama',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 50000, rate: 0.02 },
      { min: 50000, max: 300000, rate: 0.04 },
      { min: 300000, max: Infinity, rate: 0.05 },
    ], deduction: 300000 },
    marriedJoint: { brackets: [
      { min: 0, max: 50000, rate: 0.02 },
      { min: 50000, max: 300000, rate: 0.04 },
      { min: 300000, max: Infinity, rate: 0.05 },
    ], deduction: 300000 },
  },
  AR: {
    name: 'Arkansas',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 490200, rate: 0.02 },
      { min: 490200, max: 980300, rate: 0.04 },
      { min: 980300, max: Infinity, rate: 0.044 },
    ], deduction: 246000 },
    marriedJoint: { brackets: [
      { min: 0, max: 490200, rate: 0.02 },
      { min: 490200, max: 980300, rate: 0.04 },
      { min: 980300, max: Infinity, rate: 0.044 },
    ], deduction: 246000 },
  },
  AZ: {
    name: 'Arizona',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.025 },
    ], deduction: 1413600 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.025 },
    ], deduction: 1413600 },
  },
  CA: {
    name: 'California',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1010200, rate: 0.01 },
      { min: 1010200, max: 2396800, rate: 0.02 },
      { min: 2396800, max: 3783300, rate: 0.04 },
      { min: 3783300, max: 5247900, rate: 0.06 },
      { min: 5247900, max: 6636200, rate: 0.08 },
      { min: 6636200, max: 33878200, rate: 0.093 },
      { min: 33878200, max: 40653900, rate: 0.103 },
      { min: 40653900, max: 67756400, rate: 0.113 },
      { min: 67756400, max: 100000000, rate: 0.123 },
      { min: 100000000, max: Infinity, rate: 0.133 },
    ], deduction: 545600 },
    marriedJoint: { brackets: [
      { min: 0, max: 1010200, rate: 0.01 },
      { min: 1010200, max: 2396800, rate: 0.02 },
      { min: 2396800, max: 3783300, rate: 0.04 },
      { min: 3783300, max: 5247900, rate: 0.06 },
      { min: 5247900, max: 6636200, rate: 0.08 },
      { min: 6636200, max: 33878200, rate: 0.093 },
      { min: 33878200, max: 40653900, rate: 0.103 },
      { min: 40653900, max: 67756400, rate: 0.113 },
      { min: 67756400, max: 100000000, rate: 0.123 },
      { min: 100000000, max: Infinity, rate: 0.133 },
    ], deduction: 545600 },
  },
  CO: {
    name: 'Colorado',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.044 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.044 },
    ], deduction: 0 },
  },
  CT: {
    name: 'Connecticut',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1000000, rate: 0.03 },
      { min: 1000000, max: 500000, rate: 0.05 },
      { min: 500000, max: 1000000, rate: 0.055 },
      { min: 1000000, max: 25000000, rate: 0.06 },
      { min: 25000000, max: 50000000, rate: 0.065 },
      { min: 50000000, max: Infinity, rate: 0.0699 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 1000000, rate: 0.03 },
      { min: 1000000, max: 500000, rate: 0.05 },
      { min: 500000, max: 1000000, rate: 0.055 },
      { min: 1000000, max: 25000000, rate: 0.06 },
      { min: 25000000, max: 50000000, rate: 0.065 },
      { min: 50000000, max: Infinity, rate: 0.0699 },
    ], deduction: 0 },
  },
  DC: {
    name: 'District of Columbia',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1000000, rate: 0.04 },
      { min: 1000000, max: 4000000, rate: 0.06 },
      { min: 4000000, max: 6000000, rate: 0.065 },
      { min: 6000000, max: 35000000, rate: 0.085 },
      { min: 35000000, max: 100000000, rate: 0.0925 },
      { min: 100000000, max: Infinity, rate: 0.1075 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 1000000, rate: 0.04 },
      { min: 1000000, max: 4000000, rate: 0.06 },
      { min: 4000000, max: 6000000, rate: 0.065 },
      { min: 6000000, max: 35000000, rate: 0.085 },
      { min: 35000000, max: 100000000, rate: 0.0925 },
      { min: 100000000, max: Infinity, rate: 0.1075 },
    ], deduction: 0 },
  },
  DE: {
    name: 'Delaware',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 200000, rate: 0.022 },
      { min: 200000, max: 500000, rate: 0.039 },
      { min: 500000, max: 1000000, rate: 0.048 },
      { min: 1000000, max: 2500000, rate: 0.052 },
      { min: 2500000, max: 6000000, rate: 0.0555 },
      { min: 6000000, max: Infinity, rate: 0.066 },
    ], deduction: 330000 },
    marriedJoint: { brackets: [
      { min: 0, max: 200000, rate: 0.022 },
      { min: 200000, max: 500000, rate: 0.039 },
      { min: 500000, max: 1000000, rate: 0.048 },
      { min: 1000000, max: 2500000, rate: 0.052 },
      { min: 2500000, max: 6000000, rate: 0.0555 },
      { min: 6000000, max: Infinity, rate: 0.066 },
    ], deduction: 330000 },
  },
  FL: { name: 'Florida', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  GA: {
    name: 'Georgia',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 75000, rate: 0.01 },
      { min: 75000, max: 225000, rate: 0.02 },
      { min: 225000, max: 375000, rate: 0.03 },
      { min: 375000, max: 525000, rate: 0.04 },
      { min: 525000, max: 700000, rate: 0.05 },
      { min: 700000, max: Infinity, rate: 0.0549 },
    ], deduction: 1240000 },
    marriedJoint: { brackets: [
      { min: 0, max: 75000, rate: 0.01 },
      { min: 75000, max: 225000, rate: 0.02 },
      { min: 225000, max: 375000, rate: 0.03 },
      { min: 375000, max: 525000, rate: 0.04 },
      { min: 525000, max: 700000, rate: 0.05 },
      { min: 700000, max: Infinity, rate: 0.0549 },
    ], deduction: 1240000 },
  },
  HI: {
    name: 'Hawaii',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 240000, rate: 0.014 },
      { min: 240000, max: 480000, rate: 0.032 },
      { min: 480000, max: 960000, rate: 0.055 },
      { min: 960000, max: 1680000, rate: 0.064 },
      { min: 1680000, max: 2400000, rate: 0.068 },
      { min: 2400000, max: 3600000, rate: 0.072 },
      { min: 3600000, max: 4800000, rate: 0.076 },
      { min: 4800000, max: 15000000, rate: 0.079 },
      { min: 15000000, max: 17500000, rate: 0.0825 },
      { min: 17500000, max: 20000000, rate: 0.09 },
      { min: 20000000, max: Infinity, rate: 0.11 },
    ], deduction: 248000 },
    marriedJoint: { brackets: [
      { min: 0, max: 240000, rate: 0.014 },
      { min: 240000, max: 480000, rate: 0.032 },
      { min: 480000, max: 960000, rate: 0.055 },
      { min: 960000, max: 1680000, rate: 0.064 },
      { min: 1680000, max: 2400000, rate: 0.068 },
      { min: 2400000, max: 3600000, rate: 0.072 },
      { min: 3600000, max: 4800000, rate: 0.076 },
      { min: 4800000, max: 15000000, rate: 0.079 },
      { min: 15000000, max: 17500000, rate: 0.0825 },
      { min: 17500000, max: 20000000, rate: 0.09 },
      { min: 20000000, max: Infinity, rate: 0.11 },
    ], deduction: 248000 },
  },
  IA: {
    name: 'Iowa',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 600000, rate: 0.044 },
      { min: 600000, max: Infinity, rate: 0.057 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 600000, rate: 0.044 },
      { min: 600000, max: Infinity, rate: 0.057 },
    ], deduction: 0 },
  },
  ID: {
    name: 'Idaho',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.058 },
    ], deduction: 1460000 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.058 },
    ], deduction: 1460000 },
  },
  IL: {
    name: 'Illinois',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0495 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0495 },
    ], deduction: 0 },
  },
  IN: {
    name: 'Indiana',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0305 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0305 },
    ], deduction: 0 },
  },
  KS: {
    name: 'Kansas',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1500000, rate: 0.031 },
      { min: 1500000, max: 3000000, rate: 0.0525 },
      { min: 3000000, max: Infinity, rate: 0.057 },
    ], deduction: 300000 },
    marriedJoint: { brackets: [
      { min: 0, max: 1500000, rate: 0.031 },
      { min: 1500000, max: 3000000, rate: 0.0525 },
      { min: 3000000, max: Infinity, rate: 0.057 },
    ], deduction: 300000 },
  },
  KY: {
    name: 'Kentucky',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.04 },
    ], deduction: 296000 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.04 },
    ], deduction: 296000 },
  },
  LA: {
    name: 'Louisiana',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1250000, rate: 0.0185 },
      { min: 1250000, max: 5000000, rate: 0.035 },
      { min: 5000000, max: Infinity, rate: 0.0425 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 1250000, rate: 0.0185 },
      { min: 1250000, max: 5000000, rate: 0.035 },
      { min: 5000000, max: Infinity, rate: 0.0425 },
    ], deduction: 0 },
  },
  MA: {
    name: 'Massachusetts',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.05 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.05 },
    ], deduction: 0 },
  },
  MD: {
    name: 'Maryland',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 100000, rate: 0.02 },
      { min: 100000, max: 300000, rate: 0.03 },
      { min: 300000, max: 400000, rate: 0.04 },
      { min: 400000, max: 15000000, rate: 0.0475 },
      { min: 15000000, max: 17500000, rate: 0.05 },
      { min: 17500000, max: 25000000, rate: 0.0525 },
      { min: 25000000, max: Infinity, rate: 0.0575 },
    ], deduction: 265000 },
    marriedJoint: { brackets: [
      { min: 0, max: 100000, rate: 0.02 },
      { min: 100000, max: 300000, rate: 0.03 },
      { min: 300000, max: 400000, rate: 0.04 },
      { min: 400000, max: 15000000, rate: 0.0475 },
      { min: 15000000, max: 17500000, rate: 0.05 },
      { min: 17500000, max: 25000000, rate: 0.0525 },
      { min: 25000000, max: Infinity, rate: 0.0575 },
    ], deduction: 265000 },
  },
  ME: {
    name: 'Maine',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 2495000, rate: 0.058 },
      { min: 2495000, max: 5890000, rate: 0.0675 },
      { min: 5890000, max: Infinity, rate: 0.0715 },
    ], deduction: 1410000 },
    marriedJoint: { brackets: [
      { min: 0, max: 2495000, rate: 0.058 },
      { min: 2495000, max: 5890000, rate: 0.0675 },
      { min: 5890000, max: Infinity, rate: 0.0715 },
    ], deduction: 1410000 },
  },
  MI: {
    name: 'Michigan',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0425 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0425 },
    ], deduction: 0 },
  },
  MN: {
    name: 'Minnesota',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 3123000, rate: 0.0535 },
      { min: 3123000, max: 10260200, rate: 0.068 },
      { min: 10260200, max: 18371400, rate: 0.0785 },
      { min: 18371400, max: Infinity, rate: 0.0985 },
    ], deduction: 1460000 },
    marriedJoint: { brackets: [
      { min: 0, max: 3123000, rate: 0.0535 },
      { min: 3123000, max: 10260200, rate: 0.068 },
      { min: 10260200, max: 18371400, rate: 0.0785 },
      { min: 18371400, max: Infinity, rate: 0.0985 },
    ], deduction: 1460000 },
  },
  MO: {
    name: 'Missouri',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 100000, rate: 0.02 },
      { min: 100000, max: 200000, rate: 0.025 },
      { min: 200000, max: 300000, rate: 0.03 },
      { min: 300000, max: 400000, rate: 0.035 },
      { min: 400000, max: 500000, rate: 0.04 },
      { min: 500000, max: 600000, rate: 0.045 },
      { min: 600000, max: Infinity, rate: 0.048 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 100000, rate: 0.02 },
      { min: 100000, max: 200000, rate: 0.025 },
      { min: 200000, max: 300000, rate: 0.03 },
      { min: 300000, max: 400000, rate: 0.035 },
      { min: 400000, max: 500000, rate: 0.04 },
      { min: 500000, max: 600000, rate: 0.045 },
      { min: 600000, max: Infinity, rate: 0.048 },
    ], deduction: 0 },
  },
  MS: {
    name: 'Mississippi',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1000000, rate: 0.047 },
      { min: 1000000, max: Infinity, rate: 0.05 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 1000000, rate: 0.047 },
      { min: 1000000, max: Infinity, rate: 0.05 },
    ], deduction: 0 },
  },
  MT: {
    name: 'Montana',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 2000000, rate: 0.047 },
      { min: 2000000, max: Infinity, rate: 0.059 },
    ], deduction: 565000 },
    marriedJoint: { brackets: [
      { min: 0, max: 2000000, rate: 0.047 },
      { min: 2000000, max: Infinity, rate: 0.059 },
    ], deduction: 565000 },
  },
  NC: {
    name: 'North Carolina',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0525 },
    ], deduction: 1275000 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0525 },
    ], deduction: 1275000 },
  },
  ND: {
    name: 'North Dakota',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0195 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0195 },
    ], deduction: 0 },
  },
  NE: {
    name: 'Nebraska',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 379200, rate: 0.0246 },
      { min: 379200, max: 2274800, rate: 0.0351 },
      { min: 2274800, max: 3637600, rate: 0.0501 },
      { min: 3637600, max: Infinity, rate: 0.0584 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 379200, rate: 0.0246 },
      { min: 379200, max: 2274800, rate: 0.0351 },
      { min: 2274800, max: 3637600, rate: 0.0501 },
      { min: 3637600, max: Infinity, rate: 0.0584 },
    ], deduction: 0 },
  },
  NH: { name: 'New Hampshire', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  NJ: {
    name: 'New Jersey',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 2000000, rate: 0.014 },
      { min: 2000000, max: 3500000, rate: 0.0175 },
      { min: 3500000, max: 4000000, rate: 0.035 },
      { min: 4000000, max: 7500000, rate: 0.05525 },
      { min: 7500000, max: 50000000, rate: 0.0637 },
      { min: 50000000, max: 100000000, rate: 0.0897 },
      { min: 100000000, max: Infinity, rate: 0.1075 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 2000000, rate: 0.014 },
      { min: 2000000, max: 3500000, rate: 0.0175 },
      { min: 3500000, max: 4000000, rate: 0.035 },
      { min: 4000000, max: 7500000, rate: 0.05525 },
      { min: 7500000, max: 50000000, rate: 0.0637 },
      { min: 50000000, max: 100000000, rate: 0.0897 },
      { min: 100000000, max: Infinity, rate: 0.1075 },
    ], deduction: 0 },
  },
  NM: {
    name: 'New Mexico',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 550000, rate: 0.017 },
      { min: 550000, max: 1100000, rate: 0.032 },
      { min: 1100000, max: 1600000, rate: 0.047 },
      { min: 1600000, max: 21000000, rate: 0.049 },
      { min: 21000000, max: Infinity, rate: 0.059 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 550000, rate: 0.017 },
      { min: 550000, max: 1100000, rate: 0.032 },
      { min: 1100000, max: 1600000, rate: 0.047 },
      { min: 1600000, max: 21000000, rate: 0.049 },
      { min: 21000000, max: Infinity, rate: 0.059 },
    ], deduction: 0 },
  },
  NV: { name: 'Nevada', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  NY: {
    name: 'New York',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 852500, rate: 0.04 },
      { min: 852500, max: 1172500, rate: 0.045 },
      { min: 1172500, max: 1372500, rate: 0.0525 },
      { min: 1372500, max: 2157150, rate: 0.055 },
      { min: 2157150, max: 500000000, rate: 0.06 },
      { min: 500000000, max: 2500000000, rate: 0.0685 },
      { min: 2500000000, max: Infinity, rate: 0.109 },
    ], deduction: 800000 },
    marriedJoint: { brackets: [
      { min: 0, max: 852500, rate: 0.04 },
      { min: 852500, max: 1172500, rate: 0.045 },
      { min: 1172500, max: 1372500, rate: 0.0525 },
      { min: 1372500, max: 2157150, rate: 0.055 },
      { min: 2157150, max: 500000000, rate: 0.06 },
      { min: 500000000, max: 2500000000, rate: 0.0685 },
      { min: 2500000000, max: Infinity, rate: 0.109 },
    ], deduction: 800000 },
  },
  OH: {
    name: 'Ohio',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 2600000, rate: 0.0 },
      { min: 2600000, max: 4600000, rate: 0.0275 },
      { min: 4600000, max: 9200000, rate: 0.03 },
      { min: 9200000, max: Infinity, rate: 0.035 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 2600000, rate: 0.0 },
      { min: 2600000, max: 4600000, rate: 0.0275 },
      { min: 4600000, max: 9200000, rate: 0.03 },
      { min: 9200000, max: Infinity, rate: 0.035 },
    ], deduction: 0 },
  },
  OK: {
    name: 'Oklahoma',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 100000, rate: 0.0025 },
      { min: 100000, max: 250000, rate: 0.0075 },
      { min: 250000, max: 375000, rate: 0.0175 },
      { min: 375000, max: 475000, rate: 0.0275 },
      { min: 475000, max: 750000, rate: 0.0375 },
      { min: 750000, max: Infinity, rate: 0.0475 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 100000, rate: 0.0025 },
      { min: 100000, max: 250000, rate: 0.0075 },
      { min: 250000, max: 375000, rate: 0.0175 },
      { min: 375000, max: 475000, rate: 0.0275 },
      { min: 475000, max: 750000, rate: 0.0375 },
      { min: 750000, max: Infinity, rate: 0.0475 },
    ], deduction: 0 },
  },
  OR: {
    name: 'Oregon',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 410000, rate: 0.0475 },
      { min: 410000, max: 1030000, rate: 0.0675 },
      { min: 1030000, max: 12500000, rate: 0.0875 },
      { min: 12500000, max: Infinity, rate: 0.099 },
    ], deduction: 260000 },
    marriedJoint: { brackets: [
      { min: 0, max: 410000, rate: 0.0475 },
      { min: 410000, max: 1030000, rate: 0.0675 },
      { min: 1030000, max: 12500000, rate: 0.0875 },
      { min: 12500000, max: Infinity, rate: 0.099 },
    ], deduction: 260000 },
  },
  PA: {
    name: 'Pennsylvania',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0307 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0307 },
    ], deduction: 0 },
  },
  RI: {
    name: 'Rhode Island',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 7315000, rate: 0.0375 },
      { min: 7315000, max: 16645000, rate: 0.0475 },
      { min: 16645000, max: Infinity, rate: 0.0599 },
    ], deduction: 1025000 },
    marriedJoint: { brackets: [
      { min: 0, max: 7315000, rate: 0.0375 },
      { min: 7315000, max: 16645000, rate: 0.0475 },
      { min: 16645000, max: Infinity, rate: 0.0599 },
    ], deduction: 1025000 },
  },
  SC: {
    name: 'South Carolina',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 322000, rate: 0.0 },
      { min: 322000, max: 1631000, rate: 0.03 },
      { min: 1631000, max: Infinity, rate: 0.064 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 322000, rate: 0.0 },
      { min: 322000, max: 1631000, rate: 0.03 },
      { min: 1631000, max: Infinity, rate: 0.064 },
    ], deduction: 0 },
  },
  SD: { name: 'South Dakota', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  TN: { name: 'Tennessee', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  TX: { name: 'Texas', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  UT: {
    name: 'Utah',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0465 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0465 },
    ], deduction: 0 },
  },
  VA: {
    name: 'Virginia',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 300000, rate: 0.02 },
      { min: 300000, max: 500000, rate: 0.03 },
      { min: 500000, max: 1700000, rate: 0.05 },
      { min: 1700000, max: Infinity, rate: 0.0575 },
    ], deduction: 800000 },
    marriedJoint: { brackets: [
      { min: 0, max: 300000, rate: 0.02 },
      { min: 300000, max: 500000, rate: 0.03 },
      { min: 500000, max: 1700000, rate: 0.05 },
      { min: 1700000, max: Infinity, rate: 0.0575 },
    ], deduction: 800000 },
  },
  VT: {
    name: 'Vermont',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 4525000, rate: 0.0335 },
      { min: 4525000, max: 10975000, rate: 0.066 },
      { min: 10975000, max: 22900000, rate: 0.076 },
      { min: 22900000, max: Infinity, rate: 0.0875 },
    ], deduction: 699000 },
    marriedJoint: { brackets: [
      { min: 0, max: 4525000, rate: 0.0335 },
      { min: 4525000, max: 10975000, rate: 0.066 },
      { min: 10975000, max: 22900000, rate: 0.076 },
      { min: 22900000, max: Infinity, rate: 0.0875 },
    ], deduction: 699000 },
  },
  WA: { name: 'Washington', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  WI: {
    name: 'Wisconsin',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1398000, rate: 0.035 },
      { min: 1398000, max: 2796000, rate: 0.044 },
      { min: 2796000, max: 30906000, rate: 0.053 },
      { min: 30906000, max: Infinity, rate: 0.0765 },
    ], deduction: 1324000 },
    marriedJoint: { brackets: [
      { min: 0, max: 1398000, rate: 0.035 },
      { min: 1398000, max: 2796000, rate: 0.044 },
      { min: 2796000, max: 30906000, rate: 0.053 },
      { min: 30906000, max: Infinity, rate: 0.0765 },
    ], deduction: 1324000 },
  },
  WV: {
    name: 'West Virginia',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1000000, rate: 0.0236 },
      { min: 1000000, max: 2500000, rate: 0.0315 },
      { min: 2500000, max: 4000000, rate: 0.0354 },
      { min: 4000000, max: 6000000, rate: 0.0472 },
      { min: 6000000, max: Infinity, rate: 0.055 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 1000000, rate: 0.0236 },
      { min: 1000000, max: 2500000, rate: 0.0315 },
      { min: 2500000, max: 4000000, rate: 0.0354 },
      { min: 4000000, max: 6000000, rate: 0.0472 },
      { min: 6000000, max: Infinity, rate: 0.055 },
    ], deduction: 0 },
  },
  WY: { name: 'Wyoming', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
};

/**
 * Get state tax configuration.
 */
export function getStateTaxConfig(stateCode: string): StateTaxConfig | undefined {
  return STATE_TAX_DATA[stateCode.toUpperCase()];
}

/**
 * Get the schedule that applies to a filer, or null if the state has no
 * income tax. Thresholds are indexed by `inflationRate` per year for tax
 * years after STATE_TAX_YEAR.
 */
export function getStateTaxSchedule(
  stateCode: string,
  filingStatus: FilingStatus,
  taxYear: number = STATE_TAX_YEAR,
  inflationRate: Rate = 0
): StateTaxSchedule | null {
  const config = getStateTaxConfig(stateCode);
  if (!config?.hasIncomeTax) return null;

  const schedule = filingStatus === 'married_joint' ? config.marriedJoint : config.single;
  if (taxYear <= STATE_TAX_YEAR || inflationRate === 0) return schedule;

  const factor = Math.pow(1 + inflationRate, taxYear - STATE_TAX_YEAR);
  const scale = (amount: Cents): Cents => Math.round(amount * factor);
  return {
    brackets: schedule.brackets.map((b) => ({
      min: scale(b.min),
      max: b.max === Infinity ? Infinity : scale(b.max),
      rate: b.rate,
    })),
    deduction: scale(schedule.deduction),
  };
}

/**
 * Check if a state has income tax.
 */
export function stateHasIncomeTax(stateCode: string): boolean {
  const config = getStateTaxConfig(stateCode);
  return config?.hasIncomeTax ?? false;
}

/**
 * Get list of states with no income tax.
 */
export function getNoIncomeTaxStates(): string[] {
  return Object.entries(STATE_TAX_DATA)
    .filter(([_, config]) => !config.hasIncomeTax)
    .map(([code, _]) => code);
}

/**
 * Get list of flat tax states.
 */
export function getFlatTaxStates(): string[] {
  return Object.entries(STATE_TAX_DATA)
    .filter(([_, config]) => config.type === 'flat')
    .map(([code, _]) => code);
}

/**
 * Get all state codes.
 */
export function getAllStateCodes(): string[] {
  return Object.keys(STATE_TAX_DATA);
}
