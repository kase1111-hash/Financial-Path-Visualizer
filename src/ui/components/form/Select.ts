/**
 * Select Component
 *
 * Dropdown select with type-safe options.
 */

import { createElement } from '@ui/utils/dom';
import { createInputWrapper, type BaseInputOptions } from './BaseInput';

export interface SelectOption<T extends string = string> {
  /** Option value */
  value: T;
  /** Display label */
  label: string;
  /** Whether option is disabled */
  disabled?: boolean;
}

export interface SelectOptions<T extends string = string> extends BaseInputOptions {
  /** Available options */
  options: SelectOption<T>[];
  /** Initial value */
  value?: T;
  /** Called when value changes */
  onChange?: (value: T) => void;
  /** Placeholder option text */
  placeholderOption?: string;
}

export interface SelectComponent<T extends string = string> {
  /** The DOM element */
  element: HTMLDivElement;
  /** Get current value */
  getValue(): T | null;
  /** Set value */
  setValue(value: T | null): void;
  /** Update available options */
  setOptions(options: SelectOption<T>[]): void;
  /** Set error message */
  setError(error: string | null): void;
  /** Destroy component */
  destroy(): void;
}

/**
 * Create a select component.
 */
export function createSelect<T extends string = string>(
  options: SelectOptions<T>
): SelectComponent<T> {
  const {
    id,
    options: selectOptions,
    value,
    onChange,
    disabled,
    placeholderOption,
  } = options;

  let currentValue: T | null = value ?? null;

  // Create the select element
  const select = createElement('select', {
    id,
    name: id,
    disabled,
    class: 'form-field__select',
  });

  function buildOptions(opts: SelectOption<T>[]): void {
    // Clear existing options
    select.innerHTML = '';

    // Add placeholder option if specified
    if (placeholderOption) {
      const placeholder = createElement('option', { value: '', disabled: true }, [
        placeholderOption,
      ]);
      if (!currentValue) {
        placeholder.setAttribute('selected', '');
      }
      select.appendChild(placeholder);
    }

    // Add options
    for (const opt of opts) {
      const optEl = createElement(
        'option',
        {
          value: opt.value,
          disabled: opt.disabled,
          selected: opt.value === currentValue,
        },
        [opt.label]
      );
      select.appendChild(optEl);
    }
  }

  buildOptions(selectOptions);

  function handleChange(): void {
    currentValue = select.value as T;
    onChange?.(currentValue);
  }

  select.addEventListener('change', handleChange);

  // Build wrapper
  const wrapper = createInputWrapper(options, select);

  return {
    element: wrapper,

    getValue(): T | null {
      return currentValue;
    },

    setValue(value: T | null): void {
      currentValue = value;
      if (value !== null) {
        select.value = value;
      } else if (placeholderOption) {
        select.selectedIndex = 0;
      }
    },

    setOptions(opts: SelectOption<T>[]): void {
      buildOptions(opts);
    },

    setError(error: string | null): void {
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
      select.removeEventListener('change', handleChange);
    },
  };
}

/**
 * Create a state select with all US states.
 */
export function createStateSelect(
  options: Omit<SelectOptions, 'options'>
): SelectComponent {
  const states: SelectOption[] = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
    { value: 'DC', label: 'Washington D.C.' },
  ];

  return createSelect({
    ...options,
    options: states,
  });
}

/**
 * Create a filing status select.
 */
export function createFilingStatusSelect(
  options: Omit<SelectOptions, 'options'>
): SelectComponent {
  const statuses: SelectOption[] = [
    { value: 'single', label: 'Single' },
    { value: 'married_jointly', label: 'Married Filing Jointly' },
    { value: 'married_separately', label: 'Married Filing Separately' },
    { value: 'head_of_household', label: 'Head of Household' },
  ];

  return createSelect({
    ...options,
    options: statuses,
  });
}
