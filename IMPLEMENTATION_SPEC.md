# Financial Path Visualizer - Implementation Specification

A step-by-step guide to building the Financial Path Visualizer from scratch.

---

## Table of Contents

1. [Project Setup](#phase-1-project-setup)
2. [Data Models](#phase-2-data-models)
3. [Projection Engine](#phase-3-projection-engine)
4. [Storage Layer](#phase-4-storage-layer)
5. [Basic UI & Input Forms](#phase-5-basic-ui--input-forms)
6. [Timeline Visualization](#phase-6-timeline-visualization)
7. [Optimization Scanner](#phase-7-optimization-scanner)
8. [Comparison Engine](#phase-8-comparison-engine)
9. [Polish & Refinements](#phase-9-polish--refinements)

---

## Phase 1: Project Setup

### Step 1.1: Initialize Project Structure

Create a modern TypeScript web application with the following setup:

```
/Financial-Path-Visualizer
├── package.json
├── tsconfig.json
├── vite.config.ts           # or webpack/rollup config
├── index.html
├── /src
│   ├── main.ts              # Application entry point
│   ├── /models              # TypeScript type definitions
│   ├── /engine              # Core calculation logic
│   ├── /scanner             # Optimization detection
│   ├── /storage             # Data persistence
│   ├── /ui                  # User interface components
│   │   ├── /components      # Reusable UI components
│   │   ├── /views           # Page-level views
│   │   └── /styles          # CSS/styling
│   ├── /data                # Static data files
│   └── /workers             # Web Workers for heavy computation
├── /public
│   └── assets               # Static assets
└── /tests
    ├── /unit                # Unit tests
    └── /integration         # Integration tests
```

### Step 1.2: Install Dependencies

**Core Dependencies:**
- TypeScript 5.x
- Vite (build tool)
- A lightweight UI library (options: Preact, SolidJS, or vanilla with lit-html)

**Visualization:**
- D3.js or Chart.js for timeline charts
- Optional: d3-sankey for flow diagrams

**Storage:**
- idb (IndexedDB wrapper)
- uuid (ID generation)

**Development:**
- Vitest or Jest (testing)
- ESLint + Prettier (code quality)

### Step 1.3: Configure TypeScript

```json
// tsconfig.json key settings
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## Phase 2: Data Models

### Step 2.1: Create Base Types (`/src/models/common.ts`)

```typescript
// Unique identifier type
export type ID = string;

// Currency in cents to avoid floating point issues
export type Cents = number;

// Percentage as decimal (0.07 = 7%)
export type Rate = number;

// Date utilities
export type MonthYear = { month: number; year: number };

// Helper to generate IDs
export function generateId(): ID {
  return crypto.randomUUID();
}
```

### Step 2.2: Create Income Model (`/src/models/income.ts`)

```typescript
export type IncomeType = 'salary' | 'hourly' | 'variable' | 'passive';

export interface Income {
  id: ID;
  name: string;
  type: IncomeType;
  amount: Cents;              // Annual for salary, hourly rate (in cents) for hourly
  hoursPerWeek: number;       // Weekly hours worked
  variability: Rate;          // 0-1, fluctuation factor for variable income
  expectedGrowth: Rate;       // Annual growth rate
  endDate: MonthYear | null;  // When income stops
}

// Default income factory
export function createIncome(partial: Partial<Income> = {}): Income {
  return {
    id: generateId(),
    name: 'Primary Income',
    type: 'salary',
    amount: 0,
    hoursPerWeek: 40,
    variability: 0,
    expectedGrowth: 0.02,
    endDate: null,
    ...partial
  };
}
```

### Step 2.3: Create Debt Model (`/src/models/debt.ts`)

```typescript
export type DebtType = 'mortgage' | 'auto' | 'student' | 'credit' | 'personal' | 'other';

export interface Debt {
  id: ID;
  name: string;
  type: DebtType;
  principal: Cents;           // Current balance
  interestRate: Rate;         // Annual interest rate
  minimumPayment: Cents;      // Required monthly payment
  actualPayment: Cents;       // What user actually pays
  termMonths: number;         // Original loan term
  monthsRemaining: number;    // Months left

  // Mortgage-specific fields
  propertyValue: Cents | null;
  pmiThreshold: Rate | null;  // LTV where PMI drops (typically 0.80)
  pmiAmount: Cents | null;    // Monthly PMI
  escrowTaxes: Cents | null;  // Monthly property tax
  escrowInsurance: Cents | null;
}

export function createDebt(partial: Partial<Debt> = {}): Debt {
  return {
    id: generateId(),
    name: '',
    type: 'other',
    principal: 0,
    interestRate: 0,
    minimumPayment: 0,
    actualPayment: 0,
    termMonths: 0,
    monthsRemaining: 0,
    propertyValue: null,
    pmiThreshold: null,
    pmiAmount: null,
    escrowTaxes: null,
    escrowInsurance: null,
    ...partial
  };
}
```

### Step 2.4: Create Obligation Model (`/src/models/obligation.ts`)

```typescript
export type ObligationCategory =
  | 'housing'
  | 'utilities'
  | 'transport'
  | 'food'
  | 'insurance'
  | 'subscription'
  | 'other';

export type ScalingFactor = 'housing_size' | 'income' | 'inflation' | null;

export interface Obligation {
  id: ID;
  name: string;
  category: ObligationCategory;
  amount: Cents;              // Monthly cost
  isFixed: boolean;           // Does this scale?
  scalingFactor: ScalingFactor;
}

export function createObligation(partial: Partial<Obligation> = {}): Obligation {
  return {
    id: generateId(),
    name: '',
    category: 'other',
    amount: 0,
    isFixed: true,
    scalingFactor: null,
    ...partial
  };
}
```

### Step 2.5: Create Asset Model (`/src/models/asset.ts`)

```typescript
export type AssetType =
  | 'retirement_pretax'   // 401k, Traditional IRA
  | 'retirement_roth'     // Roth 401k, Roth IRA
  | 'savings'             // Savings account, CD
  | 'investment'          // Brokerage account
  | 'property'            // Real estate
  | 'other';

export interface Asset {
  id: ID;
  name: string;
  type: AssetType;
  balance: Cents;
  monthlyContribution: Cents;
  expectedReturn: Rate;
  employerMatch: Rate | null;   // Percentage matched
  matchLimit: Rate | null;      // Max percentage of salary matched
}

export function createAsset(partial: Partial<Asset> = {}): Asset {
  return {
    id: generateId(),
    name: '',
    type: 'savings',
    balance: 0,
    monthlyContribution: 0,
    expectedReturn: 0.07,
    employerMatch: null,
    matchLimit: null,
    ...partial
  };
}
```

### Step 2.6: Create Goal Model (`/src/models/goal.ts`)

```typescript
export type GoalType =
  | 'purchase'        // Major purchase
  | 'retirement'      // Retirement date
  | 'education'       // Education funding
  | 'debt_free'       // Pay off all debt
  | 'savings_target'  // Specific savings amount
  | 'other';

export interface Goal {
  id: ID;
  name: string;
  type: GoalType;
  targetAmount: Cents | null;
  targetDate: MonthYear | null;
  priority: number;           // 1-10
  flexible: boolean;          // Can date move?
}

export function createGoal(partial: Partial<Goal> = {}): Goal {
  return {
    id: generateId(),
    name: '',
    type: 'savings_target',
    targetAmount: null,
    targetDate: null,
    priority: 5,
    flexible: true,
    ...partial
  };
}
```

### Step 2.7: Create Assumptions Model (`/src/models/assumptions.ts`)

```typescript
export type FilingStatus =
  | 'single'
  | 'married_joint'
  | 'married_separate'
  | 'head_of_household';

export interface Assumptions {
  inflationRate: Rate;              // Default 0.03 (3%)
  marketReturn: Rate;               // Default 0.07 (7%)
  homeAppreciation: Rate;           // Default 0.03 (3%)
  salaryGrowth: Rate;               // Default 0.02 (2%)
  retirementWithdrawalRate: Rate;   // Default 0.04 (4%)
  lifeExpectancy: number;           // Default 85
  currentAge: number;               // User's current age
  taxFilingStatus: FilingStatus;
  state: string;                    // Two-letter state code
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  inflationRate: 0.03,
  marketReturn: 0.07,
  homeAppreciation: 0.03,
  salaryGrowth: 0.02,
  retirementWithdrawalRate: 0.04,
  lifeExpectancy: 85,
  currentAge: 30,
  taxFilingStatus: 'single',
  state: 'CA'
};
```

### Step 2.8: Create Financial Profile (`/src/models/profile.ts`)

```typescript
import { Income } from './income';
import { Debt } from './debt';
import { Obligation } from './obligation';
import { Asset } from './asset';
import { Goal } from './goal';
import { Assumptions, DEFAULT_ASSUMPTIONS } from './assumptions';

export interface FinancialProfile {
  id: ID;
  name: string;                    // Profile name
  createdAt: Date;
  updatedAt: Date;
  income: Income[];
  debts: Debt[];
  obligations: Obligation[];
  assets: Asset[];
  goals: Goal[];
  assumptions: Assumptions;
}

export function createProfile(partial: Partial<FinancialProfile> = {}): FinancialProfile {
  const now = new Date();
  return {
    id: generateId(),
    name: 'My Financial Plan',
    createdAt: now,
    updatedAt: now,
    income: [],
    debts: [],
    obligations: [],
    assets: [],
    goals: [],
    assumptions: { ...DEFAULT_ASSUMPTIONS },
    ...partial
  };
}
```

### Step 2.9: Create Trajectory Types (`/src/models/trajectory.ts`)

```typescript
export interface DebtState {
  debtId: ID;
  remainingPrincipal: Cents;
  interestPaidThisYear: Cents;
  principalPaidThisYear: Cents;
  isPaidOff: boolean;
  payoffMonth: number | null;     // Month in this year when paid off
}

export interface AssetState {
  assetId: ID;
  balance: Cents;
  contributionsThisYear: Cents;
  growthThisYear: Cents;
  employerMatchThisYear: Cents;
}

export interface TrajectoryYear {
  year: number;
  age: number;

  // Income
  grossIncome: Cents;
  taxFederal: Cents;
  taxState: Cents;
  taxFica: Cents;
  netIncome: Cents;
  effectiveTaxRate: Rate;

  // Work
  totalWorkHours: number;
  effectiveHourlyRate: Cents;   // Net income / hours worked

  // Debts
  debts: DebtState[];
  totalDebt: Cents;
  totalDebtPayment: Cents;
  totalInterestPaid: Cents;

  // Assets
  assets: AssetState[];
  totalAssets: Cents;
  netWorth: Cents;

  // Cash flow
  totalObligations: Cents;
  discretionaryIncome: Cents;
  savingsRate: Rate;

  // Housing
  homeEquity: Cents;
  ltvRatio: Rate;
  payingPmi: boolean;
}

export interface Milestone {
  year: number;
  month: number;
  type: 'debt_payoff' | 'goal_achieved' | 'goal_missed' | 'retirement_ready' | 'pmi_removed';
  description: string;
  relatedId: ID | null;         // Goal or debt ID
}

export interface TrajectorySummary {
  totalYears: number;
  retirementYear: number | null;
  retirementAge: number | null;
  totalLifetimeIncome: Cents;
  totalLifetimeTaxes: Cents;
  totalLifetimeInterest: Cents;
  netWorthAtRetirement: Cents;
  netWorthAtEnd: Cents;
  goalsAchieved: number;
  goalsMissed: number;
}

export interface Trajectory {
  profileId: ID;
  generatedAt: Date;
  years: TrajectoryYear[];
  milestones: Milestone[];
  summary: TrajectorySummary;
}
```

### Step 2.10: Create Optimization Types (`/src/models/optimization.ts`)

```typescript
export type OptimizationType = 'tax' | 'debt' | 'savings' | 'housing' | 'income';
export type Confidence = 'high' | 'medium' | 'low';

export interface Impact {
  monthlyChange: Cents;
  annualChange: Cents;
  lifetimeChange: Cents;
  retirementDateChange: number;   // Months +/-
  metricAffected: string;
}

export interface Optimization {
  id: ID;
  type: OptimizationType;
  title: string;
  explanation: string;
  action: string;
  impact: Impact;
  confidence: Confidence;
  prerequisites: string[];
  yearApplicable: number;         // Which year this applies to
}
```

### Step 2.11: Create Barrel Export (`/src/models/index.ts`)

```typescript
export * from './common';
export * from './income';
export * from './debt';
export * from './obligation';
export * from './asset';
export * from './goal';
export * from './assumptions';
export * from './profile';
export * from './trajectory';
export * from './optimization';
```

---

## Phase 3: Projection Engine

### Step 3.1: Tax Calculator (`/src/engine/tax-calculator.ts`)

**Implementation Steps:**

1. **Create federal tax bracket data** (`/src/data/federal-tax-brackets.ts`)
   - Define brackets for each filing status
   - Include standard deduction amounts
   - Include FICA rates (Social Security 6.2%, Medicare 1.45%)
   - Include Social Security wage base limit

2. **Create state tax data** (`/src/data/state-taxes.ts`)
   - State income tax brackets for all 50 states
   - States with no income tax (TX, FL, WA, etc.)
   - Local taxes where applicable

3. **Implement tax calculation functions:**
   ```typescript
   export function calculateFederalTax(
     grossIncome: Cents,
     filingStatus: FilingStatus,
     retirementContributions: Cents,
     year: number
   ): { tax: Cents; marginalRate: Rate; effectiveRate: Rate }

   export function calculateStateTax(
     grossIncome: Cents,
     state: string,
     filingStatus: FilingStatus
   ): { tax: Cents; effectiveRate: Rate }

   export function calculateFica(
     grossIncome: Cents
   ): { socialSecurity: Cents; medicare: Cents; total: Cents }

   export function calculateTotalTax(
     grossIncome: Cents,
     filingStatus: FilingStatus,
     state: string,
     retirementContributions: Cents,
     year: number
   ): TaxBreakdown
   ```

### Step 3.2: Amortization Calculator (`/src/engine/amortization.ts`)

**Implementation Steps:**

1. **Calculate monthly payment:**
   ```typescript
   export function calculateMonthlyPayment(
     principal: Cents,
     annualRate: Rate,
     termMonths: number
   ): Cents
   ```

2. **Generate amortization schedule:**
   ```typescript
   export interface AmortizationPayment {
     month: number;
     principal: Cents;
     interest: Cents;
     balance: Cents;
   }

   export function generateAmortizationSchedule(
     principal: Cents,
     annualRate: Rate,
     termMonths: number,
     extraPayment: Cents = 0
   ): AmortizationPayment[]
   ```

3. **Calculate year-by-year debt state:**
   ```typescript
   export function calculateDebtYear(
     debt: Debt,
     year: number,
     startingBalance: Cents
   ): { endBalance: Cents; interestPaid: Cents; principalPaid: Cents; isPaidOff: boolean }
   ```

4. **PMI calculation:**
   ```typescript
   export function shouldPayPmi(
     loanBalance: Cents,
     propertyValue: Cents,
     pmiThreshold: Rate
   ): boolean

   export function calculateLtv(
     loanBalance: Cents,
     propertyValue: Cents
   ): Rate
   ```

### Step 3.3: Asset Growth Calculator (`/src/engine/growth.ts`)

**Implementation Steps:**

1. **Calculate asset growth for one year:**
   ```typescript
   export function calculateAssetGrowth(
     balance: Cents,
     monthlyContribution: Cents,
     annualReturn: Rate,
     employerMatch: Rate | null,
     matchLimit: Rate | null,
     annualSalary: Cents
   ): { endBalance: Cents; growth: Cents; contributions: Cents; employerContribution: Cents }
   ```

2. **Handle different account types:**
   ```typescript
   export function calculateRetirementGrowth(
     asset: Asset,
     year: number,
     annualSalary: Cents,
     assumptions: Assumptions
   ): AssetState
   ```

3. **Property appreciation:**
   ```typescript
   export function calculatePropertyAppreciation(
     currentValue: Cents,
     appreciationRate: Rate
   ): Cents
   ```

### Step 3.4: Income Projector (`/src/engine/income-projector.ts`)

**Implementation Steps:**

1. **Project single income source:**
   ```typescript
   export function projectIncome(
     income: Income,
     year: number,
     currentYear: number,
     defaultGrowthRate: Rate
   ): { amount: Cents; hoursWorked: number; isActive: boolean }
   ```

2. **Aggregate all income sources:**
   ```typescript
   export function projectTotalIncome(
     incomes: Income[],
     year: number,
     currentYear: number,
     assumptions: Assumptions
   ): { totalIncome: Cents; totalHours: number; activeIncomes: ID[] }
   ```

### Step 3.5: Main Projection Engine (`/src/engine/projector.ts`)

**Implementation Steps:**

1. **Create the main projection function:**
   ```typescript
   export function generateTrajectory(
     profile: FinancialProfile
   ): Trajectory
   ```

2. **Implement year-by-year projection loop:**
   ```typescript
   function projectYear(
     profile: FinancialProfile,
     year: number,
     previousYear: TrajectoryYear | null
   ): TrajectoryYear
   ```

3. **Calculate each component:**
   - Income projection (with growth)
   - Tax calculation
   - Debt payments and balance updates
   - Asset growth and contributions
   - Net worth calculation
   - Discretionary income calculation

4. **Detect milestones:**
   ```typescript
   function detectMilestones(
     profile: FinancialProfile,
     year: TrajectoryYear,
     previousYear: TrajectoryYear | null
   ): Milestone[]
   ```

5. **Generate trajectory summary:**
   ```typescript
   function generateSummary(
     profile: FinancialProfile,
     years: TrajectoryYear[],
     milestones: Milestone[]
   ): TrajectorySummary
   ```

6. **Retirement readiness check:**
   ```typescript
   function checkRetirementReadiness(
     assets: Cents,
     annualExpenses: Cents,
     withdrawalRate: Rate
   ): boolean
   ```

### Step 3.6: Comparison Engine (`/src/engine/comparator.ts`)

**Implementation Steps:**

1. **Define comparison types:**
   ```typescript
   export interface Change {
     field: string;
     originalValue: any;
     newValue: any;
     description: string;
   }

   export interface YearDelta {
     year: number;
     netWorthDelta: Cents;
     incomeDelta: Cents;
     debtDelta: Cents;
     assetsDelta: Cents;
   }

   export interface ComparisonSummary {
     retirementDateDelta: number;      // Months
     lifetimeInterestDelta: Cents;
     netWorthAtRetirementDelta: Cents;
     totalWorkHoursDelta: number;
     keyInsight: string;
   }

   export interface Comparison {
     baseline: Trajectory;
     alternate: Trajectory;
     changes: Change[];
     deltas: YearDelta[];
     summary: ComparisonSummary;
   }
   ```

2. **Implement comparison function:**
   ```typescript
   export function compareTrajectories(
     baseline: Trajectory,
     alternate: Trajectory,
     changes: Change[]
   ): Comparison
   ```

3. **Generate key insight text:**
   ```typescript
   function generateKeyInsight(
     summary: Partial<ComparisonSummary>
   ): string
   ```

### Step 3.7: Web Worker Setup (`/src/workers/projection-worker.ts`)

**Implementation Steps:**

1. **Create worker entry point:**
   ```typescript
   // projection-worker.ts
   import { generateTrajectory } from '../engine/projector';
   import { FinancialProfile, Trajectory } from '../models';

   self.onmessage = (event: MessageEvent<FinancialProfile>) => {
     const trajectory = generateTrajectory(event.data);
     self.postMessage(trajectory);
   };
   ```

2. **Create worker manager:**
   ```typescript
   // /src/engine/worker-manager.ts
   export class ProjectionWorker {
     private worker: Worker;

     constructor() {
       this.worker = new Worker(
         new URL('../workers/projection-worker.ts', import.meta.url),
         { type: 'module' }
       );
     }

     async generate(profile: FinancialProfile): Promise<Trajectory> {
       return new Promise((resolve) => {
         this.worker.onmessage = (e) => resolve(e.data);
         this.worker.postMessage(profile);
       });
     }

     terminate() {
       this.worker.terminate();
     }
   }
   ```

---

## Phase 4: Storage Layer

### Step 4.1: IndexedDB Wrapper (`/src/storage/db.ts`)

**Implementation Steps:**

1. **Define database schema:**
   ```typescript
   import { openDB, DBSchema } from 'idb';

   interface FinancialDB extends DBSchema {
     profiles: {
       key: string;
       value: FinancialProfile;
       indexes: { 'by-date': Date };
     };
     trajectories: {
       key: string;
       value: Trajectory;
       indexes: { 'by-profile': string };
     };
     preferences: {
       key: string;
       value: any;
     };
   }
   ```

2. **Create database connection:**
   ```typescript
   export async function getDatabase() {
     return openDB<FinancialDB>('financial-visualizer', 1, {
       upgrade(db) {
         const profileStore = db.createObjectStore('profiles', { keyPath: 'id' });
         profileStore.createIndex('by-date', 'updatedAt');

         const trajectoryStore = db.createObjectStore('trajectories', { keyPath: 'profileId' });
         trajectoryStore.createIndex('by-profile', 'profileId');

         db.createObjectStore('preferences');
       }
     });
   }
   ```

### Step 4.2: Profile Storage (`/src/storage/profile-store.ts`)

```typescript
export async function saveProfile(profile: FinancialProfile): Promise<void>
export async function loadProfile(id: ID): Promise<FinancialProfile | undefined>
export async function listProfiles(): Promise<FinancialProfile[]>
export async function deleteProfile(id: ID): Promise<void>
export async function clearAllData(): Promise<void>
```

### Step 4.3: Export/Import (`/src/storage/export.ts`)

**Implementation Steps:**

1. **Export to JSON:**
   ```typescript
   export interface ExportData {
     version: string;
     exportedAt: Date;
     profile: FinancialProfile;
   }

   export function exportToJson(profile: FinancialProfile): string {
     const data: ExportData = {
       version: '1.0',
       exportedAt: new Date(),
       profile
     };
     return JSON.stringify(data, null, 2);
   }

   export function downloadJson(profile: FinancialProfile, filename: string): void {
     const json = exportToJson(profile);
     const blob = new Blob([json], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = filename;
     a.click();
     URL.revokeObjectURL(url);
   }
   ```

2. **Import from JSON:**
   ```typescript
   export function importFromJson(json: string): FinancialProfile {
     const data: ExportData = JSON.parse(json);
     // Validate version compatibility
     // Migrate if needed
     return data.profile;
   }

   export async function importFromFile(file: File): Promise<FinancialProfile> {
     const text = await file.text();
     return importFromJson(text);
   }
   ```

### Step 4.4: Preferences Storage (`/src/storage/preferences.ts`)

```typescript
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: string;
  lastProfileId: ID | null;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  lastProfileId: null
};

export async function getPreferences(): Promise<UserPreferences>
export async function setPreferences(prefs: Partial<UserPreferences>): Promise<void>
```

---

## Phase 5: Basic UI & Input Forms

### Step 5.1: Application Shell (`/src/ui/App.ts`)

**Components to create:**

1. **Main layout:**
   - Header with app name and navigation
   - Sidebar for profile switching
   - Main content area
   - Footer with privacy notice

2. **Router setup:**
   - `/` - Dashboard/Quick Start
   - `/profile` - Full profile editor
   - `/trajectory` - Trajectory view
   - `/compare` - Comparison view
   - `/settings` - App settings

### Step 5.2: Quick Start Form (`/src/ui/views/QuickStart.ts`)

**Minimal inputs for immediate value:**

1. **Annual income** - Single number input
2. **Monthly take-home** - To back-calculate taxes
3. **Biggest monthly cost** - Rent or mortgage payment
4. **Primary goal** - Dropdown (Buy house / Retire early / Become debt-free)

**On submit:**
- Create profile with these inputs
- Generate trajectory
- Navigate to trajectory view

### Step 5.3: Profile Editor (`/src/ui/views/ProfileEditor.ts`)

**Sections to implement:**

1. **Income Section**
   - List of income sources
   - Add/edit/delete income
   - Fields: name, type, amount, hours/week, growth rate, end date

2. **Debts Section**
   - List of all debts
   - Add/edit/delete debt
   - Mortgage-specific fields conditionally shown
   - Running total display

3. **Obligations Section**
   - List of monthly obligations
   - Categorized grouping
   - Monthly total display

4. **Assets Section**
   - List of all assets
   - Retirement accounts with employer match fields
   - Total assets display

5. **Goals Section**
   - List of financial goals
   - Priority ordering
   - Target dates and amounts

6. **Assumptions Section**
   - Collapsible panel
   - All assumption fields with defaults
   - Reset to defaults button

### Step 5.4: Form Components (`/src/ui/components/forms/`)

**Reusable components:**

1. **CurrencyInput** - Formatted currency entry
2. **PercentageInput** - Rate entry with % formatting
3. **DatePicker** - Month/year picker
4. **NumberInput** - Basic number with validation
5. **Select** - Dropdown selection
6. **Toggle** - Boolean switch
7. **FormSection** - Collapsible section wrapper
8. **ItemList** - Add/edit/delete list manager

### Step 5.5: Validation (`/src/ui/validation/`)

**Implement validation rules:**

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export function validateProfile(profile: FinancialProfile): ValidationResult
export function validateIncome(income: Income): ValidationError[]
export function validateDebt(debt: Debt): ValidationError[]
// etc.
```

**Validation checks:**
- Required fields
- Reasonable ranges (interest rate < 100%, etc.)
- Logical consistency (payment < balance, etc.)
- Warnings for unusual values

---

## Phase 6: Timeline Visualization

### Step 6.1: Chart Infrastructure (`/src/ui/viz/chart-utils.ts`)

**Setup functions:**

1. **Chart dimensions and margins**
2. **Scale creation (x: years, y: currency)**
3. **Axis formatting (currency, years)**
4. **Responsive sizing**

### Step 6.2: Timeline Chart (`/src/ui/viz/TimelineChart.ts`)

**Implementation Steps:**

1. **Create SVG container with D3:**
   - Responsive width
   - Fixed aspect ratio
   - Margin convention

2. **Draw axes:**
   - X-axis: Years from current to life expectancy
   - Y-axis: Currency (net worth, debt, etc.)
   - Grid lines

3. **Plot primary line (net worth by default):**
   - Smooth curve through data points
   - Area fill below line
   - Color coding (red for negative, green for positive)

4. **Add milestone markers:**
   - Icons at debt payoff dates
   - Goal achievement markers
   - Retirement marker

5. **Interactive features:**
   - Hover tooltip with year details
   - Click to select year
   - Zoom/pan for long timelines

6. **Metric selector:**
   - Net worth (default)
   - Total debt
   - Total assets
   - Annual income
   - Savings rate

### Step 6.3: Year Detail Panel (`/src/ui/viz/YearDetail.ts`)

**Show when a year is selected:**

- Age
- Gross and net income
- Tax breakdown
- Each debt with balance
- Each asset with balance
- Net worth
- Hours worked / effective hourly rate

### Step 6.4: Milestone List (`/src/ui/viz/MilestoneList.ts`)

**Display all milestones:**

- Chronological list
- Icon by type
- Year and description
- Click to navigate to that year in chart

### Step 6.5: Summary Cards (`/src/ui/viz/SummaryCards.ts`)

**Key metrics at a glance:**

- Retirement age/year
- Final net worth
- Total lifetime taxes
- Total lifetime interest
- Goals achieved/missed

---

## Phase 7: Optimization Scanner

### Step 7.1: Scanner Framework (`/src/scanner/index.ts`)

```typescript
export interface ScannerRule {
  id: string;
  name: string;
  type: OptimizationType;
  scan: (profile: FinancialProfile, trajectory: Trajectory, year: number) => Optimization | null;
}

export function runAllScanners(
  profile: FinancialProfile,
  trajectory: Trajectory
): Optimization[]
```

### Step 7.2: Tax Rules (`/src/scanner/tax-rules.ts`)

**Rules to implement:**

1. **Bracket Boundary Detection:**
   - If income is within X% of next bracket
   - Suggest retirement contribution to stay in lower bracket
   - Calculate exact amount and tax savings

2. **Employer Match Alert:**
   - If not maxing employer match
   - Calculate "free money" being left on table

3. **Roth Conversion Window:**
   - Detect low-income years
   - Suggest Roth conversion opportunity

4. **Tax-Advantaged Space:**
   - Calculate unused 401k/IRA space
   - Show opportunity cost

### Step 7.3: Debt Rules (`/src/scanner/debt-rules.ts`)

**Rules to implement:**

1. **High-Interest vs Low-Yield:**
   - Compare credit card rates to savings rates
   - Suggest reallocation with monthly impact

2. **PMI Removal:**
   - Detect LTV below threshold
   - Suggest reassessment/refinance
   - Calculate monthly savings

3. **Debt Avalanche Optimization:**
   - Compare current payment order to optimal
   - Show interest savings from reordering

4. **Refinance Opportunity:**
   - Flag if rate is significantly above current market
   - Note: Don't fetch rates, just flag for user research

### Step 7.4: Savings Rules (`/src/scanner/savings-rules.ts`)

**Rules to implement:**

1. **Emergency Fund vs Debt:**
   - If emergency fund exists while carrying high-interest debt
   - Calculate opportunity cost

2. **Savings Rate Alert:**
   - If savings rate below recommended for goals
   - Show impact on goal achievement

3. **Investment vs Savings:**
   - If large cash position with long time horizon
   - Suggest investment consideration

### Step 7.5: Housing Rules (`/src/scanner/housing-rules.ts`)

**Rules to implement:**

1. **Housing Cost Ratio:**
   - If housing > 30% of income
   - Flag as potential stress point

2. **Prepayment vs Investment:**
   - Compare mortgage rate to expected returns
   - Show trade-off calculation

### Step 7.6: Optimization Display (`/src/ui/views/Optimizations.ts`)

**UI Components:**

1. **Optimization Card:**
   - Title and type icon
   - Explanation text
   - Action recommendation
   - Impact summary (monthly, lifetime, retirement date)
   - Confidence indicator

2. **Filter/Sort:**
   - By type (tax, debt, savings, housing)
   - By impact
   - By confidence

3. **Apply Scenario:**
   - Button to create what-if scenario with optimization applied
   - Links to comparison view

---

## Phase 8: Comparison Engine

### Step 8.1: Scenario Manager (`/src/ui/views/Scenarios.ts`)

**Features:**

1. **Create Scenario:**
   - Duplicate current profile
   - Modify variables
   - Name the scenario

2. **Scenario List:**
   - Show all saved scenarios
   - Quick compare buttons

3. **Quick What-If:**
   - Common scenarios as templates:
     - "What if I paid $X extra on debt?"
     - "What if I earned $X more?"
     - "What if I bought a cheaper house?"

### Step 8.2: Comparison View (`/src/ui/views/CompareView.ts`)

**Implementation Steps:**

1. **Side-by-Side Summary:**
   - Key metrics for baseline vs alternate
   - Difference highlighted

2. **Overlaid Timeline:**
   - Both trajectories on same chart
   - Different colors/styles
   - Toggle to show delta

3. **Year Slider:**
   - Scrub through timeline
   - Show specific year comparison

4. **Delta Table:**
   - Year-by-year differences
   - Sortable columns

5. **Key Insight:**
   - Auto-generated summary text
   - "Choosing the smaller house means retiring 3 years earlier and working 6,000 fewer hours"

### Step 8.3: Flow Diagram (`/src/ui/viz/SankeyDiagram.ts`)

**Implementation (optional but valuable):**

1. **Income sources** → **Taxes**
2. **After-tax** → **Debts** → **Obligations** → **Savings**
3. **Visual representation of money flow**
4. **Compare flow between scenarios**

---

## Phase 9: Polish & Refinements

### Step 9.1: Error Handling

1. **Graceful degradation** for calculation errors
2. **User-friendly error messages**
3. **Recovery options** (reset, reload last save)

### Step 9.2: Performance Optimization

1. **Debounced input updates** (300ms delay)
2. **Memoized calculations** where appropriate
3. **Virtual scrolling** for long lists
4. **Progressive loading** for large trajectories

### Step 9.3: Accessibility

1. **Keyboard navigation**
2. **Screen reader labels**
3. **High contrast mode**
4. **Focus management**

### Step 9.4: Responsive Design

1. **Mobile layout** for input forms
2. **Touch-friendly charts**
3. **Collapsible sections** on small screens

### Step 9.5: Testing

**Unit Tests:**
- All calculation functions
- Validation logic
- Data transformations

**Integration Tests:**
- Profile save/load
- Trajectory generation
- Comparison calculations

**E2E Tests:**
- Quick start flow
- Full profile entry
- Scenario comparison

### Step 9.6: Documentation

1. **Code comments** for complex logic
2. **README** with setup instructions
3. **User guide** (if requested)

---

## Implementation Order Summary

| Priority | Phase | Estimated Complexity |
|----------|-------|---------------------|
| 1 | Phase 2: Data Models | Low |
| 2 | Phase 3.1-3.2: Tax & Amortization | Medium |
| 3 | Phase 3.3-3.5: Growth & Main Engine | High |
| 4 | Phase 4: Storage Layer | Low |
| 5 | Phase 5.2: Quick Start | Medium |
| 6 | Phase 6.2: Timeline Chart | Medium |
| 7 | Phase 5.3: Full Profile Editor | High |
| 8 | Phase 7: Optimization Scanner | Medium |
| 9 | Phase 8: Comparison | Medium |
| 10 | Phase 9: Polish | Ongoing |

---

## Key Design Decisions to Make

1. **UI Framework:** Preact (lightweight), SolidJS (reactive), or vanilla + lit-html
2. **Styling:** CSS Modules, Tailwind, or vanilla CSS
3. **State Management:** Signals, stores, or React-like hooks
4. **Chart Library:** D3.js (flexible) or Chart.js (simpler)
5. **Build Tool:** Vite (recommended) or alternatives

---

## Files to Create (Initial)

```
/src
├── main.ts
├── /models
│   ├── index.ts
│   ├── common.ts
│   ├── income.ts
│   ├── debt.ts
│   ├── obligation.ts
│   ├── asset.ts
│   ├── goal.ts
│   ├── assumptions.ts
│   ├── profile.ts
│   ├── trajectory.ts
│   └── optimization.ts
├── /engine
│   ├── index.ts
│   ├── tax-calculator.ts
│   ├── amortization.ts
│   ├── growth.ts
│   ├── income-projector.ts
│   ├── projector.ts
│   └── comparator.ts
├── /data
│   ├── federal-tax-brackets.ts
│   └── state-taxes.ts
├── /storage
│   ├── index.ts
│   ├── db.ts
│   ├── profile-store.ts
│   ├── export.ts
│   └── preferences.ts
└── /workers
    └── projection-worker.ts
```

This specification provides a complete roadmap for building the Financial Path Visualizer from scratch.
