/**
 * Summary Cards Component
 *
 * Displays key metrics at a glance from the trajectory summary.
 */

import type { TrajectorySummary, Trajectory } from '@models/trajectory';
import { createElement, clearChildren } from '@ui/utils/dom';
import { formatCurrency, formatHours } from '@ui/utils/format';

export interface SummaryCardsOptions {
  trajectory: Trajectory;
}

export interface SummaryCardsComponent {
  element: HTMLElement;
  setTrajectory(trajectory: Trajectory): void;
  destroy(): void;
}

/**
 * Card configuration.
 */
interface CardConfig {
  id: string;
  label: string;
  getValue: (summary: TrajectorySummary, trajectory: Trajectory) => string;
  getSubtext?: (summary: TrajectorySummary, trajectory: Trajectory) => string | null;
  variant?: 'positive' | 'negative' | 'neutral' | 'highlight';
}

const CARDS: CardConfig[] = [
  {
    id: 'retirement',
    label: 'Retirement Ready',
    getValue: (s) =>
      s.retirementAge !== null ? `Age ${s.retirementAge}` : 'Not in projection',
    getSubtext: (s) => (s.retirementYear !== null ? `Year ${s.retirementYear}` : null),
    variant: 'highlight',
  },
  {
    id: 'final-net-worth',
    label: 'Final Net Worth',
    getValue: (s) => formatCurrency(s.netWorthAtEnd, { compact: true }),
    getSubtext: (s, t) => {
      if (t.years.length < 2) return null;
      const firstYear = t.years[0]!;
      const change = s.netWorthAtEnd - firstYear.netWorth;
      const sign = change >= 0 ? '+' : '';
      return `${sign}${formatCurrency(change, { compact: true })} total`;
    },
    variant: 'positive',
  },
  {
    id: 'retirement-net-worth',
    label: 'Net Worth at Retirement',
    getValue: (s) =>
      s.retirementAge !== null
        ? formatCurrency(s.netWorthAtRetirement, { compact: true })
        : 'N/A',
    variant: 'neutral',
  },
  {
    id: 'lifetime-income',
    label: 'Lifetime Income',
    getValue: (s) => formatCurrency(s.totalLifetimeIncome, { compact: true }),
    variant: 'neutral',
  },
  {
    id: 'lifetime-taxes',
    label: 'Lifetime Taxes',
    getValue: (s) => formatCurrency(s.totalLifetimeTaxes, { compact: true }),
    getSubtext: (s) => {
      if (s.totalLifetimeIncome === 0) return null;
      const rate = s.totalLifetimeTaxes / s.totalLifetimeIncome;
      return `${(rate * 100).toFixed(1)}% of income`;
    },
    variant: 'negative',
  },
  {
    id: 'lifetime-interest',
    label: 'Lifetime Interest',
    getValue: (s) => formatCurrency(s.totalLifetimeInterest, { compact: true }),
    variant: 'negative',
  },
  {
    id: 'work-hours',
    label: 'Total Work Hours',
    getValue: (s) => formatHours(s.totalLifetimeWorkHours),
    getSubtext: (s) => {
      const years = s.totalLifetimeWorkHours / 2080;
      return `~${years.toFixed(1)} work years`;
    },
    variant: 'neutral',
  },
  {
    id: 'hourly-rate',
    label: 'Avg Hourly Rate',
    getValue: (s) =>
      s.averageEffectiveHourlyRate > 0
        ? `${formatCurrency(s.averageEffectiveHourlyRate)}/hr`
        : 'N/A',
    getSubtext: () => 'After taxes',
    variant: 'neutral',
  },
  {
    id: 'goals',
    label: 'Goals',
    getValue: (s) => {
      const total = s.goalsAchieved + s.goalsMissed;
      if (total === 0) return 'No goals set';
      return `${s.goalsAchieved}/${total} achieved`;
    },
    getSubtext: (s) => (s.goalsMissed > 0 ? `${s.goalsMissed} missed` : null),
    variant: 'neutral',
  },
];

/**
 * Create a summary cards component.
 */
export function createSummaryCards(options: SummaryCardsOptions): SummaryCardsComponent {
  let trajectory = options.trajectory;

  const container = createElement('div', { class: 'summary-cards' });

  function render(): void {
    clearChildren(container);

    const summary = trajectory.summary;

    for (const card of CARDS) {
      const cardEl = createElement('div', {
        class: `summary-card summary-card--${card.variant ?? 'neutral'}`,
      });

      // Label
      cardEl.appendChild(
        createElement('div', { class: 'summary-card__label' }, [card.label])
      );

      // Value
      cardEl.appendChild(
        createElement('div', { class: 'summary-card__value' }, [
          card.getValue(summary, trajectory),
        ])
      );

      // Subtext
      const subtext = card.getSubtext?.(summary, trajectory);
      if (subtext) {
        cardEl.appendChild(
          createElement('div', { class: 'summary-card__subtext' }, [subtext])
        );
      }

      container.appendChild(cardEl);
    }
  }

  function setTrajectory(newTrajectory: Trajectory): void {
    trajectory = newTrajectory;
    render();
  }

  // Initial render
  render();

  return {
    element: container,
    setTrajectory,
    destroy(): void {
      clearChildren(container);
    },
  };
}
