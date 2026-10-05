/**
 * Expense Editor Section
 *
 * Edit recurring monthly living expenses (obligations) in the profile.
 * Expenses are what make leftover income meaningful: income that isn't
 * spent here, on debts, or on savings contributions accumulates as cash.
 */

import type { Obligation, ObligationCategory } from '@models/obligation';
import type { FinancialProfile } from '@models/profile';
import { createObligation } from '@models/obligation';
import { generateId } from '@models/common';
import { createElement, clearChildren } from '@ui/utils/dom';
import { formatCurrency } from '@ui/utils/format';
import { createEditorSection } from '@ui/components/EditorSection';
import { createItemCard } from '@ui/components/ItemCard';
import { createModal } from '@ui/components/Modal';
import { createTextInput, createCurrencyInput, createSelect } from '@ui/components/form';

export interface ExpenseEditorOptions {
  profile: FinancialProfile;
  onChange: (obligations: Obligation[]) => void;
}

export interface ExpenseEditorComponent {
  element: HTMLElement;
  update(profile: FinancialProfile): void;
  destroy(): void;
}

const CATEGORY_LABELS: Record<ObligationCategory, string> = {
  housing: 'Housing (rent, HOA)',
  utilities: 'Utilities',
  transport: 'Transportation',
  food: 'Food',
  insurance: 'Insurance',
  subscription: 'Subscriptions',
  healthcare: 'Healthcare',
  childcare: 'Childcare',
  other: 'Other / General living',
};

const EMPTY_MESSAGE =
  'No expenses added. Add your monthly living costs (rent, food, bills) so leftover income can be tracked as savings.';

export function createExpenseEditor(options: ExpenseEditorOptions): ExpenseEditorComponent {
  const { onChange } = options;
  let profile = options.profile;

  const components: { destroy(): void }[] = [];

  const section = createEditorSection({
    title: 'Monthly Expenses',
    id: 'expenses',
    addButtonLabel: 'Add Expense',
    onAdd: () => { showExpenseModal(); },
    emptyMessage: EMPTY_MESSAGE,
  });
  components.push(section);

  function renderExpenses(): void {
    clearChildren(section.content);

    const isEmpty = profile.obligations.length === 0;
    section.setEmpty(isEmpty);
    section.setCount(profile.obligations.length);

    if (isEmpty) {
      section.content.appendChild(
        createElement('div', { class: 'editor-section__empty' }, [EMPTY_MESSAGE])
      );
      return;
    }

    const totalMonthly = profile.obligations.reduce((sum, o) => sum + o.amount, 0);
    section.content.appendChild(
      createElement('div', { class: 'editor-section__summary' }, [
        `Total: ${formatCurrency(totalMonthly)}/month`,
      ])
    );

    for (const obligation of profile.obligations) {
      const card = createItemCard({
        title: obligation.name,
        primaryValue: `${formatCurrency(obligation.amount)}/mo`,
        subtitle: CATEGORY_LABELS[obligation.category],
        details: [{ label: 'Per Year', value: formatCurrency(obligation.amount * 12) }],
        onEdit: () => { showExpenseModal(obligation); },
        onDelete: () => { deleteExpense(obligation.id); },
      });
      components.push(card);
      section.content.appendChild(card.element);
    }
  }

  function showExpenseModal(existing?: Obligation): void {
    const isEditing = !!existing;

    const formContainer = createElement('form', { class: 'modal-form' });
    const formComponents: { destroy(): void }[] = [];

    const nameInput = createTextInput({
      id: 'expense-name',
      label: 'Name',
      value: existing?.name ?? '',
      required: true,
      placeholder: 'e.g., Rent',
    });
    formComponents.push(nameInput);
    formContainer.appendChild(nameInput.element);

    const categorySelect = createSelect<ObligationCategory>({
      id: 'expense-category',
      label: 'Category',
      value: existing?.category ?? 'other',
      options: (Object.keys(CATEGORY_LABELS) as ObligationCategory[]).map((value) => ({
        value,
        label: CATEGORY_LABELS[value],
      })),
    });
    formComponents.push(categorySelect);
    formContainer.appendChild(categorySelect.element);

    const amountInput = createCurrencyInput({
      id: 'expense-amount',
      label: 'Monthly Amount',
      value: existing?.amount,
      required: true,
      min: 0,
      helpText: 'Grows with inflation in the projection',
    });
    formComponents.push(amountInput);
    formContainer.appendChild(amountInput.element);

    const modal = createModal({
      title: isEditing ? 'Edit Expense' : 'Add Expense',
      content: formContainer,
      primaryAction: isEditing ? 'Save Changes' : 'Add Expense',
      secondaryAction: 'Cancel',
      onPrimary: () => {
        const obligation = createObligation({
          ...existing,
          id: existing?.id ?? generateId(),
          name: nameInput.getValue() || 'Expense',
          category: categorySelect.getValue() ?? 'other',
          amount: amountInput.getValue() ?? 0,
        });

        if (isEditing) {
          const index = profile.obligations.findIndex((o) => o.id === existing.id);
          if (index >= 0) {
            profile.obligations[index] = obligation;
          }
        } else {
          profile.obligations.push(obligation);
        }

        onChange([...profile.obligations]);
        renderExpenses();
      },
      onClose: () => {
        for (const c of formComponents) {
          c.destroy();
        }
      },
    });

    modal.show();
  }

  function deleteExpense(id: string): void {
    profile.obligations = profile.obligations.filter((o) => o.id !== id);
    onChange([...profile.obligations]);
    renderExpenses();
  }

  renderExpenses();

  return {
    element: section.element,

    update(newProfile: FinancialProfile): void {
      profile = newProfile;
      renderExpenses();
    },

    destroy(): void {
      for (const component of components) {
        component.destroy();
      }
    },
  };
}
