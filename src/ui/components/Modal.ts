/**
 * Modal Component
 *
 * Dialog modal for forms and confirmations.
 */

import { createElement, on } from '@ui/utils/dom';
import { createButton } from './Button';

export interface ModalOptions {
  /** Modal title */
  title: string;
  /** Modal content (can be element or string) */
  content?: HTMLElement | string;
  /** Whether to show close button */
  showClose?: boolean;
  /** Primary action button text */
  primaryAction?: string;
  /** Secondary action button text */
  secondaryAction?: string;
  /** Called when primary action is clicked */
  onPrimary?: () => void | Promise<void>;
  /** Called when secondary action is clicked */
  onSecondary?: () => void;
  /** Called when modal is closed */
  onClose?: () => void;
  /** Modal size */
  size?: 'small' | 'medium' | 'large';
}

export interface ModalComponent {
  /** The DOM element */
  element: HTMLElement;
  /** The content container */
  content: HTMLElement;
  /** Show the modal */
  show(): void;
  /** Hide the modal */
  hide(): void;
  /** Set loading state on primary button */
  setLoading(loading: boolean): void;
  /** Destroy component */
  destroy(): void;
}

/**
 * Create a modal component.
 */
export function createModal(options: ModalOptions): ModalComponent {
  const {
    title,
    content,
    showClose = true,
    primaryAction,
    secondaryAction,
    onPrimary,
    onSecondary,
    onClose,
    size = 'medium',
  } = options;

  // Backdrop
  const backdrop = createElement('div', { class: 'modal-backdrop' });

  // Modal container
  const modal = createElement('div', { class: `modal modal--${size}` });

  // Header
  const header = createElement('header', { class: 'modal__header' });
  const titleEl = createElement('h2', { class: 'modal__title' }, [title]);
  header.appendChild(titleEl);

  const components: { destroy(): void }[] = [];
  const cleanups: (() => void)[] = [];

  if (showClose) {
    const closeBtn = createButton({
      text: '✕',
      variant: 'ghost',
      size: 'small',
      className: 'modal__close',
      onClick: () => { hide(); },
    });
    components.push(closeBtn);
    header.appendChild(closeBtn.element);
  }

  modal.appendChild(header);

  // Content
  const contentContainer = createElement('div', { class: 'modal__content' });
  if (content) {
    if (typeof content === 'string') {
      contentContainer.textContent = content;
    } else {
      contentContainer.appendChild(content);
    }
  }
  modal.appendChild(contentContainer);

  // Footer with actions
  let primaryButton: ReturnType<typeof createButton> | null = null;

  if (primaryAction || secondaryAction) {
    const footer = createElement('footer', { class: 'modal__footer' });

    if (secondaryAction) {
      const secondaryBtn = createButton({
        text: secondaryAction,
        variant: 'secondary',
        onClick: () => {
          onSecondary?.();
          hide();
        },
      });
      components.push(secondaryBtn);
      footer.appendChild(secondaryBtn.element);
    }

    if (primaryAction) {
      primaryButton = createButton({
        text: primaryAction,
        variant: 'primary',
        onClick: () => {
          void (async () => {
            if (onPrimary) {
              primaryButton?.setLoading(true);
              try {
                await onPrimary();
                hide();
              } catch {
                // Error handling should be done in onPrimary
              } finally {
                primaryButton?.setLoading(false);
              }
            } else {
              hide();
            }
          })();
        },
      });
      components.push(primaryButton);
      footer.appendChild(primaryButton.element);
    }

    modal.appendChild(footer);
  }

  backdrop.appendChild(modal);

  // Close on backdrop click
  function handleBackdropClick(e: MouseEvent): void {
    if (e.target === backdrop) {
      hide();
    }
  }

  // Close on escape key
  function handleEscape(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      hide();
    }
  }

  function show(): void {
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    // Add event listeners
    cleanups.push(on(backdrop, 'click', handleBackdropClick));
    cleanups.push(on(document.body, 'keydown', handleEscape as EventListener));

    // Focus first focusable element
    requestAnimationFrame(() => {
      const focusable = modal.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    });
  }

  function hide(): void {
    backdrop.remove();
    document.body.style.overflow = '';

    // Remove event listeners
    for (const cleanup of cleanups) {
      cleanup();
    }
    cleanups.length = 0;

    onClose?.();
  }

  return {
    element: backdrop,
    content: contentContainer,

    show,
    hide,

    setLoading(loading: boolean): void {
      primaryButton?.setLoading(loading);
    },

    destroy(): void {
      hide();
      for (const component of components) {
        component.destroy();
      }
    },
  };
}

/**
 * Create a confirmation modal.
 */
export function createConfirmModal(options: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}): ModalComponent {
  const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm } = options;

  const content = createElement('p', { class: 'modal__message' }, [message]);

  return createModal({
    title,
    content,
    size: 'small',
    primaryAction: confirmText,
    secondaryAction: cancelText,
    onPrimary: onConfirm,
  });
}
