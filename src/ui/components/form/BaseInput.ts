/**
 * Base Input Component
 *
 * Foundation for all input components with label, error, and help text.
 */

import { createElement } from '@ui/utils/dom';

export interface BaseInputOptions {
  /** Input ID */
  id: string;
  /** Label text */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text shown below input */
  helpText?: string;
  /** Error message */
  error?: string | null | undefined;
  /** Whether input is required */
  required?: boolean;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Create the wrapper structure for an input.
 */
export function createInputWrapper(
  options: BaseInputOptions,
  inputElement: HTMLInputElement | HTMLSelectElement
): HTMLDivElement {
  const { id, label, helpText, error, required, className } = options;

  const wrapper = createElement('div', {
    class: `form-field ${className ?? ''} ${error ? 'form-field--error' : ''}`.trim(),
  });

  // Label
  const labelEl = createElement('label', { for: id, class: 'form-field__label' }, [
    label,
    required ? createElement('span', { class: 'form-field__required' }, [' *']) : '',
  ]);
  wrapper.appendChild(labelEl);

  // Input container (for prefix/suffix support)
  const inputContainer = createElement('div', { class: 'form-field__input-container' });
  inputContainer.appendChild(inputElement);
  wrapper.appendChild(inputContainer);

  // Help text
  if (helpText && !error) {
    const helpEl = createElement('div', { class: 'form-field__help' }, [helpText]);
    wrapper.appendChild(helpEl);
  }

  // Error message
  if (error) {
    const errorEl = createElement('div', { class: 'form-field__error' }, [error]);
    wrapper.appendChild(errorEl);
  }

  return wrapper;
}

/**
 * Base input creation with common attributes.
 */
export function createBaseInput(
  type: string,
  options: BaseInputOptions & { value?: string }
): HTMLInputElement {
  const { id, placeholder, required, disabled, value } = options;

  return createElement('input', {
    type,
    id,
    name: id,
    placeholder,
    required,
    disabled,
    value,
    class: 'form-field__input',
    'aria-describedby': options.helpText || options.error ? `${id}-description` : undefined,
  }) as HTMLInputElement;
}
