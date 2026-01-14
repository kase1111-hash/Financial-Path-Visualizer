/**
 * Trajectory View
 *
 * Display financial projection trajectory.
 * Note: Chart visualization will be added in Phase 6.
 */

import type { FinancialProfile } from '@models/profile';
import type { Trajectory } from '@models/trajectory';
import { createElement, clearChildren } from '@ui/utils/dom';
import { createButton } from '@ui/components/Button';
import { formatCurrency, formatPercent } from '@ui/utils/format';
import { navigate } from '@ui/utils/state';
import { generateTrajectory } from '@engine/projector';

export interface TrajectoryViewOptions {
  /** Profile to project */
  profile: FinancialProfile;
}

export interface TrajectoryViewComponent {
  /** The DOM element */
  element: HTMLElement;
  /** Update with new profile */
  update(profile: FinancialProfile): void;
  /** Destroy component */
  destroy(): void;
}

/**
 * Create a trajectory view component.
 */
export function createTrajectoryView(options: TrajectoryViewOptions): TrajectoryViewComponent {
  let profile = options.profile;
  let trajectory: Trajectory | null = null;

  const container = createElement('div', { class: 'trajectory-view' });
  const components: { destroy(): void }[] = [];

  // Header
  const header = createElement('header', { class: 'trajectory-view__header' });

  const headerLeft = createElement('div', { class: 'trajectory-view__header-left' });
  const title = createElement('h1', { class: 'trajectory-view__title' }, [profile.name]);
  headerLeft.appendChild(title);
  header.appendChild(headerLeft);

  const headerActions = createElement('div', { class: 'trajectory-view__actions' });

  const editButton = createButton({
    text: 'Edit Profile',
    variant: 'secondary',
    onClick: () => navigate('editor'),
  });
  components.push(editButton);
  headerActions.appendChild(editButton.element);

  const compareButton = createButton({
    text: 'Compare Scenarios',
    variant: 'ghost',
    onClick: () => navigate('compare'),
  });
  components.push(compareButton);
  headerActions.appendChild(compareButton.element);

  header.appendChild(headerActions);
  container.appendChild(header);

  // Summary cards
  const summarySection = createElement('section', { class: 'trajectory-view__summary' });
  container.appendChild(summarySection);

  // Milestones
  const milestonesSection = createElement('section', { class: 'trajectory-view__milestones' });
  milestonesSection.appendChild(
    createElement('h2', { class: 'trajectory-view__section-title' }, ['Key Milestones'])
  );
  const milestonesList = createElement('div', { class: 'trajectory-view__milestones-list' });
  milestonesSection.appendChild(milestonesList);
  container.appendChild(milestonesSection);

  // Year-by-year table
  const tableSection = createElement('section', { class: 'trajectory-view__table-section' });
  tableSection.appendChild(
    createElement('h2', { class: 'trajectory-view__section-title' }, ['Year-by-Year Projection'])
  );
  const tableContainer = createElement('div', { class: 'trajectory-view__table-container' });
  tableSection.appendChild(tableContainer);
  container.appendChild(tableSection);

  function calculateAndRender(): void {
    trajectory = generateTrajectory(profile);
    renderSummary();
    renderMilestones();
    renderTable();
  }

  function renderSummary(): void {
    clearChildren(summarySection);

    if (!trajectory || trajectory.years.length === 0) return;

    const firstYear = trajectory.years[0];
    const lastYear = trajectory.years[trajectory.years.length - 1];

    if (!firstYear || !lastYear) return;

    const summaryCards = [
      {
        label: 'Current Net Worth',
        value: formatCurrency(firstYear.netWorth, { compact: true }),
        subtitle: 'Total assets minus debts',
      },
      {
        label: 'Projected Net Worth',
        value: formatCurrency(lastYear.netWorth, { compact: true }),
        subtitle: `In ${trajectory.years.length} years`,
      },
      {
        label: 'Annual Income',
        value: formatCurrency(firstYear.grossIncome, { compact: true }),
        subtitle: 'Before taxes',
      },
      {
        label: 'Savings Rate',
        value: formatPercent(firstYear.savingsRate),
        subtitle: 'Of net income',
      },
    ];

    for (const card of summaryCards) {
      const cardEl = createElement('div', { class: 'summary-card' });
      cardEl.appendChild(createElement('div', { class: 'summary-card__label' }, [card.label]));
      cardEl.appendChild(createElement('div', { class: 'summary-card__value' }, [card.value]));
      cardEl.appendChild(
        createElement('div', { class: 'summary-card__subtitle' }, [card.subtitle])
      );
      summarySection.appendChild(cardEl);
    }
  }

  function renderMilestones(): void {
    clearChildren(milestonesList);

    if (!trajectory || trajectory.milestones.length === 0) {
      milestonesList.appendChild(
        createElement('p', { class: 'trajectory-view__empty' }, [
          'No milestones reached yet. Keep tracking your progress!',
        ])
      );
      return;
    }

    for (const milestone of trajectory.milestones) {
      const milestoneEl = createElement('div', { class: 'milestone-card' });

      const icon = getMilestoneIcon(milestone.type);
      milestoneEl.appendChild(createElement('div', { class: 'milestone-card__icon' }, [icon]));

      const content = createElement('div', { class: 'milestone-card__content' });
      content.appendChild(
        createElement('div', { class: 'milestone-card__title' }, [milestone.description])
      );
      content.appendChild(
        createElement('div', { class: 'milestone-card__date' }, [
          `${milestone.month}/${milestone.year}`,
        ])
      );
      milestoneEl.appendChild(content);

      milestonesList.appendChild(milestoneEl);
    }
  }

  function getMilestoneIcon(type: string): string {
    const icons: Record<string, string> = {
      debt_payoff: '🎉',
      goal_achieved: '🎯',
      net_worth_milestone: '📈',
      retirement_ready: '🏖️',
      pmi_removed: '🏠',
    };
    return icons[type] ?? '✓';
  }

  function renderTable(): void {
    clearChildren(tableContainer);

    if (!trajectory || trajectory.years.length === 0) return;

    const table = createElement('table', { class: 'trajectory-table' });

    // Header
    const thead = createElement('thead');
    const headerRow = createElement('tr');
    const headers = ['Year', 'Age', 'Income', 'Savings Rate', 'Assets', 'Debt', 'Net Worth'];

    for (const h of headers) {
      headerRow.appendChild(createElement('th', {}, [h]));
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = createElement('tbody');

    for (const year of trajectory.years) {
      const row = createElement('tr');

      row.appendChild(createElement('td', {}, [String(year.year)]));
      row.appendChild(createElement('td', {}, [String(year.age)]));
      row.appendChild(
        createElement('td', {}, [formatCurrency(year.grossIncome, { compact: true })])
      );
      row.appendChild(
        createElement('td', {}, [formatPercent(year.savingsRate)])
      );
      row.appendChild(
        createElement('td', { class: 'text-positive' }, [
          formatCurrency(year.totalAssets, { compact: true }),
        ])
      );
      row.appendChild(
        createElement('td', { class: year.totalDebt > 0 ? 'text-negative' : '' }, [
          formatCurrency(year.totalDebt, { compact: true }),
        ])
      );
      row.appendChild(
        createElement(
          'td',
          { class: year.netWorth >= 0 ? 'text-positive' : 'text-negative' },
          [formatCurrency(year.netWorth, { compact: true })]
        )
      );

      tbody.appendChild(row);
    }

    table.appendChild(tbody);
    tableContainer.appendChild(table);
  }

  // Initial calculation
  calculateAndRender();

  return {
    element: container,

    update(newProfile: FinancialProfile): void {
      profile = newProfile;
      title.textContent = profile.name;
      calculateAndRender();
    },

    destroy(): void {
      for (const component of components) {
        component.destroy();
      }
    },
  };
}
