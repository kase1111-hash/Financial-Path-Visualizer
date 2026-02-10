## PROJECT EVALUATION REPORT

**Primary Classification:** Underdeveloped
**Secondary Tags:** Good Concept, Bad Execution (partial)

---

### CONCEPT ASSESSMENT

**What real problem does this solve?**
Personal financial trajectory visualization — answering "if I keep going on this path, where will I be in 30 years?" Specifically, it projects income, taxes, debts, and assets forward through time and shows the lifetime cost of financial decisions through side-by-side scenario comparison.

**Who is the user? Is the pain real or optional?**
Financially literate individuals who want to understand the long-term impact of decisions like buying a $300K vs $400K house, or increasing 401(k) contributions. The pain is real but **optional** — this is a "nice to have" planning tool, not a "must have" fixing an acute problem. The target user likely already uses spreadsheets for this.

**Is this solved better elsewhere?**
Yes. Tools like ProjectionLab, Boldin (formerly NewRetirement), and even basic spreadsheet models cover this ground with more polish, data integrations, and Monte Carlo simulations. The local-first privacy angle is a genuine differentiator, but it's not enough to overcome the execution gap.

**Value prop in one sentence:**
"See where your financial decisions lead over your lifetime, privately in your browser, without giving your data to anyone."

**Verdict:** Sound concept, but the privacy differentiator alone is thin. The "what-if comparison" feature is the strongest unique value, but the execution doesn't deliver on the promise yet.

---

### EXECUTION ASSESSMENT

**Architecture:**

The codebase is structured into clean, well-separated modules: `models/`, `engine/`, `scanner/`, `storage/`, `ui/`, `data/`, `workers/`. This is solid separation of concerns. TypeScript is used with strict compiler options (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), and domain-specific branded types (`Cents`, `Rate`, `ID`) enforce correctness at the type level. This is genuinely good engineering.

However, the architecture is **over-built for a v0.1.0**. The codebase has:
- 40+ UI component files using a hand-rolled vanilla DOM factory pattern (`src/ui/App.ts:42-263`)
- A custom reactive state management system (`src/ui/utils/state.ts:31-65`)
- A Web Worker manager for projection offloading (`src/engine/worker-manager.ts`)
- A plugin-based scanner framework with configurable rule filtering (`src/scanner/index.ts:61-114`)

This is the architecture of a mature product, not a prototype. For a v0.1.0 with no users, a simpler approach (React/Vue + a single calculation function) would have validated the concept faster.

**Code quality:**

- **TypeScript compiles clean** — zero type errors.
- **224 unit tests, all passing** across 15 test files. Coverage spans models, engine, scanner, and storage.
- **236 ESLint errors** — the linter is configured but the code doesn't pass it. Errors include `no-non-null-assertion` violations, inferrable types, unbound methods, and confusing void expressions. This suggests the lint config was added after the code was written and never enforced.
- **Production build succeeds** — 208KB JS bundle (gzipped: 62KB), reasonable for the feature set.

**Specific technical issues:**

1. **State tax calculation is fake** — `src/engine/tax-calculator.ts:128-130` admits in a comment: "For simplicity, use the state's rate directly. In reality, progressive states would have brackets." This means every state tax calculation is wrong for progressive-tax states (which is most states).

2. **Refinance rates are hardcoded** — `src/scanner/debt-rules.ts:192-194` has `CURRENT_MORTGAGE_RATE = 0.065` baked into the source. The comment says "in real app, would be fetched" — but this IS the app.

3. **Scanner lifetime estimates are napkin math** — Impact calculations use crude multipliers like `* 20` (`src/scanner/tax-rules.ts:63`), `* 30` (`src/scanner/tax-rules.ts:123`), and `* 5` (`src/scanner/debt-rules.ts:58`) for lifetime projections. For a tool whose core value is financial accuracy, this undermines trust.

4. **Tax brackets are frozen at 2024** — `src/data/federal-tax-brackets.ts` has hardcoded 2024 brackets with no mechanism to update them. The `estimateFutureTax` function (`src/engine/tax-calculator.ts:252-289`) attempts to inflation-adjust by deflating/reflating income, which is a rough approximation but acknowledged as such.

5. **Net worth milestone formatting is wrong** — `src/engine/projector.ts:320` formats net worth as `$${milestone / 100}` but values are in cents, so `10000000 / 100 = 100000` outputs `$100000` without comma formatting or dollar sign positioning.

6. **The UI is vanilla DOM manipulation** — No framework. Every component manually creates DOM elements, manages event listeners, and handles cleanup. This is technically functional but makes the UI the most fragile and hardest-to-maintain part of the codebase. Example: `src/ui/App.ts` is a 263-line function that hand-wires routing, loading states, error toasts, and view lifecycle.

**Tech stack appropriateness:**

