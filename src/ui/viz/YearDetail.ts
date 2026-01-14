/**
 * Year Detail Panel Component
 *
 * Displays detailed financial information for a selected year.
 */

import type { TrajectoryYear, Milestone } from '@models/trajectory';
import type { FinancialProfile } from '@models/profile';
import { createElement, clearChildren } from '@ui/utils/dom';
import { formatCurrency, formatPercent, formatNumber } from '@ui/utils/format';

export interface YearDetailOptions {
  profile: FinancialProfile;
  milestones?: Milestone[];
  onClose?: () => void;
}

export interface YearDetailComponent {
  element: HTMLElement;
  setYear(year: TrajectoryYear | null, milestones?: Milestone[]): void;
  destroy(): void;
}

/**
 * Create a year detail panel component.
 */
export function createYearDetail(options: YearDetailOptions): YearDetailComponent {
  const { profile, onClose } = options;
  let currentYear: TrajectoryYear | null = null;
  let currentMilestones: Milestone[] = options.milestones ?? [];

  const container = createElement('div', { class: 'year-detail' });

  function render(): void {
    clearChildren(container);

    if (!currentYear) {
      container.appendChild(
        createElement('div', { class: 'year-detail__empty' }, [
          createElement('p', {}, ['Select a year on the chart to see details.']),
        ])
      );
      return;
    }

    // Header
    const header = createElement('div', { class: 'year-detail__header' });
    header.appendChild(
      createElement('h3', { class: 'year-detail__title' }, [
        `Year ${currentYear.year}`,
      ])
    );
    header.appendChild(
      createElement('span', { class: 'year-detail__age' }, [`Age ${currentYear.age}`])
    );

    if (onClose) {
      const closeBtn = createElement(
        'button',
        { type: 'button', class: 'year-detail__close', 'aria-label': 'Close' },
        ['×']
      );
      closeBtn.addEventListener('click', onClose);
      header.appendChild(closeBtn);
    }

    container.appendChild(header);

    // Milestones for this year
    const yearMilestones = currentMilestones.filter((m) => m.year === currentYear!.year);
    if (yearMilestones.length > 0) {
      const milestonesSection = createElement('div', { class: 'year-detail__milestones' });
      for (const milestone of yearMilestones) {
        milestonesSection.appendChild(
          createElement('div', { class: `year-detail__milestone year-detail__milestone--${milestone.type}` }, [
            milestone.description,
          ])
        );
      }
      container.appendChild(milestonesSection);
    }

    // Income Section
    const incomeSection = createSection('Income & Taxes');
    incomeSection.appendChild(
      createRow('Gross Income', formatCurrency(currentYear.grossIncome, { compact: true }))
    );
    incomeSection.appendChild(
      createRow('Federal Tax', formatCurrency(currentYear.taxFederal, { compact: true }), 'negative')
    );
    incomeSection.appendChild(
      createRow('State Tax', formatCurrency(currentYear.taxState, { compact: true }), 'negative')
    );
    incomeSection.appendChild(
      createRow('FICA', formatCurrency(currentYear.taxFica, { compact: true }), 'negative')
    );
    incomeSection.appendChild(createDivider());
    incomeSection.appendChild(
      createRow('Net Income', formatCurrency(currentYear.netIncome, { compact: true }), 'highlight')
    );
    incomeSection.appendChild(
      createRow('Effective Tax Rate', formatPercent(currentYear.effectiveTaxRate))
    );
    container.appendChild(incomeSection);

    // Work Section
    if (currentYear.totalWorkHours > 0) {
      const workSection = createSection('Work');
      workSection.appendChild(
        createRow('Hours Worked', formatNumber(currentYear.totalWorkHours))
      );
      workSection.appendChild(
        createRow('Effective Hourly Rate', `${formatCurrency(currentYear.effectiveHourlyRate)}/hr`)
      );
      container.appendChild(workSection);
    }

    // Net Worth Section
    const worthSection = createSection('Net Worth');
    worthSection.appendChild(
      createRow(
        'Total Assets',
        formatCurrency(currentYear.totalAssets, { compact: true }),
        'positive'
      )
    );
    worthSection.appendChild(
      createRow(
        'Total Debt',
        formatCurrency(currentYear.totalDebt, { compact: true }),
        currentYear.totalDebt > 0 ? 'negative' : undefined
      )
    );
    worthSection.appendChild(createDivider());
    worthSection.appendChild(
      createRow(
        'Net Worth',
        formatCurrency(currentYear.netWorth, { compact: true }),
        currentYear.netWorth >= 0 ? 'highlight' : 'negative'
      )
    );
    container.appendChild(worthSection);

    // Assets Detail
    if (currentYear.assets.length > 0) {
      const assetsSection = createSection('Assets');
      for (const asset of currentYear.assets) {
        const profileAsset = profile.assets.find((a) => a.id === asset.assetId);
        if (profileAsset) {
          assetsSection.appendChild(
            createRow(profileAsset.name, formatCurrency(asset.balance, { compact: true }))
          );
        }
      }
      container.appendChild(assetsSection);
    }

    // Debts Detail
    if (currentYear.debts.length > 0) {
      const debtsSection = createSection('Debts');
      for (const debt of currentYear.debts) {
        const profileDebt = profile.debts.find((d) => d.id === debt.debtId);
        if (profileDebt) {
          const label = debt.isPaidOff ? `${profileDebt.name} ✓` : profileDebt.name;
          debtsSection.appendChild(
            createRow(
              label,
              debt.isPaidOff ? 'Paid off!' : formatCurrency(debt.remainingPrincipal, { compact: true }),
              debt.isPaidOff ? 'positive' : undefined
            )
          );
        }
      }
      debtsSection.appendChild(createDivider());
      debtsSection.appendChild(
        createRow('Interest Paid', formatCurrency(currentYear.totalInterestPaid, { compact: true }), 'negative')
      );
      container.appendChild(debtsSection);
    }

    // Cash Flow Section
    const cashFlowSection = createSection('Cash Flow');
    cashFlowSection.appendChild(
      createRow('Net Income', formatCurrency(currentYear.netIncome, { compact: true }))
    );
    cashFlowSection.appendChild(
      createRow('Debt Payments', formatCurrency(currentYear.totalDebtPayment, { compact: true }), 'negative')
    );
    cashFlowSection.appendChild(
      createRow('Obligations', formatCurrency(currentYear.totalObligations, { compact: true }), 'negative')
    );
    cashFlowSection.appendChild(createDivider());
    cashFlowSection.appendChild(
      createRow(
        'Discretionary',
        formatCurrency(currentYear.discretionaryIncome, { compact: true }),
        currentYear.discretionaryIncome >= 0 ? 'positive' : 'negative'
      )
    );
    cashFlowSection.appendChild(
      createRow('Savings Rate', formatPercent(currentYear.savingsRate))
    );
    container.appendChild(cashFlowSection);

    // Housing Section (if applicable)
    if (currentYear.homeEquity > 0 || currentYear.payingPmi) {
      const housingSection = createSection('Housing');
      housingSection.appendChild(
        createRow('Home Equity', formatCurrency(currentYear.homeEquity, { compact: true }), 'positive')
      );
      housingSection.appendChild(
        createRow('LTV Ratio', formatPercent(currentYear.ltvRatio))
      );
      if (currentYear.payingPmi) {
        housingSection.appendChild(
          createRow('PMI', 'Still paying', 'negative')
        );
      }
      container.appendChild(housingSection);
    }
  }

  function createSection(title: string): HTMLElement {
    const section = createElement('div', { class: 'year-detail__section' });
    section.appendChild(
      createElement('h4', { class: 'year-detail__section-title' }, [title])
    );
    return section;
  }

  function createRow(label: string, value: string, variant?: 'positive' | 'negative' | 'highlight'): HTMLElement {
    const row = createElement('div', { class: 'year-detail__row' });
    row.appendChild(createElement('span', { class: 'year-detail__label' }, [label]));
    row.appendChild(
      createElement(
        'span',
        { class: `year-detail__value${variant ? ` year-detail__value--${variant}` : ''}` },
        [value]
      )
    );
    return row;
  }

  function createDivider(): HTMLElement {
    return createElement('div', { class: 'year-detail__divider' });
  }

  function setYear(year: TrajectoryYear | null, milestones?: Milestone[]): void {
    currentYear = year;
    if (milestones !== undefined) {
      currentMilestones = milestones;
    }
    render();
  }

  // Initial render
  render();

  return {
    element: container,
    setYear,
    destroy(): void {
      clearChildren(container);
    },
  };
}
