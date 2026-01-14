/**
 * Income Editor Section
 *
 * Edit income sources in the profile.
 */

import type { Income, IncomeType } from '@models/income';
import type { FinancialProfile } from '@models/profile';
import { createIncome, calculateAnnualIncome } from '@models/income';
import { generateId } from '@models/common';
import { createElement, clearChildren } from '@ui/utils/dom';
import { formatCurrency, formatPercent, formatMonthYear } from '@ui/utils/format';
import { createEditorSection } from '@ui/components/EditorSection';
import { createItemCard } from '@ui/components/ItemCard';
import { createModal } from '@ui/components/Modal';
import {
  createTextInput,
  createCurrencyInput,
  createPercentageInput,
  createNumberInput,
  createSelect,
  createMonthYearInput,
} from '@ui/components/form';

export interface IncomeEditorOptions {
  profile: FinancialProfile;
  onChange: (income: Income[]) => void;
}

export interface IncomeEditorComponent {
  element: HTMLElement;
  update(profile: FinancialProfile): void;
  destroy(): void;
}

export function createIncomeEditor(options: IncomeEditorOptions): IncomeEditorComponent {
  const { onChange } = options;
  let profile = options.profile;

  const components: { destroy(): void }[] = [];

  const section = createEditorSection({
    title: 'Income Sources',
    id: 'income',
    addButtonLabel: 'Add Income',
    onAdd: () => showIncomeModal(),
    emptyMessage: 'No income sources added yet. Add your salary, side gigs, or passive income.',
  });
  components.push(section);

  function renderIncomes(): void {
    clearChildren(section.content);

    const isEmpty = profile.income.length === 0;
    section.setEmpty(isEmpty);
    section.setCount(profile.income.length);

    if (isEmpty) {
      const emptyEl = createElement('div', { class: 'editor-section__empty' }, [
        'No income sources added yet. Add your salary, side gigs, or passive income.',
      ]);
      section.content.appendChild(emptyEl);
      return;
    }

    const totalIncome = profile.income.reduce(
      (sum: number, inc: Income) => sum + calculateAnnualIncome(inc),
      0
    );

    const summaryEl = createElement('div', { class: 'editor-section__summary' }, [
      `Total Annual Income: ${formatCurrency(totalIncome, { compact: true })}`,
    ]);
    section.content.appendChild(summaryEl);

    for (const income of profile.income) {
      const card = createIncomeCard(income);
      components.push(card);
      section.content.appendChild(card.element);
    }
  }

  function createIncomeCard(income: Income): ReturnType<typeof createItemCard> {
    const typeLabels: Record<IncomeType, string> = {
      salary: 'Salary',
      hourly: 'Hourly',
      variable: 'Variable',
      passive: 'Passive Income',
    };

    const annualAmount = calculateAnnualIncome(income);

    const details: { label: string; value: string }[] = [
      { label: 'Type', value: typeLabels[income.type] },
      { label: 'Growth Rate', value: formatPercent(income.expectedGrowth) },
    ];

    if (income.type === 'hourly') {
      details.push({ label: 'Hours/Week', value: String(income.hoursPerWeek) });
    }

    if (income.endDate) {
      details.push({ label: 'End Date', value: formatMonthYear(income.endDate) });
    }

    return createItemCard({
      title: income.name,
      primaryValue: formatCurrency(annualAmount, { compact: true }),
      subtitle: `${formatCurrency(Math.round(annualAmount / 12))}/month`,
      details,
      onEdit: () => showIncomeModal(income),
      onDelete: () => deleteIncome(income.id),
    });
  }

  function showIncomeModal(existingIncome?: Income): void {
    const isEditing = !!existingIncome;

    const formContainer = createElement('form', { class: 'modal-form' });
    const formComponents: { destroy(): void }[] = [];

    const nameInput = createTextInput({
      id: 'income-name',
      label: 'Name',
      value: existingIncome?.name ?? '',
      required: true,
      placeholder: 'e.g., Primary Salary',
    });
    formComponents.push(nameInput);
    formContainer.appendChild(nameInput.element);

    const typeSelect = createSelect<IncomeType>({
      id: 'income-type',
      label: 'Type',
      value: existingIncome?.type ?? 'salary',
      options: [
        { value: 'salary', label: 'Salary (Annual)' },
        { value: 'hourly', label: 'Hourly Wage' },
        { value: 'variable', label: 'Variable Income' },
        { value: 'passive', label: 'Passive Income' },
      ],
    });
    formComponents.push(typeSelect);
    formContainer.appendChild(typeSelect.element);

    const amountInput = createCurrencyInput({
      id: 'income-amount',
      label: 'Amount',
      value: existingIncome?.amount,
      required: true,
      min: 0,
      helpText: 'Annual amount for salary/passive, hourly rate for hourly',
    });
    formComponents.push(amountInput);
    formContainer.appendChild(amountInput.element);

    const hoursInput = createNumberInput({
      id: 'income-hours',
      label: 'Hours Per Week',
      value: existingIncome?.hoursPerWeek ?? 40,
      min: 0,
      max: 168,
      helpText: 'Used for hourly rate calculations',
    });
    formComponents.push(hoursInput);
    formContainer.appendChild(hoursInput.element);

    const growthInput = createPercentageInput({
      id: 'income-growth',
      label: 'Annual Growth Rate',
      value: existingIncome?.expectedGrowth ?? 0.02,
      min: -0.5,
      max: 0.5,
      helpText: 'Expected annual increase (e.g., raises)',
    });
    formComponents.push(growthInput);
    formContainer.appendChild(growthInput.element);

    const variabilityInput = createPercentageInput({
      id: 'income-variability',
      label: 'Variability',
      value: existingIncome?.variability ?? 0,
      min: 0,
      max: 1,
      helpText: '0 = stable, 1 = highly variable (for variable income)',
    });
    formComponents.push(variabilityInput);
    formContainer.appendChild(variabilityInput.element);

    const endInput = createMonthYearInput({
      id: 'income-end',
      label: 'End Date (Optional)',
      value: existingIncome?.endDate ?? undefined,
      helpText: 'Leave empty if ongoing',
    });
    formComponents.push(endInput);
    formContainer.appendChild(endInput.element);

    const modal = createModal({
      title: isEditing ? 'Edit Income' : 'Add Income',
      content: formContainer,
      size: 'large',
      primaryAction: isEditing ? 'Save Changes' : 'Add Income',
      secondaryAction: 'Cancel',
      onPrimary: async () => {
        const newIncome = createIncome({
          id: existingIncome?.id ?? generateId(),
          name: nameInput.getValue() || 'Income',
          type: typeSelect.getValue() ?? 'salary',
          amount: amountInput.getValue() ?? 0,
          hoursPerWeek: hoursInput.getValue() ?? 40,
          expectedGrowth: growthInput.getValue() ?? 0.02,
          variability: variabilityInput.getValue() ?? 0,
          endDate: endInput.getValue() ?? null,
        });

        if (isEditing) {
          const index = profile.income.findIndex((i: Income) => i.id === existingIncome.id);
          if (index >= 0) {
            profile.income[index] = newIncome;
          }
        } else {
          profile.income.push(newIncome);
        }

        onChange([...profile.income]);
        renderIncomes();
      },
      onClose: () => {
        for (const c of formComponents) {
          c.destroy();
        }
      },
    });

    modal.show();
  }

  function deleteIncome(id: string): void {
    profile.income = profile.income.filter((i: Income) => i.id !== id);
    onChange([...profile.income]);
    renderIncomes();
  }

  renderIncomes();

  return {
    element: section.element,

    update(newProfile: FinancialProfile): void {
      profile = newProfile;
      renderIncomes();
    },

    destroy(): void {
      for (const component of components) {
        component.destroy();
      }
    },
  };
}
