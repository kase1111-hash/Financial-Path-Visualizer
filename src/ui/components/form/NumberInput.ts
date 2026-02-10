/**
 * Number Input Component
 *
 * Input for generic numeric values.
 */

import { createElement } from '@ui/utils/dom';
import { formatNumber } from '@ui/utils/format';
import { createInputWrapper, type BaseInputOptions } from './BaseInput';

export interface NumberInputOptions extends BaseInputOptions {
  /** Initial value */
  value?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Called when value changes */
  onChange?: (value: number | null) => void;
  /** Whether to allow negative values */
  allowNegative?: boolean;
  /** Suffix text (e.g., "years", "months") */
  suffix?: string;
}

export interface NumberInputComponent {
  /** The DOM element */
  element: HTMLDivElement;
  /** Get current value */
  getValue(): number | null;
  /** Set value */
  setValue(value: number | null): void;
  /** Set error message */
  setError(error: string | null): void;
  /** Destroy component */
  destroy(): void;
}

/**
 * Create a number input component.
 */
export function createNumberInput(options: NumberInputOptions): NumberInputComponent {
  const {
    id,
    value,
    min,
    max,
    step = 1,
    decimals = 0,
    onChange,
    allowNegative = false,
    disabled,
    placeholder = '0',
    suffix,
  } = options;

  let currentValue: number | null = value ?? null;
  let errorMessage: string | null = options.error ?? null;

  // Create the input element
  const input = createElement('input', {
    type: 'text',
    id,
    name: id,
    placeholder,
    disabled,
    class: 'form-field__input form-field__input--number',
    inputmode: 'decimal',
    autocomplete: 'off',
  });

  // Set initial display value
  if (currentValue !== null) {
    input.value = formatNumber(currentValue, { decimals });
  }

  function validate(num: number | null): string | null {
    if (num === null) return null;

    if (!allowNegative && num < 0) {
      return 'Value cannot be negative';
    }
    if (min !== undefined && num < min) {
      return `Minimum value is ${formatNumber(min, { decimals })}`;
    }
    if (max !== undefined && num > max) {
      return `Maximum value is ${formatNumber(max, { decimals })}`;
    }
    return null;
  }

  function handleInput(): void {
    const rawValue = input.value.replace(/,/g, '').trim();

    if (rawValue === '' || rawValue === '-') {
      currentValue = null;
      errorMessage = null;
      onChange?.(null);
      return;
    }

    const parsed = parseFloat(rawValue);

    if (isNaN(parsed)) {
      errorMessage = 'Invalid number';
    } else {
      // Round to step if specified
      const rounded = step !== 1 ? Math.round(parsed / step) * step : parsed;
      currentValue = rounded;
      errorMessage = validate(rounded);
      onChange?.(rounded);
    }
  }

  function handleBlur(): void {
    // Format the display value on blur
    if (currentValue !== null && !errorMessage) {
      input.value = formatNumber(currentValue, { decimals });
    }
  }

  input.addEventListener('input', handleInput);
  input.addEventListener('blur', handleBlur);

  // Build wrapper
  const wrapper = createInputWrapper(
    { ...options, error: errorMessage ?? undefined },
    input
  );

  // Add suffix if provided
  if (suffix) {
    const suffixEl = createElement('span', { class: 'form-field__suffix' }, [suffix]);
    const inputContainer = wrapper.querySelector('.form-field__input-container');
    if (inputContainer) {
      inputContainer.appendChild(suffixEl);
      inputContainer.classList.add('form-field__input-container--has-suffix');
    }
  }

  return {
    element: wrapper,

    getValue(): number | null {
      return currentValue;
    },

    setValue(value: number | null): void {
      currentValue = value;
      if (value !== null) {
        input.value = formatNumber(value, { decimals });
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
