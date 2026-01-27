# Software Audit Report: Financial Path Visualizer

**Audit Date:** January 27, 2026
**Auditor:** Claude Code
**Repository:** Financial-Path-Visualizer
**Purpose:** Assess software correctness and fitness for purpose

---

## Executive Summary

Financial Path Visualizer is a **well-designed, privacy-first financial planning tool** that projects financial trajectories over multi-decade timescales. The codebase demonstrates good architectural decisions, proper type safety with TypeScript's strict mode, and thoughtful separation of concerns.

**Overall Assessment: Fit for Purpose with Minor Improvements Recommended**

| Category | Rating | Notes |
|----------|--------|-------|
| Core Calculation Accuracy | Good | Calculations are mathematically sound |
| Type Safety | Excellent | Strict TypeScript with cents-based currency |
| Architecture | Excellent | Clean separation, modular design |
| Test Coverage | Good | Core engines tested, some gaps |
| Security | Good | Local-first design mitigates most risks |
| Edge Case Handling | Moderate | Some edge cases need attention |

---

## Detailed Findings

### 1. Calculation Engine Audit

#### 1.1 Tax Calculator (`src/engine/tax-calculator.ts`)

**Correctness: GOOD**

- Federal tax calculation correctly implements progressive brackets
- FICA taxes properly handle Social Security wage base caps
- Additional Medicare tax threshold correctly varies by filing status
- Pre-tax retirement contributions properly reduce taxable income

**Issues Identified:**

| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| LOW | State tax simplification | `calculateStateTax()` L120-133 | Uses flat/top marginal rate for all progressive states instead of actual brackets. This will over-estimate state taxes for progressive states. |
| INFO | Future tax estimation | `estimateFutureTax()` L252-289 | Assumes tax brackets inflate with inflation, which is reasonable but may diverge from actual IRS adjustments. |

**Recommendation:** Document the state tax simplification clearly in the UI so users understand the approximation.

#### 1.2 Amortization Calculator (`src/engine/amortization.ts`)

**Correctness: GOOD**

- Standard amortization formula correctly implemented
- Monthly compounding properly calculated
- Final payment handling correctly adjusts for balance

**Issues Identified:**

| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| LOW | Rounding accumulation | `calculateDebtYear()` L181 | Each month's interest is rounded individually. Over many years, this could cause minor drift from true values. |

**Verification:** Tests confirm correct behavior for standard mortgage scenarios.

#### 1.3 Growth Calculator (`src/engine/growth.ts`)

**Correctness: GOOD**

- Compound growth correctly uses monthly compounding
- Employer match calculation properly respects match limits
- Retirement readiness calculation follows standard 4% rule approach

**Issues Identified:**

| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| LOW | Contribution timing | `calculateYearlyGrowth()` L42-47 | Contributions are added at start of month before growth. This is a reasonable approximation but real-world timing varies (mid-month paycheck). |

#### 1.4 Projection Engine (`src/engine/projector.ts`)

**Correctness: GOOD**

- Year-by-year projection correctly maintains state across years
- Milestone detection properly tracks debt payoffs, PMI removal, net worth thresholds
- Retirement readiness uses 80% income replacement assumption (industry standard)

**Issues Identified:**

| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| MEDIUM | Duplicate net worth milestones | `detectMilestones()` L310 | Array contains duplicates: `[10000000, 25000000, 50000000, 100000000, 50000000, 100000000]` - should be unique values |
| LOW | Retirement asset filter | `generateTrajectory()` L83-84 | Only considers `retirement_pretax` and `retirement_roth` types. Users with taxable investment accounts intended for retirement may get inaccurate retirement readiness. |
| INFO | Static 80% income replacement | L87, L369 | Hard-coded 80% income replacement ratio. Consider making this configurable in assumptions. |

---

### 2. Data Model Audit

#### 2.1 Type Safety

**Rating: EXCELLENT**

- All monetary values use `Cents` type (integers) - prevents floating-point precision errors
- Rates use explicit `Rate` type (decimals, not percentages)
- TypeScript strict mode enabled with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- Nullable fields properly typed with `| null`

