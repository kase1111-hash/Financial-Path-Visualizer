# Contributing to Financial Path Visualizer

Thank you for your interest in contributing to Financial Path Visualizer. This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Financial-Path-Visualizer.git
   cd Financial-Path-Visualizer
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the Development Server

```bash
npm run dev
```

### Code Quality

Before submitting a PR, ensure your code passes all checks:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run unit tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Building

```bash
npm run build
```

## Code Style

### TypeScript

- The project uses strict TypeScript with additional checks enabled
- All monetary values must be stored as integers in cents (use `Cents` type)
- Interest rates and growth rates are stored as decimals (e.g., 0.065 for 6.5%)
- Use the provided type aliases from `src/models/common.ts`

### Formatting

The project uses Prettier for code formatting. Configuration is in `.prettierrc`.

### Linting

ESLint is configured in `eslint.config.js`. Run `npm run lint:fix` to automatically fix issues.

## Project Architecture

### Directory Structure

- `src/models/` - Type definitions and data structures
- `src/engine/` - Core calculation logic (projections, amortization, taxes)
- `src/scanner/` - Optimization detection rules
- `src/storage/` - IndexedDB persistence layer
- `src/ui/` - User interface components and views
- `src/workers/` - Web Workers for heavy computations
- `src/data/` - Static data (tax brackets, etc.)
- `tests/unit/` - Vitest unit tests
- `tests/e2e/` - Playwright E2E tests

### Component Pattern

UI components follow a factory pattern:

```typescript
function createComponent(): { element: HTMLElement; destroy(): void } {
  const element = document.createElement('div');

  // Setup component...

  return {
    element,
    destroy() {
      // Cleanup event listeners, subscriptions, etc.
    }
  };
}
```

### Key Conventions

- **Currency**: Always use `Cents` type. Convert with `dollarsToCents()` and `centsToDollars()`
- **IDs**: Use the `ID` type from common.ts
- **Rates**: Store as decimals, not percentages

## Testing

### Unit Tests

Unit tests use Vitest and are located in `tests/unit/`. Tests should mirror the source structure.

```bash
# Run in watch mode
npm test

# Run once
npm run test:run

# With coverage
npm run test:coverage
```

### E2E Tests

E2E tests use Playwright and are located in `tests/e2e/`.

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run headed (visible browser)
npm run test:e2e:headed
```

## Pull Request Process

1. Ensure all tests pass and there are no linting errors
2. Update documentation if you're changing behavior
3. Add tests for new functionality
4. Keep PRs focused - one feature or fix per PR
5. Write clear commit messages
6. Fill out the PR template completely

### Commit Messages

Use clear, descriptive commit messages:

- `feat: add retirement age calculation`
- `fix: correct tax bracket boundary handling`
- `docs: update API documentation`
- `test: add unit tests for amortization`
- `refactor: simplify projection engine`

## Design Principles

When contributing, please keep these principles in mind:

1. **Financial data only** - Don't mix money information with other personal data
2. **Trajectory over history** - Focus on where users are headed, not past spending
3. **Paths, not prescriptions** - Show options, don't push specific outcomes
4. **Visible math** - Keep calculations transparent and explainable
5. **No product integration** - No bank connections or third-party service hooks

## Questions?

If you have questions about contributing, please open an issue for discussion.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
