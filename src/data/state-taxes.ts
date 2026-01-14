/**
 * State Tax Data (2024)
 *
 * State income tax rates and brackets.
 * Simplified - uses flat rates or top marginal rates for progressive states.
 */

import type { Cents, Rate } from '@models/common';

/**
 * State tax configuration.
 */
export interface StateTaxConfig {
  /** State name */
  name: string;
  /** Whether the state has income tax */
  hasIncomeTax: boolean;
  /** Tax type: none, flat, or progressive */
  type: 'none' | 'flat' | 'progressive';
  /** Flat rate (for flat tax states) or top marginal rate (for progressive) */
  rate: Rate;
  /** Standard deduction (if applicable), in cents */
  standardDeduction: Cents;
}

/**
 * State tax data by state code.
 * Rates are simplified - using flat rate or top marginal rate.
 */
export const STATE_TAX_DATA: Record<string, StateTaxConfig> = {
  // No income tax states
  AK: { name: 'Alaska', hasIncomeTax: false, type: 'none', rate: 0, standardDeduction: 0 },
  FL: { name: 'Florida', hasIncomeTax: false, type: 'none', rate: 0, standardDeduction: 0 },
  NV: { name: 'Nevada', hasIncomeTax: false, type: 'none', rate: 0, standardDeduction: 0 },
  SD: { name: 'South Dakota', hasIncomeTax: false, type: 'none', rate: 0, standardDeduction: 0 },
  TX: { name: 'Texas', hasIncomeTax: false, type: 'none', rate: 0, standardDeduction: 0 },
  WA: { name: 'Washington', hasIncomeTax: false, type: 'none', rate: 0, standardDeduction: 0 },
  WY: { name: 'Wyoming', hasIncomeTax: false, type: 'none', rate: 0, standardDeduction: 0 },
  TN: { name: 'Tennessee', hasIncomeTax: false, type: 'none', rate: 0, standardDeduction: 0 },
  NH: { name: 'New Hampshire', hasIncomeTax: false, type: 'none', rate: 0, standardDeduction: 0 },

  // Flat tax states
  CO: { name: 'Colorado', hasIncomeTax: true, type: 'flat', rate: 0.044, standardDeduction: 0 },
  IL: { name: 'Illinois', hasIncomeTax: true, type: 'flat', rate: 0.0495, standardDeduction: 0 },
  IN: { name: 'Indiana', hasIncomeTax: true, type: 'flat', rate: 0.0305, standardDeduction: 0 },
  KY: { name: 'Kentucky', hasIncomeTax: true, type: 'flat', rate: 0.04, standardDeduction: 296000 },
  MA: { name: 'Massachusetts', hasIncomeTax: true, type: 'flat', rate: 0.05, standardDeduction: 0 },
  MI: { name: 'Michigan', hasIncomeTax: true, type: 'flat', rate: 0.0425, standardDeduction: 0 },
  NC: { name: 'North Carolina', hasIncomeTax: true, type: 'flat', rate: 0.0525, standardDeduction: 1275000 },
  PA: { name: 'Pennsylvania', hasIncomeTax: true, type: 'flat', rate: 0.0307, standardDeduction: 0 },
  UT: { name: 'Utah', hasIncomeTax: true, type: 'flat', rate: 0.0465, standardDeduction: 0 },

  // Progressive tax states (using top marginal rate for simplicity)
  AL: { name: 'Alabama', hasIncomeTax: true, type: 'progressive', rate: 0.05, standardDeduction: 300000 },
  AZ: { name: 'Arizona', hasIncomeTax: true, type: 'progressive', rate: 0.025, standardDeduction: 1413600 },
  AR: { name: 'Arkansas', hasIncomeTax: true, type: 'progressive', rate: 0.044, standardDeduction: 246000 },
  CA: { name: 'California', hasIncomeTax: true, type: 'progressive', rate: 0.133, standardDeduction: 545600 },
  CT: { name: 'Connecticut', hasIncomeTax: true, type: 'progressive', rate: 0.0699, standardDeduction: 0 },
  DE: { name: 'Delaware', hasIncomeTax: true, type: 'progressive', rate: 0.066, standardDeduction: 330000 },
  DC: { name: 'District of Columbia', hasIncomeTax: true, type: 'progressive', rate: 0.1075, standardDeduction: 0 },
  GA: { name: 'Georgia', hasIncomeTax: true, type: 'progressive', rate: 0.0549, standardDeduction: 1240000 },
  HI: { name: 'Hawaii', hasIncomeTax: true, type: 'progressive', rate: 0.11, standardDeduction: 248000 },
  ID: { name: 'Idaho', hasIncomeTax: true, type: 'progressive', rate: 0.058, standardDeduction: 1460000 },
  IA: { name: 'Iowa', hasIncomeTax: true, type: 'progressive', rate: 0.057, standardDeduction: 0 },
  KS: { name: 'Kansas', hasIncomeTax: true, type: 'progressive', rate: 0.057, standardDeduction: 300000 },
  LA: { name: 'Louisiana', hasIncomeTax: true, type: 'progressive', rate: 0.0425, standardDeduction: 0 },
  ME: { name: 'Maine', hasIncomeTax: true, type: 'progressive', rate: 0.0715, standardDeduction: 1410000 },
  MD: { name: 'Maryland', hasIncomeTax: true, type: 'progressive', rate: 0.0575, standardDeduction: 265000 },
  MN: { name: 'Minnesota', hasIncomeTax: true, type: 'progressive', rate: 0.0985, standardDeduction: 1460000 },
  MS: { name: 'Mississippi', hasIncomeTax: true, type: 'progressive', rate: 0.05, standardDeduction: 0 },
  MO: { name: 'Missouri', hasIncomeTax: true, type: 'progressive', rate: 0.048, standardDeduction: 0 },
  MT: { name: 'Montana', hasIncomeTax: true, type: 'progressive', rate: 0.059, standardDeduction: 565000 },
  NE: { name: 'Nebraska', hasIncomeTax: true, type: 'progressive', rate: 0.0584, standardDeduction: 0 },
  NJ: { name: 'New Jersey', hasIncomeTax: true, type: 'progressive', rate: 0.1075, standardDeduction: 0 },
  NM: { name: 'New Mexico', hasIncomeTax: true, type: 'progressive', rate: 0.059, standardDeduction: 0 },
  NY: { name: 'New York', hasIncomeTax: true, type: 'progressive', rate: 0.109, standardDeduction: 800000 },
  ND: { name: 'North Dakota', hasIncomeTax: true, type: 'progressive', rate: 0.029, standardDeduction: 0 },
  OH: { name: 'Ohio', hasIncomeTax: true, type: 'progressive', rate: 0.035, standardDeduction: 0 },
  OK: { name: 'Oklahoma', hasIncomeTax: true, type: 'progressive', rate: 0.0475, standardDeduction: 0 },
  OR: { name: 'Oregon', hasIncomeTax: true, type: 'progressive', rate: 0.099, standardDeduction: 260000 },
  RI: { name: 'Rhode Island', hasIncomeTax: true, type: 'progressive', rate: 0.0599, standardDeduction: 1025000 },
  SC: { name: 'South Carolina', hasIncomeTax: true, type: 'progressive', rate: 0.064, standardDeduction: 0 },
  VT: { name: 'Vermont', hasIncomeTax: true, type: 'progressive', rate: 0.0875, standardDeduction: 699000 },
  VA: { name: 'Virginia', hasIncomeTax: true, type: 'progressive', rate: 0.0575, standardDeduction: 800000 },
  WV: { name: 'West Virginia', hasIncomeTax: true, type: 'progressive', rate: 0.055, standardDeduction: 0 },
  WI: { name: 'Wisconsin', hasIncomeTax: true, type: 'progressive', rate: 0.0765, standardDeduction: 1324000 },
};

/**
 * Get state tax configuration.
 */
export function getStateTaxConfig(stateCode: string): StateTaxConfig | undefined {
  return STATE_TAX_DATA[stateCode.toUpperCase()];
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
