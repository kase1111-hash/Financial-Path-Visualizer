/**
 * Milestone List Component
 *
 * Displays chronological list of milestones in the trajectory.
 */

import type { Milestone, MilestoneType } from '@models/trajectory';
import { createElement, clearChildren } from '@ui/utils/dom';
import { MILESTONE_ICONS } from './chart-utils';

export interface MilestoneListOptions {
  milestones: Milestone[];
  onMilestoneClick?: (milestone: Milestone) => void;
  compact?: boolean;
}

export interface MilestoneListComponent {
  element: HTMLElement;
  setMilestones(milestones: Milestone[]): void;
  highlightYear(year: number | null): void;
  destroy(): void;
}

/**
 * Milestone type display configuration.
 */
const MILESTONE_CONFIG: Record<
  MilestoneType,
  { label: string; icon: string; className: string }
> = {
  debt_payoff: {
    label: 'Debt Paid Off',
    icon: MILESTONE_ICONS.debt_payoff ?? '✓',
    className: 'milestone--debt',
  },
  goal_achieved: {
    label: 'Goal Achieved',
    icon: MILESTONE_ICONS.goal_achieved ?? '★',
    className: 'milestone--goal-achieved',
  },
  goal_missed: {
    label: 'Goal Missed',
    icon: MILESTONE_ICONS.goal_missed ?? '✗',
    className: 'milestone--goal-missed',
  },
  retirement_ready: {
    label: 'Retirement Ready',
    icon: MILESTONE_ICONS.retirement_ready ?? '🎉',
    className: 'milestone--retirement',
  },
  pmi_removed: {
    label: 'PMI Removed',
    icon: MILESTONE_ICONS.pmi_removed ?? '🏠',
    className: 'milestone--pmi',
  },
  net_worth_milestone: {
    label: 'Net Worth Milestone',
    icon: MILESTONE_ICONS.net_worth_milestone ?? '💰',
    className: 'milestone--net-worth',
  },
};

/**
 * Format month name.
 */
function formatMonth(month: number): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return monthNames[month - 1] ?? '';
}

/**
 * Create a milestone list component.
 */
export function createMilestoneList(options: MilestoneListOptions): MilestoneListComponent {
  const { onMilestoneClick, compact = false } = options;
  let milestones = [...options.milestones].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  let highlightedYear: number | null = null;

  const container = createElement('div', {
    class: `milestone-list${compact ? ' milestone-list--compact' : ''}`,
  });

  function render(): void {
    clearChildren(container);

    if (milestones.length === 0) {
      container.appendChild(
        createElement('div', { class: 'milestone-list__empty' }, [
          'No milestones yet.',
        ])
      );
      return;
    }

    // Header
    const header = createElement('div', { class: 'milestone-list__header' });
    header.appendChild(
      createElement('h3', { class: 'milestone-list__title' }, [
        `Milestones (${milestones.length})`,
      ])
    );
    container.appendChild(header);

    // List
    const list = createElement('ul', { class: 'milestone-list__items' });

    for (const milestone of milestones) {
      const config = MILESTONE_CONFIG[milestone.type];
      const isHighlighted = highlightedYear !== null && milestone.year === highlightedYear;

      const item = createElement(
        'li',
        {
          class: `milestone-list__item ${config.className}${isHighlighted ? ' milestone-list__item--highlighted' : ''}`,
          'data-year': String(milestone.year),
        }
      );

      // Icon
      item.appendChild(
        createElement('span', { class: 'milestone-list__icon' }, [config.icon])
      );

      // Content
      const content = createElement('div', { class: 'milestone-list__content' });

      // Date
      content.appendChild(
        createElement('span', { class: 'milestone-list__date' }, [
          `${formatMonth(milestone.month)} ${milestone.year}`,
        ])
      );

      // Description
      content.appendChild(
        createElement('span', { class: 'milestone-list__description' }, [
          milestone.description,
        ])
      );

      item.appendChild(content);

      // Click handler
      if (onMilestoneClick) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => { onMilestoneClick(milestone); });
      }

      list.appendChild(item);
    }

    container.appendChild(list);
  }

  function setMilestones(newMilestones: Milestone[]): void {
    milestones = [...newMilestones].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    render();
  }

  function highlightYear(year: number | null): void {
    highlightedYear = year;

    // Update highlight classes without full re-render
    const items = container.querySelectorAll('.milestone-list__item');
    items.forEach((item) => {
      const itemYear = parseInt(item.getAttribute('data-year') ?? '0', 10);
      if (year !== null && itemYear === year) {
        item.classList.add('milestone-list__item--highlighted');
      } else {
        item.classList.remove('milestone-list__item--highlighted');
      }
    });
  }

  // Initial render
  render();

  return {
    element: container,
    setMilestones,
    highlightYear,
    destroy(): void {
      clearChildren(container);
    },
  };
}
