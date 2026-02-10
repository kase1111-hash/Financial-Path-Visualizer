# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Progressive State Taxes** — Replaced flat-rate approximation with real bracket calculations for all 32 progressive-tax states (CA, NY, NJ, etc.)
- **Amortization Rounding** — 30-year mortgages now end at exactly $0 balance on the final scheduled month
- **Net Worth Milestones** — Fixed formatting with `toLocaleString()` for comma-separated dollar amounts
- **Income Projector** — Growth rate is now a configurable parameter instead of hardcoded 2%

### Added

- **Tax Year Configuration** — Federal brackets for 2024 and 2025, selectable via `taxYear` assumption field
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
