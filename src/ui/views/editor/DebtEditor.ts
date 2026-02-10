/**
 * Debt Editor Section
 *
 * Edit debts in the profile.
 */

import type { Debt, DebtType } from '@models/debt';
import type { FinancialProfile } from '@models/profile';
import { createDebt } from '@models/debt';
import { generateId } from '@models/common';
import { createElement, clearChildren } from '@ui/utils/dom';
import { formatCurrency, formatPercent } from '@ui/utils/format';
import { createEditorSection } from '@ui/components/EditorSection';
import { createItemCard } from '@ui/components/ItemCard';
import { createModal } from '@ui/components/Modal';
import {
  createTextInput,
  createCurrencyInput,
  createPercentageInput,
  createSelect,
  createNumberInput,
} from '@ui/components/form';

export interface DebtEditorOptions {
  profile: FinancialProfile;
  onChange: (debts: Debt[]) => void;
}

export interface DebtEditorComponent {
  element: HTMLElement;
  update(profile: FinancialProfile): void;
  destroy(): void;
}

export function createDebtEditor(options: DebtEditorOptions): DebtEditorComponent {
  const { onChange } = options;
  let profile = options.profile;

  const components: { destroy(): void }[] = [];

  const section = createEditorSection({
    title: 'Debts',
    id: 'debts',
    addButtonLabel: 'Add Debt',
    onAdd: () => { showDebtModal(); },
    emptyMessage: 'No debts added. Add your mortgage, loans, or credit cards.',
  });
  components.push(section);

  function renderDebts(): void {
    clearChildren(section.content);

    const isEmpty = profile.debts.length === 0;
    section.setEmpty(isEmpty);
    section.setCount(profile.debts.length);

    if (isEmpty) {
      const emptyEl = createElement('div', { class: 'editor-section__empty' }, [
        'No debts added. Add your mortgage, loans, or credit cards.',
      ]);
      section.content.appendChild(emptyEl);
      return;
    }

    const totalDebt = profile.debts.reduce((sum: number, d: Debt) => sum + d.principal, 0);

    const summaryEl = createElement('div', { class: 'editor-section__summary' }, [
      `Total Debt: ${formatCurrency(totalDebt, { compact: true })}`,
    ]);
    section.content.appendChild(summaryEl);

    for (const debt of profile.debts) {
      const card = createDebtCard(debt);
      components.push(card);
      section.content.appendChild(card.element);
    }
  }

  function createDebtCard(debt: Debt): ReturnType<typeof createItemCard> {
    const typeLabels: Record<DebtType, string> = {
      mortgage: 'Mortgage',
      student: 'Student Loan',
      auto: 'Auto Loan',
      credit: 'Credit Card',
      personal: 'Personal Loan',
      other: 'Other',
    };

    const details: { label: string; value: string }[] = [
      { label: 'Type', value: typeLabels[debt.type] },
      { label: 'Interest Rate', value: formatPercent(debt.interestRate) },
      { label: 'Monthly Payment', value: formatCurrency(debt.actualPayment) },
    ];

    if (debt.monthsRemaining > 0) {
      details.push({ label: 'Months Left', value: String(debt.monthsRemaining) });
    }

    return createItemCard({
      title: debt.name,
      primaryValue: formatCurrency(debt.principal, { compact: true }),
      subtitle: `${formatPercent(debt.interestRate)} APR`,
      details,
      onEdit: () => { showDebtModal(debt); },
      onDelete: () => { deleteDebt(debt.id); },
    });
  }

  function showDebtModal(existingDebt?: Debt): void {
    const isEditing = !!existingDebt;

    const formContainer = createElement('form', { class: 'modal-form' });
    const formComponents: { destroy(): void }[] = [];

    const nameInput = createTextInput({
      id: 'debt-name',
      label: 'Name',
      value: existingDebt?.name ?? '',
      required: true,
      placeholder: 'e.g., Home Mortgage',
    });
    formComponents.push(nameInput);
    formContainer.appendChild(nameInput.element);

    const typeSelect = createSelect<DebtType>({
      id: 'debt-type',
      label: 'Type',
      value: existingDebt?.type ?? 'other',
      options: [
        { value: 'mortgage', label: 'Mortgage' },
        { value: 'student', label: 'Student Loan' },
        { value: 'auto', label: 'Auto Loan' },
        { value: 'credit', label: 'Credit Card' },
        { value: 'personal', label: 'Personal Loan' },
        { value: 'other', label: 'Other' },
      ],
    });
    formComponents.push(typeSelect);
    formContainer.appendChild(typeSelect.element);

    const principalInput = createCurrencyInput({
      id: 'debt-principal',
      label: 'Current Balance',
      value: existingDebt?.principal,
      required: true,
      min: 0,
    });
    formComponents.push(principalInput);
    formContainer.appendChild(principalInput.element);

    const rateInput = createPercentageInput({
      id: 'debt-rate',
      label: 'Interest Rate (APR)',
      value: existingDebt?.interestRate ?? 0.05,
      min: 0,
      max: 0.5,
    });
    formComponents.push(rateInput);
    formContainer.appendChild(rateInput.element);

    const paymentInput = createCurrencyInput({
      id: 'debt-payment',
      label: 'Monthly Payment',
      value: existingDebt?.actualPayment,
      required: true,
      min: 0,
    });
    formComponents.push(paymentInput);
    formContainer.appendChild(paymentInput.element);

    const monthsInput = createNumberInput({
      id: 'debt-months',
      label: 'Months Remaining',
      value: existingDebt?.monthsRemaining ?? 0,
      min: 0,
      max: 600,
    });
    formComponents.push(monthsInput);
    formContainer.appendChild(monthsInput.element);

    const modal = createModal({
      title: isEditing ? 'Edit Debt' : 'Add Debt',
      content: formContainer,
      primaryAction: isEditing ? 'Save Changes' : 'Add Debt',
      secondaryAction: 'Cancel',
      onPrimary: () => {
        const newDebt = createDebt({
          id: existingDebt?.id ?? generateId(),
          name: nameInput.getValue() || 'Debt',
          type: typeSelect.getValue() ?? 'other',
          principal: principalInput.getValue() ?? 0,
          interestRate: rateInput.getValue() ?? 0.05,
          minimumPayment: paymentInput.getValue() ?? 0,
          actualPayment: paymentInput.getValue() ?? 0,
          termMonths: monthsInput.getValue() ?? 0,
          monthsRemaining: monthsInput.getValue() ?? 0,
        });

        if (isEditing) {
          const index = profile.debts.findIndex((d: Debt) => d.id === existingDebt.id);
          if (index >= 0) {
            profile.debts[index] = newDebt;
          }
        } else {
          profile.debts.push(newDebt);
        }

        onChange([...profile.debts]);
        renderDebts();
      },
      onClose: () => {
        for (const c of formComponents) {
          c.destroy();
        }
      },
    });

    modal.show();
  }

  function deleteDebt(id: string): void {
    profile.debts = profile.debts.filter((d: Debt) => d.id !== id);
    onChange([...profile.debts]);
    renderDebts();
  }

  renderDebts();

  return {
    element: section.element,

    update(newProfile: FinancialProfile): void {
      profile = newProfile;
      renderDebts();
    },

    destroy(): void {
      for (const component of components) {
        component.destroy();
      }
    },
  };
}
