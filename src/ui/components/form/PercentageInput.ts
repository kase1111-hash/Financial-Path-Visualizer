/**
 * Percentage Input Component
 *
 * Input for percentage values, stores as decimal rate internally.
 */

import type { Rate } from '@models/common';
import { createElement } from '@ui/utils/dom';
import { formatPercent, parsePercent } from '@ui/utils/format';
import { createInputWrapper, type BaseInputOptions } from './BaseInput';

export interface PercentageInputOptions extends BaseInputOptions {
  /** Initial value as decimal rate (0.07 = 7%) */
  value?: Rate | undefined;
  /** Minimum value as decimal rate */
  min?: Rate;
  /** Maximum value as decimal rate */
  max?: Rate;
  /** Number of decimal places to display */
  decimals?: number;
  /** Called when value changes */
  onChange?: (value: Rate | null) => void;
  /** Whether to allow negative values */
  allowNegative?: boolean;
}

export interface PercentageInputComponent {
  /** The DOM element */
  element: HTMLDivElement;
  /** Get current value as decimal rate */
  getValue(): Rate | null;
  /** Set value as decimal rate */
  setValue(value: Rate | null): void;
  /** Set error message */
  setError(error: string | null): void;
  /** Destroy component */
  destroy(): void;
}

/**
 * Create a percentage input component.
 */
export function createPercentageInput(options: PercentageInputOptions): PercentageInputComponent {
  const {
    id,
    value,
    min,
    max,
    decimals = 2,
    onChange,
    allowNegative = false,
    disabled,
    placeholder = '0',
  } = options;

  let currentValue: Rate | null = value ?? null;
  let errorMessage: string | null = options.error ?? null;

  // Create the input element
  const input = createElement('input', {
    type: 'text',
    id,
    name: id,
    placeholder,
    disabled,
    class: 'form-field__input form-field__input--percentage',
    inputmode: 'decimal',
    autocomplete: 'off',
  }) as HTMLInputElement;

  // Set initial display value (show as percentage, e.g., "7" for 0.07)
  if (currentValue !== null) {
    input.value = (currentValue * 100).toFixed(decimals);
  }

  // Add percent sign suffix
  const suffix = createElement('span', { class: 'form-field__suffix' }, ['%']);

  function validate(rate: Rate | null): string | null {
    if (rate === null) return null;

    if (!allowNegative && rate < 0) {
      return 'Value cannot be negative';
    }
    if (min !== undefined && rate < min) {
      return `Minimum value is ${formatPercent(min, { decimals })}`;
    }
    if (max !== undefined && rate > max) {
      return `Maximum value is ${formatPercent(max, { decimals })}`;
    }
    return null;
  }

  function handleInput(): void {
    const rawValue = input.value.replace(/%/g, '').trim();

    if (rawValue === '' || rawValue === '-') {
      currentValue = null;
      errorMessage = null;
      onChange?.(null);
      return;
    }

    // Parse as percentage string (add % back for parsePercent)
    const parsed = parsePercent(rawValue + '%');

    if (parsed === null) {
      errorMessage = 'Invalid percentage';
    } else {
      currentValue = parsed;
      errorMessage = validate(parsed);
      onChange?.(parsed);
    }
  }

  function handleBlur(): void {
    // Format the display value on blur
    if (currentValue !== null && !errorMessage) {
      input.value = (currentValue * 100).toFixed(decimals);
    }
  }

  input.addEventListener('input', handleInput);
  input.addEventListener('blur', handleBlur);

  // Build wrapper
  const wrapper = createInputWrapper(
    { ...options, error: errorMessage ?? undefined },
    input
  );

  // Insert suffix after input
  const inputContainer = wrapper.querySelector('.form-field__input-container');
  if (inputContainer) {
    inputContainer.appendChild(suffix);
    inputContainer.classList.add('form-field__input-container--has-suffix');
  }

  return {
    element: wrapper,

    getValue(): Rate | null {
      return currentValue;
    },

    setValue(value: Rate | null): void {
      currentValue = value;
      if (value !== null) {
        input.value = (value * 100).toFixed(decimals);
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
