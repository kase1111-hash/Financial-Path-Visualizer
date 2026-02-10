/**
 * Currency Input Component
 *
 * Input for dollar amounts, stores value as cents internally.
 */

import type { Cents } from '@models/common';
import { createElement } from '@ui/utils/dom';
import { formatCurrency, parseCurrency } from '@ui/utils/format';
import { createInputWrapper, type BaseInputOptions } from './BaseInput';

export interface CurrencyInputOptions extends BaseInputOptions {
  /** Initial value in cents */
  value?: Cents | undefined;
  /** Minimum value in cents */
  min?: Cents;
  /** Maximum value in cents */
  max?: Cents;
  /** Called when value changes */
  onChange?: (value: Cents | null) => void;
  /** Whether to allow negative values */
  allowNegative?: boolean;
}

export interface CurrencyInputComponent {
  /** The DOM element */
  element: HTMLDivElement;
  /** Get current value in cents */
  getValue(): Cents | null;
  /** Set value in cents */
  setValue(value: Cents | null): void;
  /** Set error message */
  setError(error: string | null): void;
  /** Destroy component */
  destroy(): void;
}

/**
 * Create a currency input component.
 */
export function createCurrencyInput(options: CurrencyInputOptions): CurrencyInputComponent {
  const {
    id,
    value,
    min,
    max,
    onChange,
    allowNegative = false,
    disabled,
    placeholder = '$0',
  } = options;

  let currentValue: Cents | null = value ?? null;
  let errorMessage: string | null = options.error ?? null;

  // Create the input element
  const input = createElement('input', {
    type: 'text',
    id,
    name: id,
    placeholder,
    disabled,
    class: 'form-field__input form-field__input--currency',
    inputmode: 'decimal',
    autocomplete: 'off',
  });

  // Set initial display value
  if (currentValue !== null) {
    input.value = formatCurrency(currentValue, { showCents: true }).replace('$', '');
  }

  // Add dollar sign prefix
  const prefix = createElement('span', { class: 'form-field__prefix' }, ['$']);

  function validate(cents: Cents | null): string | null {
    if (cents === null) return null;

    if (!allowNegative && cents < 0) {
      return 'Value cannot be negative';
    }
    if (min !== undefined && cents < min) {
      return `Minimum value is ${formatCurrency(min)}`;
    }
    if (max !== undefined && cents > max) {
      return `Maximum value is ${formatCurrency(max)}`;
    }
    return null;
  }

  function handleInput(): void {
    const rawValue = input.value.replace(/[$,\s]/g, '');

    if (rawValue === '' || rawValue === '-') {
      currentValue = null;
      errorMessage = null;
      onChange?.(null);
      return;
    }

    const parsed = parseCurrency(rawValue);

    if (parsed === null) {
      errorMessage = 'Invalid amount';
    } else {
      currentValue = parsed;
      errorMessage = validate(parsed);
      onChange?.(parsed);
    }
  }

  function handleBlur(): void {
    // Format the display value on blur
    if (currentValue !== null && !errorMessage) {
      input.value = formatCurrency(currentValue, { showCents: true }).replace('$', '');
    }
  }

  input.addEventListener('input', handleInput);
  input.addEventListener('blur', handleBlur);

  // Build wrapper
  const wrapper = createInputWrapper(
    { ...options, error: errorMessage ?? undefined },
    input
  );

  // Insert prefix before input
  const inputContainer = wrapper.querySelector('.form-field__input-container');
  if (inputContainer) {
    inputContainer.insertBefore(prefix, input);
    inputContainer.classList.add('form-field__input-container--has-prefix');
  }

  return {
    element: wrapper,

    getValue(): Cents | null {
      return currentValue;
    },

    setValue(value: Cents | null): void {
      currentValue = value;
      if (value !== null) {
        input.value = formatCurrency(value, { showCents: true }).replace('$', '');
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
      input.removeEventListener('input', handleInput);
      input.removeEventListener('blur', handleBlur);
    },
  };
}
