/**
 * Financial Path Visualizer
 * A tool that shows you where your money decisions lead.
 *
 * All computation happens client-side. No server receives financial data.
 */

import { createApp } from '@ui/App';
import './ui/styles/main.css';

function init(): void {
  const container = document.getElementById('app');

  if (!container) {
    console.error('Root container #app not found');
    return;
  }

  const app = createApp();
  app.mount(container);

  // Handle hot module replacement in development
  // @ts-expect-error Vite HMR types
  if (import.meta.hot) {
    // @ts-expect-error Vite HMR types
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    import.meta.hot.dispose(() => {
      app.destroy();
    });
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
