/**
 * State Income Tax Data
 *
 * Single and married-filing-jointly schedules for all 50 states + DC.
 * Sources: Tax Foundation's annual state bracket tables, state revenue
 * department publications and enacted 2026 legislation (see per-state notes).
 * Amounts are for tax year 2026 unless noted.
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
export const STATE_TAX_YEAR = 2026;

const NO_TAX: StateTaxSchedule = { brackets: [], deduction: 0 };

/**
 * State tax data by state code. Amounts in cents.
 */
export const STATE_TAX_DATA: Record<string, StateTaxConfig> = {
  AK: { name: 'Alaska', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  // Rates/brackets fixed in statute (MFJ thresholds doubled). Deduction = standard deduction at
  // middle income ($2,500 single / $5,000 MFJ; maximums $3,000/$8,500 phase down between AGI
  // $23,500 and $33,000) + personal exemption $1,500/$3,000. AL also allows a deduction for federal
  // income tax paid (not modeled); local occupational taxes ignored. Sources: AL DOR, TaxAct.
  AL: {
    name: 'Alabama',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 50000, rate: 0.02 },
      { min: 50000, max: 300000, rate: 0.04 },
      { min: 300000, max: Infinity, rate: 0.05 },
    ], deduction: 400000 },
    marriedJoint: { brackets: [
      { min: 0, max: 100000, rate: 0.02 },
      { min: 100000, max: 600000, rate: 0.04 },
      { min: 600000, max: Infinity, rate: 0.05 },
    ], deduction: 800000 },
  },
  // Top rate cut 3.9% -> 3.7% retroactive to 1/1/2026 (May 2026 special session, HB 1001/SB 1).
  // Brackets are the table for net income <= $94,700 (same for all filing statuses); above $94,700
  // a separate table applies (2% on first $4,700, 3.7% above), so these brackets understate tax by
  // roughly $290 for high earners. Standard deduction $2,470 per person per DFA 2026 withholding
  // formula. $29 personal tax credit not included. Sources: AEDC, Arkansas Advocate, AR DFA.
  AR: {
    name: 'Arkansas',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 560000, rate: 0.0 },
      { min: 560000, max: 1120000, rate: 0.02 },
      { min: 1120000, max: 1600000, rate: 0.03 },
      { min: 1600000, max: 2640000, rate: 0.034 },
      { min: 2640000, max: Infinity, rate: 0.037 },
    ], deduction: 247000 },
    marriedJoint: { brackets: [
      { min: 0, max: 560000, rate: 0.0 },
      { min: 560000, max: 1120000, rate: 0.02 },
      { min: 1120000, max: 1600000, rate: 0.03 },
      { min: 1600000, max: 2640000, rate: 0.034 },
      { min: 2640000, max: Infinity, rate: 0.037 },
    ], deduction: 494000 },
  },
  // Flat 2.5%. HB 4168 (signed 6/13/2026) conformed AZ to OBBBA: standard deduction base
  // $15,750/$31,500 for TY2025, indexed the same way as the federal amount, so $16,100/$32,200 for
  // 2026. No personal exemption for filers (dependent credit instead). Sources: azleg.gov HB4168
  // summary, Forvis Mazars.
  AZ: {
    name: 'Arizona',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.025 },
    ], deduction: 1610000 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.025 },
    ], deduction: 3220000 },
  },
  // Thresholds = 2025 FTB schedules x 1.034 (FTB-announced 3.4% CCPI inflation rate for 2026),
  // rounded; MFJ = 2x single. FTB publishes official 2026 schedules in late Dec 2026, so thresholds
  // could differ by a dollar or two. Includes 1% Mental Health Services Tax on taxable income over
  // $1M (same threshold for MFJ) as a bracket. Standard deduction $5,900/$11,800 (FTB Tax News).
  // Personal exemption credit (~$158/person) is a credit, not included.
  CA: {
    name: 'California',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1145600, rate: 0.01 },
      { min: 1145600, max: 2715700, rate: 0.02 },
      { min: 2715700, max: 4286100, rate: 0.04 },
      { min: 4286100, max: 5949800, rate: 0.06 },
      { min: 5949800, max: 7519700, rate: 0.08 },
      { min: 7519700, max: 38410900, rate: 0.093 },
      { min: 38410900, max: 46092700, rate: 0.103 },
      { min: 46092700, max: 76821300, rate: 0.113 },
      { min: 76821300, max: 100000000, rate: 0.123 },
      { min: 100000000, max: Infinity, rate: 0.133 },
    ], deduction: 590000 },
    marriedJoint: { brackets: [
      { min: 0, max: 2291200, rate: 0.01 },
      { min: 2291200, max: 5431400, rate: 0.02 },
      { min: 5431400, max: 8572200, rate: 0.04 },
      { min: 8572200, max: 11899600, rate: 0.06 },
      { min: 11899600, max: 15039400, rate: 0.08 },
      { min: 15039400, max: 76821800, rate: 0.093 },
      { min: 76821800, max: 92185400, rate: 0.103 },
      { min: 92185400, max: 100000000, rate: 0.113 },
      { min: 100000000, max: 153642600, rate: 0.123 },
      { min: 153642600, max: Infinity, rate: 0.133 },
    ], deduction: 1180000 },
  },
  // Flat 4.4% on federal taxable income, so the federal standard deduction applies. TABOR temporary
  // rate cuts (4.25% in 2025) are not forecast for 2026. High-income deduction addback (AGI >
  // $300k) not modeled.
  CO: {
    name: 'Colorado',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.044 },
    ], deduction: 1610000 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.044 },
    ], deduction: 3220000 },
  },
  // Unchanged for 2026. Personal exemption ($15,000 single / $24,000 MFJ) phases out $1,000 per
  // $1,000 of AGI above $30,000/$48,000 and is gone by ~$44,000/$71,000, so deduction = 0 for a
  // middle-income filer. Low-income personal tax credit and high-income recapture of the lower
  // brackets not modeled.
  CT: {
    name: 'Connecticut',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1000000, rate: 0.02 },
      { min: 1000000, max: 5000000, rate: 0.045 },
      { min: 5000000, max: 10000000, rate: 0.055 },
      { min: 10000000, max: 20000000, rate: 0.06 },
      { min: 20000000, max: 25000000, rate: 0.065 },
      { min: 25000000, max: 50000000, rate: 0.069 },
      { min: 50000000, max: Infinity, rate: 0.0699 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: 2000000, rate: 0.02 },
      { min: 2000000, max: 10000000, rate: 0.045 },
      { min: 10000000, max: 20000000, rate: 0.055 },
      { min: 20000000, max: 40000000, rate: 0.06 },
      { min: 40000000, max: 50000000, rate: 0.065 },
      { min: 50000000, max: 100000000, rate: 0.069 },
      { min: 100000000, max: Infinity, rate: 0.0699 },
    ], deduction: 0 },
  },
  // Brackets unchanged (same for all statuses). Deduction = federal 2026 standard deduction, per
  // OTR 2026 D-40ES (Apr 2026), after Congress disapproved DC's OBBBA decoupling act (H.J.Res. 142,
  // Feb 2026). UNCERTAIN: DC used $15,000/$30,000 for TY2025, and the FY2027 Budget Support Act
  // (passed July 2026) proposed decoupling TY2026 from the higher OBBBA amount again (TCJA level +
  // COLA).
  DC: {
    name: 'District of Columbia',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1000000, rate: 0.04 },
      { min: 1000000, max: 4000000, rate: 0.06 },
      { min: 4000000, max: 6000000, rate: 0.065 },
      { min: 6000000, max: 25000000, rate: 0.085 },
      { min: 25000000, max: 50000000, rate: 0.0925 },
      { min: 50000000, max: 100000000, rate: 0.0975 },
      { min: 100000000, max: Infinity, rate: 0.1075 },
    ], deduction: 1610000 },
    marriedJoint: { brackets: [
      { min: 0, max: 1000000, rate: 0.04 },
      { min: 1000000, max: 4000000, rate: 0.06 },
      { min: 4000000, max: 6000000, rate: 0.065 },
      { min: 6000000, max: 25000000, rate: 0.085 },
      { min: 25000000, max: 50000000, rate: 0.0925 },
      { min: 50000000, max: 100000000, rate: 0.0975 },
      { min: 100000000, max: Infinity, rate: 0.1075 },
    ], deduction: 3220000 },
  },
  // Unchanged for 2026 (same brackets for all statuses). Standard deduction $3,250/$6,500. $110
  // personal credit per person is a credit, not included. Wilmington city wage tax ignored.
  DE: {
    name: 'Delaware',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 200000, rate: 0.0 },
      { min: 200000, max: 500000, rate: 0.022 },
      { min: 500000, max: 1000000, rate: 0.039 },
      { min: 1000000, max: 2000000, rate: 0.048 },
      { min: 2000000, max: 2500000, rate: 0.052 },
      { min: 2500000, max: 6000000, rate: 0.0555 },
      { min: 6000000, max: Infinity, rate: 0.066 },
    ], deduction: 325000 },
    marriedJoint: { brackets: [
      { min: 0, max: 200000, rate: 0.0 },
      { min: 200000, max: 500000, rate: 0.022 },
      { min: 500000, max: 1000000, rate: 0.039 },
      { min: 1000000, max: 2000000, rate: 0.048 },
      { min: 2000000, max: 2500000, rate: 0.052 },
      { min: 2500000, max: 6000000, rate: 0.0555 },
      { min: 6000000, max: Infinity, rate: 0.066 },
    ], deduction: 650000 },
  },
  FL: { name: 'Florida', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  // HB 463 (signed 5/11/2026, retroactive to 1/1/2026): flat 4.99% (from 5.19%); standard exemption
  // raised to $15,000 single / $30,000 MFJ (from $12,000/$24,000). Further 0.125-pt annual cuts to
  // 3.99% and exemption increases are contingent on revenue triggers. Sources: BDO, Paylocity, GA
  // HB 463.
  GA: {
    name: 'Georgia',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0499 },
    ], deduction: 1500000 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0499 },
    ], deduction: 3000000 },
  },
  // Act 46 (2024): 2026 uses the same bracket schedule as 2025 (next widening in 2027); standard
  // deduction steps up to $8,000/$16,000 in 2026; personal exemption $1,144 per person. Act 24
  // (2026) adds a 13% top bracket starting TY2027, not 2026. Sources: HI DOTAX rate schedules and
  // Announcement 2024-03.
  HI: {
    name: 'Hawaii',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 960000, rate: 0.014 },
      { min: 960000, max: 1440000, rate: 0.032 },
      { min: 1440000, max: 1920000, rate: 0.055 },
      { min: 1920000, max: 2400000, rate: 0.064 },
      { min: 2400000, max: 3600000, rate: 0.068 },
      { min: 3600000, max: 4800000, rate: 0.072 },
      { min: 4800000, max: 12500000, rate: 0.076 },
      { min: 12500000, max: 17500000, rate: 0.079 },
      { min: 17500000, max: 22500000, rate: 0.0825 },
      { min: 22500000, max: 27500000, rate: 0.09 },
      { min: 27500000, max: 32500000, rate: 0.1 },
      { min: 32500000, max: Infinity, rate: 0.11 },
    ], deduction: 914400 },
    marriedJoint: { brackets: [
      { min: 0, max: 1920000, rate: 0.014 },
      { min: 1920000, max: 2880000, rate: 0.032 },
      { min: 2880000, max: 3840000, rate: 0.055 },
      { min: 3840000, max: 4800000, rate: 0.064 },
      { min: 4800000, max: 7200000, rate: 0.068 },
      { min: 7200000, max: 9600000, rate: 0.072 },
      { min: 9600000, max: 25000000, rate: 0.076 },
      { min: 25000000, max: 35000000, rate: 0.079 },
      { min: 35000000, max: 45000000, rate: 0.0825 },
      { min: 45000000, max: 55000000, rate: 0.09 },
      { min: 55000000, max: 65000000, rate: 0.1 },
      { min: 65000000, max: Infinity, rate: 0.11 },
    ], deduction: 1828800 },
  },
  // Flat 3.8% (SF 2442). Starts from federal taxable income, so the federal standard deduction
  // applies. $40 personal exemption credit not included.
  IA: {
    name: 'Iowa',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.038 },
    ], deduction: 1610000 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.038 },
    ], deduction: 3220000 },
  },
  // Effectively flat 5.3% (HB 40, 2025) above a 0% band; HB 589 (2026, would have restored 5.695%
  // for 2026) died. The 0% band is the 2025 amount ($4,811/$9,622); it is inflation-indexed and the
  // 2026 figure was not found (will be slightly higher). HB 559 (Feb 2026) conformed to OBBBA, so
  // the federal standard deduction applies.
  ID: {
    name: 'Idaho',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 481100, rate: 0.0 },
      { min: 481100, max: Infinity, rate: 0.053 },
    ], deduction: 1610000 },
    marriedJoint: { brackets: [
      { min: 0, max: 962200, rate: 0.0 },
      { min: 962200, max: Infinity, rate: 0.053 },
    ], deduction: 3220000 },
  },
  // Flat 4.95%. Personal exemption $2,925 per person for 2026 (2025: $2,850); disallowed if AGI >
  // $250k single / $500k MFJ. No standard deduction.
  IL: {
    name: 'Illinois',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0495 },
    ], deduction: 292500 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0495 },
    ], deduction: 585000 },
  },
  // Flat 2.95% for 2026 (from 3.0%; 2.9% scheduled for 2027). $1,000 personal exemption per person;
  // no standard deduction. County local income taxes (~0.5-3%) ignored.
  IN: {
    name: 'Indiana',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0295 },
    ], deduction: 100000 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0295 },
    ], deduction: 200000 },
  },
  // Two brackets (SB 1, 2024); the SB 269 rate-cut trigger did not fire for 2026. Standard
  // deduction $3,605/$8,240 + personal exemption $9,160/$18,320. HB 2629 (2026) proposed raising
  // the standard deduction to $3,805/$8,640 but no evidence it was enacted.
  KS: {
    name: 'Kansas',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 2300000, rate: 0.052 },
      { min: 2300000, max: Infinity, rate: 0.0558 },
    ], deduction: 1276500 },
    marriedJoint: { brackets: [
      { min: 0, max: 4600000, rate: 0.052 },
      { min: 4600000, max: Infinity, rate: 0.0558 },
    ], deduction: 2656000 },
  },
  // Flat 3.5% for 2026 (from 4.0%). Standard deduction $3,360 (KY DOR 2026). MFJ deduction assumes
  // 2 x $3,360, which couples get by filing "married filing separately on a combined return" (same
  // flat rate); a single joint return may get only one. Local occupational taxes ignored.
  KY: {
    name: 'Kentucky',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.035 },
    ], deduction: 336000 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.035 },
    ], deduction: 672000 },
  },
  // Flat 3% (2024 reform). Combined personal exemption-standard deduction is inflation-indexed
  // starting 2026: $12,875/$25,750 (2025: $12,500/$25,000).
  LA: {
    name: 'Louisiana',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.03 },
    ], deduction: 1287500 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.03 },
    ], deduction: 2575000 },
  },
  // 5% plus 4% surtax on taxable income over $1,107,750 (2026 threshold; same for joint returns).
  // Personal exemption $4,400/$8,800; no standard deduction. 8.5% short-term capital gains rate
  // ignored.
  MA: {
    name: 'Massachusetts',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 110775000, rate: 0.05 },
      { min: 110775000, max: Infinity, rate: 0.09 },
    ], deduction: 440000 },
    marriedJoint: { brackets: [
      { min: 0, max: 110775000, rate: 0.05 },
      { min: 110775000, max: Infinity, rate: 0.09 },
    ], deduction: 880000 },
  },
  // 2025 BRFA added 6.25%/6.5% brackets. Flat standard deduction $3,400 single for 2026
  // (Comptroller 2026 withholding guide); MFJ assumed $6,800 (2x single; indexing rounds down to
  // $50 so could be $6,850). Personal exemption $3,200/person (phases out above $100k single /
  // $150k MFJ FAGI). County income tax (2.25-3.3%) and 2% capital-gains surtax ignored.
  MD: {
    name: 'Maryland',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 100000, rate: 0.02 },
      { min: 100000, max: 200000, rate: 0.03 },
      { min: 200000, max: 300000, rate: 0.04 },
      { min: 300000, max: 10000000, rate: 0.0475 },
      { min: 10000000, max: 12500000, rate: 0.05 },
      { min: 12500000, max: 15000000, rate: 0.0525 },
      { min: 15000000, max: 25000000, rate: 0.055 },
      { min: 25000000, max: 50000000, rate: 0.0575 },
      { min: 50000000, max: 100000000, rate: 0.0625 },
      { min: 100000000, max: Infinity, rate: 0.065 },
    ], deduction: 660000 },
    marriedJoint: { brackets: [
      { min: 0, max: 100000, rate: 0.02 },
      { min: 100000, max: 200000, rate: 0.03 },
      { min: 200000, max: 300000, rate: 0.04 },
      { min: 300000, max: 15000000, rate: 0.0475 },
      { min: 15000000, max: 17500000, rate: 0.05 },
      { min: 17500000, max: 22500000, rate: 0.0525 },
      { min: 22500000, max: 30000000, rate: 0.055 },
      { min: 30000000, max: 60000000, rate: 0.0575 },
      { min: 60000000, max: 120000000, rate: 0.0625 },
      { min: 120000000, max: Infinity, rate: 0.065 },
    ], deduction: 1320000 },
  },
  // 2026 brackets, standard deduction ($15,300/$30,600) and personal exemption ($5,300/person) per
  // Maine Revenue Services. Includes new 2% surcharge (LD 2212, signed 4/9/2026, retroactive to
  // 1/1/2026) on income over $1M single / $1.5M MFJ. Standard deduction and exemption phase out at
  // higher incomes (not modeled).
  ME: {
    name: 'Maine',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 2740000, rate: 0.058 },
      { min: 2740000, max: 6485000, rate: 0.0675 },
      { min: 6485000, max: 100000000, rate: 0.0715 },
      { min: 100000000, max: Infinity, rate: 0.0915 },
    ], deduction: 2060000 },
    marriedJoint: { brackets: [
      { min: 0, max: 5485000, rate: 0.058 },
      { min: 5485000, max: 12975000, rate: 0.0675 },
      { min: 12975000, max: 150000000, rate: 0.0715 },
      { min: 150000000, max: Infinity, rate: 0.0915 },
    ], deduction: 4120000 },
  },
  // Flat 4.25%. Personal exemption $5,900 per person for 2026 (2025: $5,800). City income taxes
  // ignored.
  MI: {
    name: 'Michigan',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0425 },
    ], deduction: 590000 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0425 },
    ], deduction: 1180000 },
  },
  // 2026 brackets and standard deduction per MN DOR (Dec 2025). Standard deduction $15,300/$30,600
  // (reduced at high AGI, not modeled). No personal exemption for filers (dependents only).
  MN: {
    name: 'Minnesota',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 3331000, rate: 0.0535 },
      { min: 3331000, max: 10943000, rate: 0.068 },
      { min: 10943000, max: 20315000, rate: 0.0785 },
      { min: 20315000, max: Infinity, rate: 0.0985 },
    ], deduction: 1530000 },
    marriedJoint: { brackets: [
      { min: 0, max: 4870000, rate: 0.0535 },
      { min: 4870000, max: 19348000, rate: 0.068 },
      { min: 19348000, max: 33793000, rate: 0.0785 },
      { min: 33793000, max: Infinity, rate: 0.0985 },
    ], deduction: 3060000 },
  },
  // 2026 inflation-indexed brackets per MO DOR 2026 withholding formula (same for all statuses; top
  // 4.7% over $9,436). Federal standard deduction applies. Capped deduction for federal income tax
  // paid and Kansas City/St. Louis earnings taxes not modeled.
  MO: {
    name: 'Missouri',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 134800, rate: 0.0 },
      { min: 134800, max: 269600, rate: 0.02 },
      { min: 269600, max: 404400, rate: 0.025 },
      { min: 404400, max: 539200, rate: 0.03 },
      { min: 539200, max: 674000, rate: 0.035 },
      { min: 674000, max: 808800, rate: 0.04 },
      { min: 808800, max: 943600, rate: 0.045 },
      { min: 943600, max: Infinity, rate: 0.047 },
    ], deduction: 1610000 },
    marriedJoint: { brackets: [
      { min: 0, max: 134800, rate: 0.0 },
      { min: 134800, max: 269600, rate: 0.02 },
      { min: 269600, max: 404400, rate: 0.025 },
      { min: 404400, max: 539200, rate: 0.03 },
      { min: 539200, max: 674000, rate: 0.035 },
      { min: 674000, max: 808800, rate: 0.04 },
      { min: 808800, max: 943600, rate: 0.045 },
      { min: 943600, max: Infinity, rate: 0.047 },
    ], deduction: 3220000 },
  },
  // Effectively flat: 0% on first $10,000, 4.0% above (HB 1, 2025: 4.4% -> 4.0% for 2026). Standard
  // deduction $2,300/$4,600 + exemption $6,000/$12,000. MFJ zero band shown as $10,000 (Tax
  // Foundation convention); some sources say spouses on a combined return each get the $10,000 band
  // (not verified).
  MS: {
    name: 'Mississippi',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1000000, rate: 0.0 },
      { min: 1000000, max: Infinity, rate: 0.04 },
    ], deduction: 830000 },
    marriedJoint: { brackets: [
      { min: 0, max: 1000000, rate: 0.0 },
      { min: 1000000, max: Infinity, rate: 0.04 },
    ], deduction: 1660000 },
  },
  // HB 337 (2025): for 2026, 4.7% up to $47,500 single / $95,000 MFJ, 5.65% above (5.4% in 2027).
  // Starts from federal taxable income (rolling conformity), so the federal standard deduction
  // applies. Capital gains rates ignored.
  MT: {
    name: 'Montana',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 4750000, rate: 0.047 },
      { min: 4750000, max: Infinity, rate: 0.0565 },
    ], deduction: 1610000 },
    marriedJoint: { brackets: [
      { min: 0, max: 9500000, rate: 0.047 },
      { min: 9500000, max: Infinity, rate: 0.0565 },
    ], deduction: 3220000 },
  },
  // Flat 3.99% for 2026 (from 4.25%); further trigger-based cuts possible from 2027. Standard
  // deduction $12,750/$25,500.
  NC: {
    name: 'North Carolina',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0399 },
    ], deduction: 1275000 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0399 },
    ], deduction: 2550000 },
  },
  // 2026 inflation-indexed thresholds (0% band). Starts from federal taxable income, so the federal
  // standard deduction applies.
  ND: {
    name: 'North Dakota',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 4957500, rate: 0.0 },
      { min: 4957500, max: 25040000, rate: 0.0195 },
      { min: 25040000, max: Infinity, rate: 0.025 },
    ], deduction: 1610000 },
    marriedJoint: { brackets: [
      { min: 0, max: 8280000, rate: 0.0 },
      { min: 8280000, max: 30485000, rate: 0.0195 },
      { min: 30485000, max: Infinity, rate: 0.025 },
    ], deduction: 3220000 },
  },
  // LB 754: top rate 4.55% for 2026 (3.99% in 2027); the old 5.01% bracket merges into the top
  // rate. Indexed thresholds; sources differ slightly for MFJ ($8,250/$49,530 vs $8,260/$49,520).
  // Standard deduction $8,850/$17,700. Personal exemption is a credit (~$176/person), not included.
  NE: {
    name: 'Nebraska',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 413000, rate: 0.0246 },
      { min: 413000, max: 2476000, rate: 0.0351 },
      { min: 2476000, max: Infinity, rate: 0.0455 },
    ], deduction: 885000 },
    marriedJoint: { brackets: [
      { min: 0, max: 825000, rate: 0.0246 },
      { min: 825000, max: 4953000, rate: 0.0351 },
      { min: 4953000, max: Infinity, rate: 0.0455 },
    ], deduction: 1770000 },
  },
  NH: { name: 'New Hampshire', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  // Unchanged for 2026. $1,000 personal exemption per person; no standard deduction.
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
    ], deduction: 100000 },
    marriedJoint: { brackets: [
      { min: 0, max: 2000000, rate: 0.014 },
      { min: 2000000, max: 5000000, rate: 0.0175 },
      { min: 5000000, max: 7000000, rate: 0.0245 },
      { min: 7000000, max: 8000000, rate: 0.035 },
      { min: 8000000, max: 15000000, rate: 0.05525 },
      { min: 15000000, max: 50000000, rate: 0.0637 },
      { min: 50000000, max: 100000000, rate: 0.0897 },
      { min: 100000000, max: Infinity, rate: 0.1075 },
    ], deduction: 200000 },
  },
  // HB 252 (2024) brackets, effective 2025, unchanged for 2026. Federal standard deduction applies
  // (rolling conformity; SB 151 decoupling is business-only and starts 2027). Low-income exemption
  // not included.
  NM: {
    name: 'New Mexico',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 550000, rate: 0.015 },
      { min: 550000, max: 1650000, rate: 0.032 },
      { min: 1650000, max: 3350000, rate: 0.043 },
      { min: 3350000, max: 6650000, rate: 0.047 },
      { min: 6650000, max: 21000000, rate: 0.049 },
      { min: 21000000, max: Infinity, rate: 0.059 },
    ], deduction: 1610000 },
    marriedJoint: { brackets: [
      { min: 0, max: 800000, rate: 0.015 },
      { min: 800000, max: 2500000, rate: 0.032 },
      { min: 2500000, max: 5000000, rate: 0.043 },
      { min: 5000000, max: 10000000, rate: 0.047 },
      { min: 10000000, max: 31500000, rate: 0.049 },
      { min: 31500000, max: Infinity, rate: 0.059 },
    ], deduction: 3220000 },
  },
  NV: { name: 'Nevada', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  // FY2026 budget middle-class cut: lower five rates reduced 0.1 pt for 2026 (another 0.1 pt in
  // 2027). Standard deduction $8,000/$16,050; no personal exemption for filers. High-income tax
  // benefit recapture and NYC/Yonkers taxes not modeled.
  NY: {
    name: 'New York',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 850000, rate: 0.039 },
      { min: 850000, max: 1170000, rate: 0.044 },
      { min: 1170000, max: 1390000, rate: 0.0515 },
      { min: 1390000, max: 8065000, rate: 0.054 },
      { min: 8065000, max: 21540000, rate: 0.059 },
      { min: 21540000, max: 107755000, rate: 0.0685 },
      { min: 107755000, max: 500000000, rate: 0.0965 },
      { min: 500000000, max: 2500000000, rate: 0.103 },
      { min: 2500000000, max: Infinity, rate: 0.109 },
    ], deduction: 800000 },
    marriedJoint: { brackets: [
      { min: 0, max: 1715000, rate: 0.039 },
      { min: 1715000, max: 2360000, rate: 0.044 },
      { min: 2360000, max: 2790000, rate: 0.0515 },
      { min: 2790000, max: 16155000, rate: 0.054 },
      { min: 16155000, max: 32320000, rate: 0.059 },
      { min: 32320000, max: 215535000, rate: 0.0685 },
      { min: 215535000, max: 500000000, rate: 0.0965 },
      { min: 500000000, max: 2500000000, rate: 0.103 },
      { min: 2500000000, max: Infinity, rate: 0.109 },
    ], deduction: 1605000 },
  },
  // HB 96 (2025): effectively flat 2.75% on income over $26,050 (same for all statuses; indexing
  // suspended 2025-2026). Personal exemption tiered by MAGI: $2,400 (<= $40k), $2,150 ($40k-$80k),
  // $1,900 (> $80k), none at $500k+; deduction uses $2,150 single (~$60k) and 2 x $1,900 MFJ
  // (~$120k). Exemption/joint-filing credits and municipal/school district income taxes ignored.
  OH: {
    name: 'Ohio',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 2605000, rate: 0.0 },
      { min: 2605000, max: Infinity, rate: 0.0275 },
    ], deduction: 215000 },
    marriedJoint: { brackets: [
      { min: 0, max: 2605000, rate: 0.0 },
      { min: 2605000, max: Infinity, rate: 0.0275 },
    ], deduction: 380000 },
  },
  // HB 2764 (2025): from 2026 brackets consolidated and top rate cut to 4.5% (from 4.75%); MFJ
  // thresholds doubled. Standard deduction $6,350/$12,700 + $1,000 exemption per person. Future
  // 0.25-pt trigger cuts.
  OK: {
    name: 'Oklahoma',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 375000, rate: 0.0 },
      { min: 375000, max: 490000, rate: 0.025 },
      { min: 490000, max: 720000, rate: 0.035 },
      { min: 720000, max: Infinity, rate: 0.045 },
    ], deduction: 735000 },
    marriedJoint: { brackets: [
      { min: 0, max: 750000, rate: 0.0 },
      { min: 750000, max: 980000, rate: 0.025 },
      { min: 980000, max: 1440000, rate: 0.035 },
      { min: 1440000, max: Infinity, rate: 0.045 },
    ], deduction: 1470000 },
  },
  // 2026 indexed brackets and standard deduction ($2,910/$5,820, per OR DOR 2026 withholding
  // formulas). Personal exemption credit ($263/person in 2026, phased out above $100k/$200k AGI) is
  // a credit, not included. Capped subtraction for federal income tax paid and Portland
  // Metro/Multnomah County taxes not modeled.
  OR: {
    name: 'Oregon',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 455000, rate: 0.0475 },
      { min: 455000, max: 1140000, rate: 0.0675 },
      { min: 1140000, max: 12500000, rate: 0.0875 },
      { min: 12500000, max: Infinity, rate: 0.099 },
    ], deduction: 291000 },
    marriedJoint: { brackets: [
      { min: 0, max: 910000, rate: 0.0475 },
      { min: 910000, max: 2280000, rate: 0.0675 },
      { min: 2280000, max: 25000000, rate: 0.0875 },
      { min: 25000000, max: Infinity, rate: 0.099 },
    ], deduction: 582000 },
  },
  // Flat 3.07%; no standard deduction or personal exemption (low-income tax forgiveness credit not
  // modeled). Local earned income taxes ignored.
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
  // 2026 indexed brackets (same for all statuses), standard deduction $11,200/$22,400, exemption
  // $5,250 per person; both phase out at high AGI (not modeled). Millionaire surtax enacted in 2026
  // (6.99% over $1M) starts TY2027, not 2026.
  RI: {
    name: 'Rhode Island',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 8205000, rate: 0.0375 },
      { min: 8205000, max: 18645000, rate: 0.0475 },
      { min: 18645000, max: Infinity, rate: 0.0599 },
    ], deduction: 1645000 },
    marriedJoint: { brackets: [
      { min: 0, max: 8205000, rate: 0.0375 },
      { min: 8205000, max: 18645000, rate: 0.0475 },
      { min: 18645000, max: Infinity, rate: 0.0599 },
    ], deduction: 3290000 },
  },
  // Act 110 (H.4216, signed 3/30/2026) for TY2026: 1.99% on first $30,000, 5.21% above, same for
  // all statuses (the old 0% band is gone). Federal standard deduction replaced by the SC Income
  // Adjusted Deduction: $15,000 single / $30,000 MFJ, phased out between AGI $40,000-$95,000
  // (single) and $80,000-$190,000 (MFJ), assumed linear. Deduction shown is the amount at
  // representative incomes ($60k single, $120k MFJ); full amounts are $15,000/$30,000.
  SC: {
    name: 'South Carolina',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 3000000, rate: 0.0199 },
      { min: 3000000, max: Infinity, rate: 0.0521 },
    ], deduction: 954500 },
    marriedJoint: { brackets: [
      { min: 0, max: 3000000, rate: 0.0199 },
      { min: 3000000, max: Infinity, rate: 0.0521 },
    ], deduction: 1909100 },
  },
  SD: { name: 'South Dakota', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  TN: { name: 'Tennessee', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  TX: { name: 'Texas', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  // Flat 4.45% (SB 60, signed 3/2026, retroactive to 1/1/2026; was 4.5%). Deduction 0: Utah's
  // taxpayer tax credit (6% of federal standard deduction + exemptions, phased out with income) is
  // a credit and not included.
  UT: {
    name: 'Utah',
    hasIncomeTax: true,
    type: 'flat',
    single: { brackets: [
      { min: 0, max: Infinity, rate: 0.0445 },
    ], deduction: 0 },
    marriedJoint: { brackets: [
      { min: 0, max: Infinity, rate: 0.0445 },
    ], deduction: 0 },
  },
  // Rates unchanged (same brackets for all statuses). Standard deduction $8,750/$17,500 (2026
  // budget extends it through 2028) + $930 exemption per person. Proposed new top brackets (HB 979)
  // would start 2027 at the earliest.
  VA: {
    name: 'Virginia',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 300000, rate: 0.02 },
      { min: 300000, max: 500000, rate: 0.03 },
      { min: 500000, max: 1700000, rate: 0.05 },
      { min: 1700000, max: Infinity, rate: 0.0575 },
    ], deduction: 968000 },
    marriedJoint: { brackets: [
      { min: 0, max: 300000, rate: 0.02 },
      { min: 300000, max: 500000, rate: 0.03 },
      { min: 500000, max: 1700000, rate: 0.05 },
      { min: 1700000, max: Infinity, rate: 0.0575 },
    ], deduction: 1936000 },
  },
  // 2025 values (2026 not yet published).
  // 2026 rate schedules and standard deduction not yet published (VT 2026 withholding tables still
  // use the 2025 brackets). Brackets and standard deduction ($7,650/$15,300) are TY2025; personal
  // exemption uses the 2026 amount, $5,400 per person (2025: $5,300).
  VT: {
    name: 'Vermont',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 4940000, rate: 0.0335 },
      { min: 4940000, max: 11970000, rate: 0.066 },
      { min: 11970000, max: 24970000, rate: 0.076 },
      { min: 24970000, max: Infinity, rate: 0.0875 },
    ], deduction: 1305000 },
    marriedJoint: { brackets: [
      { min: 0, max: 8250000, rate: 0.0335 },
      { min: 8250000, max: 19945000, rate: 0.066 },
      { min: 19945000, max: 30400000, rate: 0.076 },
      { min: 30400000, max: Infinity, rate: 0.0875 },
    ], deduction: 2610000 },
  },
  WA: { name: 'Washington', hasIncomeTax: false, type: 'none', single: NO_TAX, marriedJoint: NO_TAX },
  // 2026 indexed brackets (2025 Act 15 widened the 4.4% bracket). Sliding-scale standard deduction:
  // $13,960 single minus 12% of income over $20,119 (zero near $136,450); $25,840 MFJ minus 19.778%
  // of income over $29,039 (zero near $159,700). Deduction shown = sliding amount at representative
  // incomes ($60k single, $120k MFJ) + $700 exemption per person; at low incomes it is
  // $14,660/$27,240.
  WI: {
    name: 'Wisconsin',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1511000, rate: 0.035 },
      { min: 1511000, max: 5195000, rate: 0.044 },
      { min: 5195000, max: 33272000, rate: 0.053 },
      { min: 33272000, max: Infinity, rate: 0.0765 },
    ], deduction: 987400 },
    marriedJoint: { brackets: [
      { min: 0, max: 2015000, rate: 0.035 },
      { min: 2015000, max: 6926000, rate: 0.044 },
      { min: 6926000, max: 44363000, rate: 0.053 },
      { min: 44363000, max: Infinity, rate: 0.0765 },
    ], deduction: 925000 },
  },
  // SB 392 (signed 3/31/2026, retroactive to 1/1/2026) cut all rates about 5%:
  // 2.11/2.81/3.16/4.22/4.58% (same brackets for all statuses). $2,000 exemption per person; no
  // standard deduction.
  WV: {
    name: 'West Virginia',
    hasIncomeTax: true,
    type: 'progressive',
    single: { brackets: [
      { min: 0, max: 1000000, rate: 0.0211 },
      { min: 1000000, max: 2500000, rate: 0.0281 },
      { min: 2500000, max: 4000000, rate: 0.0316 },
      { min: 4000000, max: 6000000, rate: 0.0422 },
      { min: 6000000, max: Infinity, rate: 0.0458 },
    ], deduction: 200000 },
    marriedJoint: { brackets: [
      { min: 0, max: 1000000, rate: 0.0211 },
      { min: 1000000, max: 2500000, rate: 0.0281 },
      { min: 2500000, max: 4000000, rate: 0.0316 },
      { min: 4000000, max: 6000000, rate: 0.0422 },
      { min: 6000000, max: Infinity, rate: 0.0458 },
    ], deduction: 400000 },
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
