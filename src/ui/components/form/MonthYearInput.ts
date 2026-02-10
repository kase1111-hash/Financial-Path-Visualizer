/**
 * MonthYear Input Component
 *
 * Input for month/year date selection.
 */

import type { MonthYear } from '@models/common';
import { createElement } from '@ui/utils/dom';
import { formatMonthYear } from '@ui/utils/format';
import { createInputWrapper, type BaseInputOptions } from './BaseInput';

export interface MonthYearInputOptions extends BaseInputOptions {
  /** Initial value */
  value?: MonthYear | undefined;
  /** Minimum date */
  min?: MonthYear;
  /** Maximum date */
  max?: MonthYear;
  /** Called when value changes */
  onChange?: (value: MonthYear | null) => void;
}

export interface MonthYearInputComponent {
  /** The DOM element */
  element: HTMLDivElement;
  /** Get current value */
  getValue(): MonthYear | null;
  /** Set value */
  setValue(value: MonthYear | null): void;
  /** Set error message */
  setError(error: string | null): void;
  /** Destroy component */
  destroy(): void;
}

function compareMonthYear(a: MonthYear, b: MonthYear): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

/**
 * Create a month/year input component using native month input.
 */
export function createMonthYearInput(options: MonthYearInputOptions): MonthYearInputComponent {
  const { id, value, min, max, onChange, disabled } = options;

  let currentValue: MonthYear | null = value ?? null;
  let errorMessage: string | null = options.error ?? null;

  // Create the input element (type="month" for native support)
  const input = createElement('input', {
    type: 'month',
    id,
    name: id,
    disabled,
    class: 'form-field__input form-field__input--month',
  });

  // Set initial value in YYYY-MM format
  if (currentValue) {
    input.value = `${currentValue.year}-${String(currentValue.month).padStart(2, '0')}`;
  }

  // Set min/max
  if (min) {
    input.min = `${min.year}-${String(min.month).padStart(2, '0')}`;
  }
  if (max) {
    input.max = `${max.year}-${String(max.month).padStart(2, '0')}`;
  }

  function validate(date: MonthYear | null): string | null {
    if (date === null) return null;

    if (min && compareMonthYear(date, min) < 0) {
      return `Date must be after ${formatMonthYear(min)}`;
    }
    if (max && compareMonthYear(date, max) > 0) {
      return `Date must be before ${formatMonthYear(max)}`;
    }
    return null;
  }

  function handleChange(): void {
    const val = input.value;

    if (!val) {
      currentValue = null;
      errorMessage = null;
      onChange?.(null);
      return;
    }

    // Parse YYYY-MM format
    const parts = val.split('-');
    if (parts.length !== 2) {
      errorMessage = 'Invalid date';
      return;
    }

    const year = parseInt(parts[0] ?? '0', 10);
    const month = parseInt(parts[1] ?? '0', 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      errorMessage = 'Invalid date';
      return;
    }

    currentValue = { month, year };
    errorMessage = validate(currentValue);
    onChange?.(currentValue);
  }

  input.addEventListener('change', handleChange);

  // Build wrapper
  const wrapper = createInputWrapper(
    { ...options, error: errorMessage ?? undefined },
    input
  );

  return {
    element: wrapper,

    getValue(): MonthYear | null {
      return currentValue;
    },

    setValue(value: MonthYear | null): void {
      currentValue = value;
      if (value) {
        input.value = `${value.year}-${String(value.month).padStart(2, '0')}`;
      } else {
        input.value = '';
      }
    },

    setError(error: string | null): void {
      errorMessage = error;
      const errorEl = wrapper.querySelector('.form-field__error');
      if (error) {
        wrapper.classList.add('form-field--error');
        if (errorEl) {
          errorEl.textContent = error;
        } else {
          wrapper.appendChild(
            createElement('div', { class: 'form-field__error' }, [error])
          );
        }
      } else {
        wrapper.classList.remove('form-field--error');
        if (errorEl) {
          errorEl.remove();
        }
      }
    },

    destroy(): void {
      input.removeEventListener('change', handleChange);
    },
  };
}
