/**
 * Text Input Component
 *
 * Basic text input for names, descriptions, etc.
 */

import { createElement } from '@ui/utils/dom';
import { createInputWrapper, type BaseInputOptions } from './BaseInput';

export interface TextInputOptions extends BaseInputOptions {
  /** Initial value */
  value?: string;
  /** Maximum length */
  maxLength?: number;
  /** Minimum length */
  minLength?: number;
  /** Pattern for validation */
  pattern?: string;
  /** Called when value changes */
  onChange?: (value: string) => void;
  /** Input type */
  type?: 'text' | 'email' | 'tel' | 'url';
}

export interface TextInputComponent {
  /** The DOM element */
  element: HTMLDivElement;
  /** Get current value */
  getValue(): string;
  /** Set value */
  setValue(value: string): void;
  /** Set error message */
  setError(error: string | null): void;
  /** Focus the input */
  focus(): void;
  /** Destroy component */
  destroy(): void;
}

/**
 * Create a text input component.
 */
export function createTextInput(options: TextInputOptions): TextInputComponent {
  const {
    id,
    value = '',
    maxLength,
    minLength,
    pattern,
    onChange,
    disabled,
    placeholder,
    type = 'text',
  } = options;

  let currentValue: string = value;
  let errorMessage: string | null = options.error ?? null;

  // Create the input element
  const input = createElement('input', {
    type,
    id,
    name: id,
    placeholder,
    disabled,
    maxlength: maxLength,
    minlength: minLength,
    pattern,
    value: currentValue,
    class: 'form-field__input',
    autocomplete: 'off',
  }) as HTMLInputElement;

  function validate(val: string): string | null {
    if (minLength !== undefined && val.length < minLength) {
      return `Must be at least ${minLength} characters`;
    }
    if (maxLength !== undefined && val.length > maxLength) {
      return `Must be at most ${maxLength} characters`;
    }
    if (pattern) {
      const regex = new RegExp(pattern);
      if (!regex.test(val)) {
        return 'Invalid format';
      }
    }
    return null;
  }

  function handleInput(): void {
    currentValue = input.value;
    errorMessage = validate(currentValue);
    onChange?.(currentValue);
  }

  input.addEventListener('input', handleInput);

  // Build wrapper
  const wrapper = createInputWrapper(
    { ...options, error: errorMessage ?? undefined },
    input
  );

  return {
    element: wrapper,

    getValue(): string {
      return currentValue;
    },

    setValue(value: string): void {
      currentValue = value;
      input.value = value;
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

    focus(): void {
      input.focus();
    },

    destroy(): void {
      input.removeEventListener('input', handleInput);
    },
  };
}
