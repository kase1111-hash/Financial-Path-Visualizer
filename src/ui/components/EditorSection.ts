/**
 * Editor Section Component
 *
 * Collapsible section for the profile editor.
 */

import { createElement } from '@ui/utils/dom';
import { createButton } from './Button';

export interface EditorSectionOptions {
  /** Section title */
  title: string;
  /** Section ID */
  id: string;
  /** Whether section is initially collapsed */
  collapsed?: boolean;
  /** Add button label */
  addButtonLabel?: string;
  /** Called when add button is clicked */
  onAdd?: () => void;
  /** Empty state message */
  emptyMessage?: string;
}

export interface EditorSectionComponent {
  /** The DOM element */
  element: HTMLElement;
  /** Content container for items */
  content: HTMLElement;
  /** Set collapsed state */
  setCollapsed(collapsed: boolean): void;
  /** Toggle collapsed state */
  toggle(): void;
  /** Set empty state */
  setEmpty(isEmpty: boolean): void;
  /** Update item count badge */
  setCount(count: number): void;
  /** Destroy component */
  destroy(): void;
}

/**
 * Create an editor section component.
 */
export function createEditorSection(options: EditorSectionOptions): EditorSectionComponent {
  const {
    title,
    id,
    collapsed = false,
    addButtonLabel = 'Add',
    onAdd,
    emptyMessage = 'No items yet',
  } = options;

  let isCollapsed = collapsed;

  const section = createElement('section', {
    class: `editor-section ${isCollapsed ? 'editor-section--collapsed' : ''}`,
    id: `section-${id}`,
  });

  // Header
  const header = createElement('header', { class: 'editor-section__header' });

  const titleContainer = createElement('div', { class: 'editor-section__title-container' });

  const chevron = createElement('span', { class: 'editor-section__chevron' }, ['▼']);

  const titleEl = createElement('h3', { class: 'editor-section__title' }, [title]);

  const badge = createElement('span', { class: 'editor-section__badge', 'aria-hidden': 'true' }, [
    '0',
  ]);

  titleContainer.appendChild(chevron);
  titleContainer.appendChild(titleEl);
  titleContainer.appendChild(badge);
  header.appendChild(titleContainer);

  // Add button
  const components: { destroy(): void }[] = [];

  if (onAdd) {
    const addButton = createButton({
      text: addButtonLabel,
      variant: 'secondary',
      size: 'small',
      onClick: (e) => {
        e.stopPropagation();
        onAdd();
      },
    });
    components.push(addButton);
    header.appendChild(addButton.element);
  }

  section.appendChild(header);

  // Content
  const content = createElement('div', { class: 'editor-section__content' });

  // Empty state
  const emptyState = createElement('div', { class: 'editor-section__empty' }, [emptyMessage]);
  content.appendChild(emptyState);

  section.appendChild(content);

  // Toggle handler
  function handleHeaderClick(): void {
    isCollapsed = !isCollapsed;
    section.classList.toggle('editor-section--collapsed', isCollapsed);
  }

  titleContainer.addEventListener('click', handleHeaderClick);
  titleContainer.style.cursor = 'pointer';

  return {
    element: section,
    content,

    setCollapsed(collapsed: boolean): void {
      isCollapsed = collapsed;
      section.classList.toggle('editor-section--collapsed', isCollapsed);
    },

    toggle(): void {
      handleHeaderClick();
    },

    setEmpty(isEmpty: boolean): void {
      emptyState.style.display = isEmpty ? 'block' : 'none';
    },

    setCount(count: number): void {
      badge.textContent = String(count);
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    },

    destroy(): void {
      titleContainer.removeEventListener('click', handleHeaderClick);
      for (const component of components) {
        component.destroy();
      }
    },
  };
}
