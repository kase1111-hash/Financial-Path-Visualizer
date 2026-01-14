/**
 * Item Card Component
 *
 * Card display for income, debt, asset, etc. items.
 */

import { createElement } from '@ui/utils/dom';
import { createButton } from './Button';

export interface ItemCardOptions {
  /** Card title */
  title: string;
  /** Card subtitle */
  subtitle?: string;
  /** Primary value display */
  primaryValue?: string;
  /** Secondary value display */
  secondaryValue?: string;
  /** Additional details as key-value pairs */
  details?: { label: string; value: string }[];
  /** Called when edit button is clicked */
  onEdit?: () => void;
  /** Called when delete button is clicked */
  onDelete?: () => void;
  /** Additional CSS class */
  className?: string;
}

export interface ItemCardComponent {
  /** The DOM element */
  element: HTMLElement;
  /** Update card content */
  update(options: Partial<ItemCardOptions>): void;
  /** Destroy component */
  destroy(): void;
}

/**
 * Create an item card component.
 */
export function createItemCard(options: ItemCardOptions): ItemCardComponent {
  const { className = '' } = options;

  const card = createElement('div', { class: `item-card ${className}`.trim() });

  const components: { destroy(): void }[] = [];

  function render(opts: ItemCardOptions): void {
    card.innerHTML = '';

    // Main content
    const main = createElement('div', { class: 'item-card__main' });

    // Header row
    const headerRow = createElement('div', { class: 'item-card__header' });

    const titleEl = createElement('h4', { class: 'item-card__title' }, [opts.title]);
    headerRow.appendChild(titleEl);

    if (opts.primaryValue) {
      const primaryEl = createElement('span', { class: 'item-card__primary-value' }, [
        opts.primaryValue,
      ]);
      headerRow.appendChild(primaryEl);
    }

    main.appendChild(headerRow);

    // Subtitle
    if (opts.subtitle) {
      const subtitleEl = createElement('p', { class: 'item-card__subtitle' }, [opts.subtitle]);
      main.appendChild(subtitleEl);
    }

    // Details
    if (opts.details && opts.details.length > 0) {
      const detailsEl = createElement('div', { class: 'item-card__details' });

      for (const detail of opts.details) {
        const detailRow = createElement('div', { class: 'item-card__detail' });
        detailRow.appendChild(
          createElement('span', { class: 'item-card__detail-label' }, [detail.label])
        );
        detailRow.appendChild(
          createElement('span', { class: 'item-card__detail-value' }, [detail.value])
        );
        detailsEl.appendChild(detailRow);
      }

      main.appendChild(detailsEl);
    }

    // Secondary value
    if (opts.secondaryValue) {
      const secondaryEl = createElement('p', { class: 'item-card__secondary-value' }, [
        opts.secondaryValue,
      ]);
      main.appendChild(secondaryEl);
    }

    card.appendChild(main);

    // Actions
    if (opts.onEdit || opts.onDelete) {
      const actions = createElement('div', { class: 'item-card__actions' });

      if (opts.onEdit) {
        const editBtn = createButton({
          text: 'Edit',
          variant: 'ghost',
          size: 'small',
          onClick: opts.onEdit,
        });
        components.push(editBtn);
        actions.appendChild(editBtn.element);
      }

      if (opts.onDelete) {
        const deleteBtn = createButton({
          text: 'Delete',
          variant: 'danger',
          size: 'small',
          onClick: opts.onDelete,
        });
        components.push(deleteBtn);
        actions.appendChild(deleteBtn.element);
      }

      card.appendChild(actions);
    }
  }

  render(options);

  return {
    element: card,

    update(opts: Partial<ItemCardOptions>): void {
      render({ ...options, ...opts });
    },

    destroy(): void {
      for (const component of components) {
        component.destroy();
      }
    },
  };
}