#### 2.2 Model Validation

**Rating: MODERATE**

- Models use factory functions (`createDebt()`, `createProfile()`) with sensible defaults
- Export/import validates structure before importing
- No runtime validation of individual field ranges (e.g., negative interest rates)

**Issues Identified:**

| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| MEDIUM | Missing field validation | `src/models/debt.ts` | No validation that `interestRate >= 0`, `principal >= 0`, `termMonths > 0` |
| MEDIUM | Missing field validation | `src/models/income.ts` | No validation for negative amounts or invalid hour values |

---

### 3. Optimization Scanner Audit

#### 3.1 Tax Rules (`src/scanner/tax-rules.ts`)

**Correctness: GOOD**

- Bracket boundary detection correctly identifies optimization opportunities
- Employer match detection properly calculates missed match amounts
- Roth conversion window correctly identifies low-income years

**Issues Identified:**

| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| LOW | Hard-coded limits | `taxAdvantagedSpaceRule` L210-211 | 401(k) and IRA limits hard-coded for 2024. Should use centralized constants from `federal-tax-brackets.ts`. |
| LOW | Missing catch-up contributions | `taxAdvantagedSpaceRule` | Does not account for catch-up contributions for users 50+ |

#### 3.2 Debt Rules (`src/scanner/debt-rules.ts`)

**Correctness: GOOD**

- High-interest vs savings rule correctly maintains emergency fund before suggesting paydown
- PMI removal calculation correctly uses LTV threshold
- Debt avalanche detection correctly identifies suboptimal payment allocation

**Issues Identified:**

| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| LOW | Hard-coded market rates | `refinanceOpportunityRule` L192-194 | Refinance opportunity uses hard-coded "current" market rates that will become stale |
| INFO | Emergency fund assumption | `highInterestVsSavingsRule` L37 | Uses 3-month emergency fund assumption. Industry recommendations vary (3-6 months). |

---

### 4. Storage Layer Audit

#### 4.1 Database (`src/storage/db.ts`)

**Rating: GOOD**

- Uses `idb` wrapper for IndexedDB (reliable, well-maintained library)
- Proper database versioning with migration support
- Handles blocked/blocking scenarios for multi-tab usage

#### 4.2 Export/Import (`src/storage/export.ts`)

**Rating: GOOD**

- Validates structure before import
- Generates new IDs on import to prevent conflicts
- Handles version migrations gracefully

**Issues Identified:**

| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| MEDIUM | Incomplete validation | `validateProfileData()` L124-151 | Validates field types but not contents. Malformed data (negative balances, missing nested fields) could cause runtime errors. |
| LOW | No size limit | `importFromFile()` | No file size validation. Very large files could cause performance issues. |

---

### 5. Input Validation Audit

#### 5.1 Form Components

**Rating: GOOD**

- Currency input properly handles parsing and formatting
- Min/max validation implemented in `CurrencyInput`
- Error messages display appropriately

**Issues Identified:**

| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| LOW | No integer overflow check | `CurrencyInput.ts` | Very large values (>MAX_SAFE_INTEGER) could cause issues. Unlikely in practice but no guard. |

---

### 6. Test Coverage Audit

**Rating: GOOD**

#### Unit Tests Present:
- Tax calculator: Core bracket calculations, FICA, state taxes
- Amortization: Monthly payments, payoff calculations, avalanche/snowball
- Growth: Compound growth, employer matching
- Models: Income, debt, profile utilities

#### E2E Tests Present:
- Quick start flow
- Trajectory view
- Comparison view
- Settings

**Gaps Identified:**

| Test Gap | Priority | Description |
|----------|----------|-------------|
| Projection engine | HIGH | No direct unit tests for `generateTrajectory()` |
| Scanner rules | MEDIUM | No unit tests for optimization rules |
| Edge cases | MEDIUM | Missing tests for boundary conditions (zero income, extreme values) |
| Storage layer | LOW | Profile store operations not tested (difficult without browser) |

---

### 7. Security Considerations

**Rating: GOOD (for intended use case)**

