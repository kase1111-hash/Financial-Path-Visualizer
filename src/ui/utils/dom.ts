/**
 * DOM Utilities
 *
 * Helper functions for DOM manipulation.
 */

/**
 * Create an element with attributes and children.
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string | number | boolean | undefined>,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === false) continue;
      if (value === true) {
        el.setAttribute(key, '');
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }

  if (children) {
    for (const child of children) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    }
  }

  return el;
}

/**
 * Shorthand for common elements.
 */
export const el = {
  div: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('div', attrs, children),
  span: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('span', attrs, children),
  p: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('p', attrs, children),
  h1: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('h1', attrs, children),
  h2: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('h2', attrs, children),
  h3: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('h3', attrs, children),
  button: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('button', attrs, children),
  input: (attrs?: Record<string, string>) =>
    createElement('input', attrs),
  label: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('label', attrs, children),
  select: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('select', attrs, children),
  option: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('option', attrs, children),
  form: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('form', attrs, children),
  section: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('section', attrs, children),
  ul: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('ul', attrs, children),
  li: (attrs?: Record<string, string>, children?: (Node | string)[]) =>
    createElement('li', attrs, children),
};

/**
 * Query selector with type safety.
 */
export function $(selector: string, parent: Element | Document = document): Element | null {
  return parent.querySelector(selector);
}

/**
 * Query selector all with type safety.
 */
export function $$(selector: string, parent: Element | Document = document): Element[] {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Clear all children from an element.
 */
export function clearChildren(element: Element): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Replace children of an element.
 */
export function replaceChildren(element: Element, children: (Node | string)[]): void {
  clearChildren(element);
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
}

/**
 * Add event listener with cleanup function.
 */
export function on<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions
): () => void {
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

/**
 * Debounce a function.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Show/hide element.
 */
export function setVisible(element: HTMLElement, visible: boolean): void {
  element.style.display = visible ? '' : 'none';
}

/**
 * Toggle class on element.
 */
export function toggleClass(element: Element, className: string, force?: boolean): void {
  element.classList.toggle(className, force);
}
