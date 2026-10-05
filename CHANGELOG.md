# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed (accuracy audit)

- **Federal Tax Data** — 2024 brackets had wrong thresholds for every filing status (e.g. single 24% bracket ended at $191,550 instead of $191,950; HOH 22%/32% thresholds wrong). 2025 brackets and standard deductions were not the IRS figures. All years now match IRS Rev. Procs; 2025 uses the OBBBA standard deduction; 2026 added (Rev. Proc. 2025-32). 401(k) catch-up corrected to $7,500 (was $7,650/$7,750)
- **State Tax Data** — Connecticut's brackets were malformed (overlapping ranges produced negative tax), and many states used outdated rates (e.g. NC 5.25% vs 3.99%, GA/IA/ID/KS/MS/OH/OK/UT/WV/AR rates and brackets from before recent cuts, NY/CA/MN thresholds several years old) and ignored state standard deductions tied to the federal amount. Replaced with 2026 single and married-filing-jointly schedules for all 50 states + DC, with sources and simplifications noted per state
- **Bracket Creep** — Projections applied fixed 2024 brackets to 50+ years of nominal income growth, pushing everyone into ever-higher brackets. Each year now uses that year's published tax law, with brackets, deductions and the Social Security wage base indexed for inflation after the latest published year
- **Quick Start Mortgage** — The payment was estimated as 0.5% of the balance, less than the interest on a 6.5% loan, so the mortgage never paid off. Quick Start now uses a real 30-year (mortgage) / 10-year (student loan) amortized payment
- **Income End Dates** — An income ending mid-year counted as $0 for that whole year; it now counts the months worked
- **0% Income Growth** — An explicit 0% growth rate was silently replaced with the default 2%
- **Contributions After Retirement** — 401(k)/IRA contributions and employer match continued after all earned income stopped; they now stop with earned income
- **Retirement Readiness** — A year with $0 income needed a $0 nest egg, so "retirement ready" triggered as soon as income stopped
- **Investment Returns** — Monthly compounding at rate/12 turned a 7% return into 7.23%/yr (~11% overstatement over 50 years); returns now compound to exactly the stated annual rate
- **FICA on Passive Income** — Passive income (rent, dividends) no longer incurs Social Security/Medicare tax, and doesn't count toward the employer match base
- **Discretionary Income** — Now subtracts your own savings contributions instead of counting that money as both saved and spendable; HSA contributions now reduce taxable income
- **Optimization Totals** — Each suggestion was repeated for every projected year it applied to, so the "Lifetime Impact" summary added the same impact up to 55 times. Each opportunity is now reported once, at its earliest year
- **Tax Bracket Suggestion** — Compared gross income (not taxable income) to the brackets, giving wrong "you're near a bracket" advice, and understated savings by using the rate difference instead of the marginal rate
- **Scanner Rules** — Year-correct contribution limits (401k/IRA/HSA incl. HSA 55+ catch-up); tax savings computed with the projection's tax engine; savings-rate rule no longer mixes gross and net income; emergency-fund rule no longer says "Infinity months" and counts debt payments as expenses; prepay-vs-invest compares against the mortgage rate instead of 0%; simulated transfers into investments no longer vanish when there's no brokerage account; nonsensical retirement-date estimates removed
- **What-If Scenarios** — "Income Increase" added an annual raise to an hourly *rate* for hourly workers; scenarios that had nothing to change (e.g. no savings account) silently showed a zero difference
- **Total Interest** — Lifetime interest no longer overstated by treating the final partial payment as a full one
- **Help Page** — Default assumptions and optimization types now describe what the app actually does

- **Progressive State Taxes** — Replaced flat-rate approximation with real bracket calculations for all 32 progressive-tax states (CA, NY, NJ, etc.)
- **Amortization Rounding** — 30-year mortgages now end at exactly $0 balance on the final scheduled month
- **Net Worth Milestones** — Fixed formatting with `toLocaleString()` for comma-separated dollar amounts
- **Income Projector** — Growth rate is now a configurable parameter instead of hardcoded 2%

### Added

- **Multi-Year Tax Data** — Federal brackets for 2024–2026; each projected year uses its own year's tax law (the `taxYear` assumption is now informational)
- **Edge Case Tests** — 10 new tests: $0 income, negative net worth, $10M+ income, 75-year projections, no-state-tax states
- **Impact Calculator** — `calculateOptimizationImpact()` generates modified trajectories for real lifetime impact numbers
- **Annuity Formulas** — `estimateLifetimeValue()` and `estimateOneTimeImpact()` for compound growth math
- **GitHub Pages Deployment** — Automated deployment via GitHub Actions

### Changed

- **Scanner Rules** — All 13 rules now use trajectory comparison or compound growth formulas instead of crude multipliers (previously 5x, 10x, 20x, 25x, 30x)
- **Hardcoded Rates Removed** — Scanner rules now use `profile.assumptions.marketReturn` instead of hardcoded 7%/8% return assumptions; refinance thresholds derived from user assumptions
- **ESLint** — Fixed all 236 errors; 0 errors remaining (23 non-null-assertion warnings)
- **Documentation** — Trimmed ~2,400 lines of premature docs; consolidated into README with "How it Works" section

## [0.1.0] - 2026-01-22

### Added

- **Core Data Models**
  - Financial profile structure with income, debts, assets, obligations, and goals
  - Type-safe currency handling (all values stored as cents)
  - Rate handling as decimals for precision

- **Projection Engine**
  - Main projection engine for calculating financial trajectories
  - Income projection with growth modeling
  - Debt amortization calculations
  - Asset growth calculations
  - Federal and state tax estimation

- **Comparison Engine**
  - What-if scenario comparisons
  - Side-by-side trajectory analysis
  - Variable impact calculations

- **Optimization Scanner**
  - Tax optimization rule detection
  - Debt payoff strategy suggestions
  - Savings opportunity identification
  - Housing optimization rules

- **Storage Layer**
  - IndexedDB persistence via idb library
  - Profile CRUD operations
  - User preferences storage
  - Import/export functionality (JSON format)

- **User Interface**
  - Quick Start wizard for initial setup
  - Trajectory visualization view with D3.js charts
  - Comparison view for what-if scenarios
  - Optimizations view for suggestions
  - Settings view for preferences
  - Help view with user guide
  - Profile, income, debt, and asset editors
  - Responsive design for mobile devices

- **Testing Infrastructure**
  - Unit tests with Vitest
  - E2E tests with Playwright
  - Test coverage reporting

- **Developer Experience**
  - TypeScript strict mode configuration
  - ESLint and Prettier for code quality
  - Vite for fast development and builds
  - Web Worker support for heavy computations

### Security

- Fixed innerHTML XSS vulnerability with safe DOM manipulation
- Updated vulnerable dependencies

[Unreleased]: https://github.com/kase1111-hash/Financial-Path-Visualizer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kase1111-hash/Financial-Path-Visualizer/releases/tag/v0.1.0