The application is designed as a **local-first, privacy-first** tool. All data stays in the browser.

**Strengths:**
- No external API calls with user financial data
- No server-side storage
- Export files are plain JSON (user-controlled)

**Considerations:**

| Severity | Issue | Description |
|----------|-------|-------------|
| INFO | IndexedDB persistence | Data persists in browser storage. Users should be aware data is not encrypted at rest. |
| INFO | Export file handling | Exported JSON files contain all financial data. Users should handle securely. |
| LOW | XSS in user content | Profile names are rendered to DOM. While `createElement` is used (safer than innerHTML), sanitization of user input is not explicit. |

---

### 8. Specific Bugs Found

| ID | Severity | File | Line | Description | Impact |
|----|----------|------|------|-------------|--------|
| BUG-001 | MEDIUM | `projector.ts` | 310 | Duplicate values in net worth milestones array | Harmless but indicates copy-paste error |
| BUG-002 | LOW | `tax-calculator.ts` | 78 | Returns `marginalRate: 0.10` for zero taxable income | Should arguably return 0 or null |

---

## Fitness for Purpose Assessment

### Intended Purpose
Financial Path Visualizer is designed to help users:
1. Model long-term financial trajectories
2. Simulate the impact of financial decisions
3. Identify optimization opportunities
4. Enable "what-if" scenario analysis

### Assessment

| Criterion | Met? | Notes |
|-----------|------|-------|
| Accurate financial projections | YES | Core calculations are mathematically sound |
| Multi-decade time horizons | YES | Projects to life expectancy |
| Debt modeling | YES | Proper amortization with payoff tracking |
| Asset growth modeling | YES | Compound growth with employer matching |
| Tax estimation | PARTIAL | Federal accurate; state taxes simplified |
| Optimization suggestions | YES | Reasonable rules with quantified impact |
| Privacy/local-first | YES | No server communication with user data |
| Scenario comparison | YES | Comparison engine properly diffs trajectories |

### Limitations (Working as Designed)

1. **State taxes are simplified** - Uses top marginal rate, may overestimate
2. **Market returns are assumed constant** - No Monte Carlo simulation for risk
3. **Tax law changes not modeled** - Uses current brackets with inflation adjustment
4. **Single filing status per profile** - Cannot model marriage mid-projection
5. **No Social Security income modeling** - Doesn't project SS benefits

---

## Recommendations

### High Priority

1. **Fix duplicate net worth milestones** (`projector.ts:310`)
   ```typescript
   // Change from:
   const netWorthMilestones = [10000000, 25000000, 50000000, 100000000, 50000000, 100000000];
   // To:
   const netWorthMilestones = [10000000, 25000000, 50000000, 100000000, 250000000, 500000000, 1000000000];
   ```

2. **Add projection engine tests** - Critical path code without direct unit tests

3. **Add runtime validation** for model creation - Prevent negative balances, invalid rates

### Medium Priority

4. **Use centralized tax constants** in scanner rules instead of duplicating limits

5. **Document state tax simplification** prominently in UI

6. **Add scanner rule tests** - Important for financial advice correctness

7. **Validate import file contents** more thoroughly (not just structure)

### Low Priority

8. **Make income replacement ratio configurable** (currently hard-coded at 80%)

9. **Add age-based catch-up contribution logic** to tax-advantaged space rule

10. **Consider adding file size limit** to import functionality

---

## Conclusion

Financial Path Visualizer is a **well-engineered financial planning tool** that correctly implements core financial calculations. The codebase demonstrates professional-quality architecture with appropriate separation of concerns, strict TypeScript usage, and thoughtful design decisions.

The identified issues are primarily:
- Minor bugs (duplicate array values)
- Simplifications that are reasonable for the tool's scope (state taxes)
- Test coverage gaps for some components
- Validation improvements that would increase robustness

**The software is fit for its intended purpose** of helping users understand their long-term financial trajectory and identify optimization opportunities. Users should understand the documented limitations, particularly around state tax approximations and the assumptions inherent in any long-term financial projection.

---

*Report generated by Claude Code audit process*
