# Financial Path Visualizer - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│                  (Input Forms + Visualization)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Financial Profile                          │
│              (User's current state - all inputs)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Projection Engine                            │
│         (Compounds the profile forward through time)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Optimization Scanner                         │
│        (Finds inflection points and improvement paths)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Trajectory Output                          │
│            (Timeline view + comparison + prompts)               │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

### Financial Profile

The core input structure. Everything the system knows about the user.

```
FinancialProfile {
  income: Income[]
  debts: Debt[]
  obligations: Obligation[]
  assets: Asset[]
  goals: Goal[]
  assumptions: Assumptions
}
```

### Income

```
Income {
  id: string
  name: string                    // "Primary job", "Side work", etc.
  type: "salary" | "hourly" | "variable" | "passive"
  amount: number                  // Annual for salary, hourly rate for hourly
  hours_per_week: number          // For hourly and salary (to calculate true hourly rate)
  variability: number             // 0-1, how much this fluctuates (for variable income)
  expected_growth: number         // Annual percentage increase expected
  end_date: date | null           // When this income stops (retirement, contract end)
}
```

### Debt

```
Debt {
  id: string
  name: string                    // "Mortgage", "Car loan", "Student loans"
  type: "mortgage" | "auto" | "student" | "credit" | "personal" | "other"
  principal: number               // Current balance
  interest_rate: number           // Annual rate
  minimum_payment: number         // Required monthly payment
  actual_payment: number          // What user actually pays
  term_months: number             // Original loan term
  months_remaining: number        // Calculated or input
  
  // Mortgage-specific
  property_value: number | null   // Current estimated value
  pmi_threshold: number | null    // LTV ratio where PMI drops
  pmi_amount: number | null       // Monthly PMI cost
  escrow_taxes: number | null     // Monthly property tax in escrow
  escrow_insurance: number | null // Monthly insurance in escrow
}
```

### Obligation

```
Obligation {
  id: string
  name: string                    // "Electric", "Internet", "Groceries"
  category: "housing" | "utilities" | "transport" | "food" | "insurance" | "subscription" | "other"
  amount: number                  // Monthly cost
  is_fixed: boolean               // Does this scale with housing/lifestyle changes?
  scaling_factor: string | null   // What it scales with: "housing_size", "income", etc.
}
```

### Asset

```
Asset {
  id: string
  name: string                    // "401k", "Savings", "Brokerage"
  type: "retirement_pretax" | "retirement_roth" | "savings" | "investment" | "property" | "other"
  balance: number                 // Current value
  monthly_contribution: number    // Regular additions
  expected_return: number         // Annual return rate
  employer_match: number | null   // For retirement accounts
  match_limit: number | null      // Max employer contribution
}
```

### Goal

```
Goal {
  id: string
  name: string                    // "Buy house", "Retire", "Kid's college"
  type: "purchase" | "retirement" | "education" | "debt_free" | "savings_target" | "other"
  target_amount: number | null    // For purchases and savings targets
  target_date: date | null        // When they want to achieve it
  priority: number                // 1-10, for trade-off analysis
  flexible: boolean               // Can this move if needed?
}
```

### Assumptions

System-wide assumptions that affect projections. User can adjust these.

```
Assumptions {
  inflation_rate: number          // Default 3%
  market_return: number           // Default 7% nominal
  home_appreciation: number       // Default 3%
  salary_growth: number           // Default 2% (if not specified per income)
  retirement_withdrawal_rate: number  // Default 4%
  life_expectancy: number         // Default 85
  tax_filing_status: "single" | "married_joint" | "married_separate" | "head_of_household"
  state: string                   // For state tax calculations
}
```

## Projection Engine

The core calculator. Takes a FinancialProfile and projects it forward through time.

### Trajectory

```
Trajectory {
  profile: FinancialProfile       // Starting state
  years: TrajectoryYear[]         // Year-by-year projection
  milestones: Milestone[]         // When goals are hit (or missed)
  summary: TrajectorySummary      // Key metrics
}
```

### TrajectoryYear

```
TrajectoryYear {
  year: number
  age: number
  
  // Income
  gross_income: number
  tax_federal: number
  tax_state: number
  tax_fica: number
  net_income: number
  effective_tax_rate: number
  
  // Work
  total_work_hours: number
  effective_hourly_rate: number   // Net income / hours worked
  
  // Debts
  debts: DebtState[]              // Each debt's state this year
  total_debt: number
  total_debt_payment: number
  total_interest_paid: number
  
  // Assets
  assets: AssetState[]            // Each asset's state this year
  total_assets: number
  net_worth: number               // Assets - debts
  
  // Cash flow
  total_obligations: number
  discretionary_income: number    // What's left after debts + obligations
  savings_rate: number            // Discretionary going to savings/investment
  
  // Housing (if applicable)
  home_equity: number
  ltv_ratio: number
  paying_pmi: boolean
}
```

### Projection Logic

The engine runs year-by-year:

1. **Income Projection**
   - Apply expected growth to each income source
   - Handle end dates (retirement, contract expiration)
   - Calculate taxes using current brackets + assumptions about future brackets

2. **Debt Amortization**
   - Standard amortization for each debt
   - Track principal vs interest in each payment
   - Handle early payoff scenarios
   - Detect PMI removal eligibility

3. **Asset Growth**
   - Apply expected returns
   - Add contributions
   - Apply employer matching
   - Handle retirement account withdrawal rules

4. **Goal Tracking**
   - Check if purchase goals are achievable at target dates
   - Calculate retirement readiness (assets vs. needed withdrawal rate)
   - Flag goals that current trajectory misses

5. **Tax Optimization Points**
   - Detect bracket boundaries
   - Calculate value of additional retirement contributions
   - Identify Roth conversion opportunities

## Optimization Scanner

Analyzes a Trajectory to find improvement opportunities.

### Optimization

```
Optimization {
  id: string
  type: "tax" | "debt" | "savings" | "housing" | "income"
  title: string                   // Short description
  explanation: string             // Why this helps
  action: string                  // What to do
  impact: Impact
  confidence: "high" | "medium" | "low"
  prerequisites: string[]         // What needs to be true for this to work
}
```

### Impact

```
Impact {
  monthly_change: number          // +/- per month
  annual_change: number           // +/- per year
  lifetime_change: number         // Total impact over projection
  retirement_date_change: number  // Months earlier/later
  metric_affected: string         // What this changes most
}
```

### Scanner Rules

The scanner runs a series of detectors:

**Tax Optimizations**
- Income near bracket boundary → retirement contribution recommendation
- High state tax + remote work potential → state arbitrage flag
- Missing employer match → "free money" alert
- Roth conversion windows (low income years)

**Debt Optimizations**
- High-interest debt vs. low-yield savings → reallocation prompt
- PMI removal eligibility → reassessment/refinance prompt
- Debt avalanche vs. current payment pattern → reorder suggestion
- Refinance opportunities (rate comparison with current market)

**Savings Optimizations**
- Emergency fund vs. high-interest debt mismatch
- Under-utilized tax-advantaged space
- Savings rate vs. goal timeline mismatch

**Housing Optimizations**
- Current housing cost as % of income (flag if >30%)
- Smaller house impact modeling
- Rent vs. buy comparison for prospective buyers
- Prepayment vs. investment trade-off

## Comparison Engine

Allows side-by-side trajectory comparison when user changes variables.

### Comparison

```
Comparison {
  baseline: Trajectory            // Current plan
  alternate: Trajectory           // Modified plan
  changes: Change[]               // What was different in inputs
  deltas: Delta[]                 // Year-by-year differences
  summary: ComparisonSummary      // Key differences
}
```

### ComparisonSummary

```
ComparisonSummary {
  retirement_date_delta: number   // Months difference
  lifetime_interest_delta: number // Total interest paid difference
  net_worth_at_retirement_delta: number
  total_work_hours_delta: number  // Lifetime hours worked difference
  key_insight: string             // One-sentence summary of trade-off
}
```

## User Interface Structure

### Input Flow

```
1. Quick Start
   - Annual income
   - Monthly take-home (to back-calculate taxes)
   - Biggest debt (mortgage or rent)
   - One goal (house, retirement, debt-free)
   → Generates initial trajectory

2. Refinement
   - Add additional income sources
   - Add all debts
   - Add obligations
   - Add assets
   - Adjust assumptions
   → Trajectory updates in real-time

3. Scenario Mode
   - Modify any variable
   - See comparison to baseline
   - Save scenarios for later
```

### Visualization Components

**Timeline View**
- X-axis: Years (present → life expectancy)
- Y-axis: Net worth (or selectable: debt, income, etc.)
- Key events marked: debt payoffs, goal achievements, retirement
- Hover for year detail

**Sankey/Flow View**
- Income sources → taxes → debts → obligations → savings
- Shows where money goes
- Highlights inefficiencies

**Comparison Slider**
- Two trajectories overlaid
- Slider to see difference at any point in time
- Delta callouts for key metrics

**Goal Progress**
- Each goal as a progress bar or countdown
- Red/yellow/green status based on trajectory

## Technology Considerations

### Local-First Architecture

All computation happens client-side. No server receives financial data.

```
Browser
├── Input Layer (forms, validation)
├── Storage Layer (IndexedDB or localStorage)
├── Compute Layer (projection engine, scanner)
└── Render Layer (visualization)
```

### Data Persistence Options

1. **Browser Storage** - IndexedDB for complex data, localStorage for preferences
2. **File Export/Import** - JSON file user can save locally
3. **Encrypted Cloud Sync** - Optional, user holds key, server sees nothing

Default is browser storage + file export. No account required.

### Calculation Performance

Projecting 50+ years with multiple debts, assets, and yearly tax calculations could be intensive.

Mitigations:
- Web Workers for projection engine (non-blocking UI)
- Incremental updates (only recalculate affected years)
- Debounced input handling (don't recalc on every keystroke)

### Tax Data

Federal brackets update annually. State taxes vary significantly.

Options:
- Bundle current year brackets, update with releases
- Fetch from public API at runtime
- Allow manual override for future projections

## Module Breakdown

```
/src
├── /models
│   ├── profile.ts          # FinancialProfile and sub-types
│   ├── trajectory.ts       # Trajectory and projection types
│   └── optimization.ts     # Optimization and impact types
│
├── /engine
│   ├── projector.ts        # Main projection engine
│   ├── tax-calculator.ts   # Federal and state tax logic
│   ├── amortization.ts     # Debt amortization functions
│   ├── growth.ts           # Asset growth calculations
│   └── comparator.ts       # Trajectory comparison
│
├── /scanner
│   ├── index.ts            # Scanner orchestration
│   ├── tax-rules.ts        # Tax optimization detectors
│   ├── debt-rules.ts       # Debt optimization detectors
│   ├── savings-rules.ts    # Savings optimization detectors
│   └── housing-rules.ts    # Housing optimization detectors
│
├── /storage
│   ├── local.ts            # IndexedDB/localStorage wrapper
│   ├── export.ts           # JSON export/import
│   └── encrypt.ts          # Optional encryption utilities
│
├── /ui
│   ├── /input              # Input forms and validation
│   ├── /viz                # Visualization components
│   └── /layout             # Page structure
│
└── /data
    ├── tax-brackets.json   # Current federal brackets
    └── state-taxes.json    # State tax data
```

## Privacy Guarantees

1. **No telemetry.** We don't track usage, errors, or behavior.
2. **No external requests with user data.** Tax tables bundled, not fetched per-user.
3. **No accounts.** The tool works without registration.
4. **Exportable.** User can extract all their data as a file at any time.
5. **Deletable.** Clear storage button removes everything.

## Future Considerations

Things deliberately out of scope for v1 but worth noting:

- **Multi-person households** - Joint finances, income splitting
- **Business income** - Self-employment, pass-through entities
- **Investment optimization** - Asset allocation, rebalancing
- **Estate planning** - Inheritance, trusts
- **Insurance modeling** - Life, disability, long-term care
- **Social Security estimation** - Benefit calculations
- **Healthcare costs** - Pre/post Medicare modeling

These add significant complexity. Start simple, expand based on actual user needs.

## Implementation Priority

1. **Data model** - Get the types right first
2. **Projection engine** - Core math, no UI
3. **Basic input form** - Minimum viable inputs
4. **Timeline visualization** - See one trajectory
5. **Optimization scanner** - Surface the first insights
6. **Comparison mode** - What-if scenarios
7. **Polish** - Better visualizations, more optimization rules, edge cases