TypeScript + Vite + Vitest is a solid modern stack. D3 for visualization is appropriate. IndexedDB via `idb` for local storage is the right choice for the privacy-first architecture. The decision to go framework-less for the UI is defensible for a small project but is already showing strain at 40+ component files.

**Verdict:** Over-engineered architecture, under-developed calculations. The scaffolding is enterprise-grade; the financial logic has placeholder-level accuracy in several critical areas. Execution does not match ambition.

---

### SCOPE ANALYSIS

**Core Feature:** Financial trajectory projection — project a profile forward through time and show where you'll be.

**Supporting:**
- Profile editor (income, debts, assets, goals, assumptions)
- Tax calculation engine (federal + FICA)
- Debt amortization engine
- Asset growth engine with employer matching
- Timeline visualization (D3 charts)
- Year-by-year breakdown view

**Nice-to-Have:**
- Scenario comparison engine (`src/engine/comparator.ts`) — powerful but premature before core projection accuracy is solid
- Optimization scanner framework (`src/scanner/`) — useful but the suggestions are based on crude estimates
- Dark mode / theme system
- JSON export/import

**Distractions:**
- Web Worker infrastructure (`src/workers/`, `src/engine/worker-manager.ts`) — projection runs in <25ms in tests; this is premature optimization
- Accessibility utilities (`src/ui/utils/accessibility.ts`) — good practice but premature for v0.1.0 with no users
- Performance monitoring (`src/ui/utils/performance.ts`) — zero users, zero need
- Extensive documentation (8 markdown files including `Architecture.md`, `IMPLEMENTATION_SPEC.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`) — documentation for a project with no contributors

**Wrong Product:**
- None. All features at least relate to financial planning. The scope is coherent, just too broad for the maturity level.

**Scope Verdict:** Feature Creep. The project has the feature breadth of a v2.0 product and the calculation accuracy of a v0.1 prototype. Effort was distributed across too many concerns simultaneously.

---

### COMMIT HISTORY ANALYSIS

The git history reveals this was **AI-generated code** (likely Claude), built in a phased waterfall approach:
```
Phase 1: Project setup
Phase 2: Data models
Phase 3: Projection engine
Phase 4: Storage layer
Phase 5: Basic UI & Input Forms
Phase 6: Timeline Visualization
Phase 7: Optimization Scanner
Phase 8: Comparison Engine
Phase 9: Polish & Refinements
```

Followed by audit and documentation passes. This explains the over-engineered architecture with under-developed calculations — AI code generators tend to produce structurally sound but substantively shallow implementations.

---

### BUILD HEALTH

| Check | Status |
|-------|--------|
| TypeScript compilation | PASS (0 errors) |
| Unit tests | PASS (224/224, 15 files) |
| ESLint | FAIL (236 errors, 22 warnings) |
| Production build | PASS (208KB JS, 48KB CSS) |
| Dependencies install | PASS (0 vulnerabilities) |
| `node_modules` committed | No (correct) |

---

### RECOMMENDATIONS

**CUT:**
- `src/workers/projection-worker.ts` and `src/engine/worker-manager.ts` — projections complete in milliseconds; Web Workers add complexity for zero benefit
- `src/ui/utils/performance.ts` — no users to monitor
- `Architecture.md`, `IMPLEMENTATION_SPEC.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md` — premature documentation for a solo prototype. Keep only `README.md` and `claude.md`

**DEFER:**
- Optimization scanner (`src/scanner/`) — until the projection engine's accuracy justifies automated advice
- Comparison engine (`src/engine/comparator.ts`) — until core projections are trustworthy
- Theme system / dark mode — cosmetic
- JSON export/import — no users to export data yet

**DOUBLE DOWN:**
- **Tax calculation accuracy** — implement actual progressive state tax brackets instead of the flat-rate shortcut. This is the single biggest accuracy gap.
- **Scanner impact estimates** — replace the `* 20` / `* 30` napkin math with actual trajectory re-projection. You already have the projection engine; use it to calculate real impact.
- **Lint compliance** — 236 errors means the codebase is drifting from its own standards. Fix these or relax the rules to match reality.
- **Validation and edge cases** — what happens with negative income? Zero debts? Retirement at age 25? The projection engine needs hardening.
- **User testing** — the product has had zero users. Deploy it (even as a static page) and get feedback before building more features.

**FINAL VERDICT:** Refocus

This project has a sound concept and competent (if over-engineered) scaffolding, but it needs to stop adding features and start fixing the ones it has. The financial calculations — the entire point of the tool — have meaningful accuracy gaps that undermine the product's core value proposition. No amount of comparison engines, optimization scanners, or Web Worker infrastructure matters if the base projection is wrong.

**Next Step:** Fix the state tax calculation to use actual progressive brackets for all 50 states. This is the highest-impact accuracy improvement and demonstrates whether the project can deliver on its core promise.
