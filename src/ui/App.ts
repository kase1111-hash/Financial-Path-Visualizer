/**
 * Main Application Component
 *
 * Handles routing and main layout.
 */

import type { FinancialProfile } from '@models/profile';
import { createProfile } from '@models/profile';
import { createElement, clearChildren } from '@ui/utils/dom';
import { appStore, navigate, type AppState } from '@ui/utils/state';
import { createButton, type ButtonComponent } from '@ui/components/Button';
import { createQuickStart } from '@ui/views/QuickStart';
import { createProfileEditor } from '@ui/views/editor/ProfileEditor';
import { createTrajectoryView } from '@ui/views/TrajectoryView';
import { createOptimizationsView } from '@ui/views/OptimizationsView';
import { createScenarioManager } from '@ui/views/ScenarioManager';
import { createCompareView } from '@ui/views/CompareView';
import { createSettingsView } from '@ui/views/SettingsView';
import { createHelpView } from '@ui/views/HelpView';
import { navigateToCompare } from '@ui/utils/state';
import { loadProfile, loadAllProfiles } from '@storage/profile-store';
import {
  getPreferences,
  applyTheme,
  watchSystemTheme,
  getThemeFromLocalStorage,
  saveThemeToLocalStorage,
  getLastProfileIdFromLocalStorage,
  saveLastProfileIdToLocalStorage,
} from '@storage/preferences';

export interface AppComponent {
  /** The root DOM element */
  element: HTMLElement;
  /** Mount the app to a container */
  mount(container: HTMLElement): void;
  /** Destroy the app */
  destroy(): void;
}

/**
 * Create the main application.
 */
export function createApp(): AppComponent {
  // No id here: the root is mounted inside index.html's #app container.
  const root = createElement('div', { class: 'app' });

  let currentView: { element: HTMLElement; destroy(): void } | null = null;
  let currentProfile: FinancialProfile | null = null;
  // Incremented on every renderView call so a stale async render can bail out.
  let renderToken = 0;

  const cleanups: (() => void)[] = [];

  // Apply theme immediately from localStorage
  const initialTheme = getThemeFromLocalStorage();
  applyTheme(initialTheme);

  // Header
  const header = createElement('header', { class: 'app-header' });
  const logo = createElement('div', { class: 'app-header__logo' }, ['Financial Path Visualizer']);
  header.appendChild(logo);

  const nav = createElement('nav', {
    class: 'app-header__nav',
    id: 'app-nav',
    'aria-label': 'Main',
  });

  const navToggle = createElement('button', {
    type: 'button',
    class: 'mobile-nav-toggle',
    'aria-label': 'Menu',
    'aria-controls': 'app-nav',
    'aria-expanded': 'false',
  });
  navToggle.innerHTML =
    '<svg class="mobile-nav-toggle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M4 6h16M4 12h16M4 18h16"/></svg>';

  function setNavOpen(open: boolean): void {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  }

  const onNavToggle = (): void => {
    setNavOpen(!nav.classList.contains('is-open'));
  };
  navToggle.addEventListener('click', onNavToggle);
  cleanups.push(() => { navToggle.removeEventListener('click', onNavToggle); });

  const navItems: { view: AppState['view']; requiresProfile: boolean; button: ButtonComponent }[] = [];
  const navDefinitions: { view: AppState['view']; label: string; requiresProfile: boolean }[] = [
    { view: 'trajectory', label: 'Timeline', requiresProfile: true },
    { view: 'settings', label: 'Settings', requiresProfile: false },
    { view: 'help', label: 'Help', requiresProfile: false },
  ];
  for (const def of navDefinitions) {
    const button = createButton({
      text: def.label,
      variant: 'ghost',
      size: 'small',
      onClick: () => {
        setNavOpen(false);
        navigate(def.view);
      },
    });
    navItems.push({ ...def, button });
    nav.appendChild(button.element);
  }
  cleanups.push(() => {
    for (const item of navItems) {
      item.button.destroy();
    }
  });

  /** Reflect the active view and hide links that need a profile when there is none. */
  function updateNav(view: AppState['view']): void {
    for (const item of navItems) {
      item.button.element.hidden = item.requiresProfile && !currentProfile;
      if (item.view === view) {
        item.button.element.setAttribute('aria-current', 'page');
      } else {
        item.button.element.removeAttribute('aria-current');
      }
    }
  }
  updateNav(appStore.get().view);

  header.appendChild(navToggle);
  header.appendChild(nav);
  root.appendChild(header);

  // Main content area
  const main = createElement('main', { class: 'app-main' });
  root.appendChild(main);

  // Loading overlay
  const loadingOverlay = createElement('div', { class: 'app-loading', style: 'display: none' });
  loadingOverlay.appendChild(createElement('div', { class: 'app-loading__spinner' }));
  loadingOverlay.appendChild(createElement('div', { class: 'app-loading__text' }, ['Loading...']));
  root.appendChild(loadingOverlay);

  // Error toast
  const errorToast = createElement('div', { class: 'app-error', role: 'alert', style: 'display: none' });
  root.appendChild(errorToast);

  // Subscribe to state changes
  const unsubscribe = appStore.subscribe((state, prevState) => {
    // Handle view changes
    if (state.view !== prevState.view || state.profileId !== prevState.profileId) {
      void renderView(state);
    }

    // Handle loading state
    loadingOverlay.style.display = state.isLoading ? 'flex' : 'none';

    // Handle error state
    if (state.error) {
      showError(state.error);
    }
  });
  cleanups.push(unsubscribe);

  function showError(message: string): void {
    errorToast.textContent = message;
    errorToast.style.display = 'block';

    setTimeout(() => {
      errorToast.style.display = 'none';
      appStore.update({ error: null });
    }, 5000);
  }

  async function renderView(state: AppState): Promise<void> {
    // Several state updates can fire back-to-back (e.g. setCurrentProfile then
    // navigate), each starting a render. Only the most recent one may touch the
    // DOM, otherwise a stale render that resolves late appends a second view.
    const token = ++renderToken;

    // Load profile if needed
    if (state.profileId && state.profileId !== currentProfile?.id) {
      const loaded = (await loadProfile(state.profileId)) ?? null;
      if (token !== renderToken) return;
      currentProfile = loaded;
      if (currentProfile) {
        saveLastProfileIdToLocalStorage(currentProfile.id);
      }
    }

    // Destroy previous view
    if (currentView) {
      currentView.destroy();
      currentView = null;
    }

    clearChildren(main);

    switch (state.view) {
      case 'quick-start':
        if (!state.profileId) {
          // Starting over (e.g. after Clear All Data): forget any cached profile
          currentProfile = null;
        }
        currentView = createQuickStart();
        break;

      case 'editor':
        // Create new profile if none exists
        currentProfile ??= createProfile();
        currentView = createProfileEditor({
          profile: currentProfile,
          onSave: (profile) => {
            currentProfile = profile;
            saveLastProfileIdToLocalStorage(profile.id);
          },
        });
        break;

      case 'trajectory':
        if (currentProfile) {
          currentView = createTrajectoryView({ profile: currentProfile });
        } else {
          // Redirect to quick-start if no profile
          appStore.update({ view: 'quick-start' });
          return;
        }
        break;

      case 'optimizations':
        if (currentProfile) {
          currentView = createOptimizationsView({ profile: currentProfile });
        } else {
          // Redirect to quick-start if no profile
          appStore.update({ view: 'quick-start' });
          return;
        }
        break;

      case 'compare':
        if (currentProfile) {
          currentView = createScenarioManager({
            profile: currentProfile,
            onCompare: (baselineId, alternateId, changes) => {
              navigateToCompare(baselineId, alternateId, changes);
            },
          });
        } else {
          // Redirect to quick-start if no profile
          appStore.update({ view: 'quick-start' });
          return;
        }
        break;

      case 'compare-detail':
        if (state.compareBaselineId && state.compareAlternateId) {
          currentView = createCompareView({
            baselineId: state.compareBaselineId,
            alternateId: state.compareAlternateId,
            changes: state.compareChanges,
          });
        } else {
          // Redirect to compare if no comparison data
          appStore.update({ view: 'compare' });
          return;
        }
        break;

      case 'settings':
        currentView = createSettingsView();
        break;

      case 'help':
        currentView = createHelpView();
        break;
    }

    main.appendChild(currentView.element);
    updateNav(state.view);
    // A new view starts at the top, not at the previous view's scroll offset
    window.scrollTo(0, 0);
  }

  async function initialize(): Promise<void> {
    // Load preferences
    const prefs = await getPreferences();
    applyTheme(prefs.theme);
    // Keep the synchronous localStorage copy in step so the next load starts
    // with the right theme instead of flashing the default.
    saveThemeToLocalStorage(prefs.theme);

    // Follow OS theme changes, but only while the user's preference is 'system'
    // (it can change in Settings after startup).
    const unwatchTheme = watchSystemTheme(() => {
      void getPreferences().then((current) => {
        if (current.theme === 'system') {
          applyTheme('system');
        }
      });
    });
    cleanups.push(unwatchTheme);

    // Check for existing profiles
    const profiles = await loadAllProfiles();

    if (profiles.length > 0) {
      // Try to load last profile, falling back to the first one if the
      // remembered profile no longer exists.
      const lastProfileId = getLastProfileIdFromLocalStorage() ?? prefs.lastProfileId;
      const lastProfile =
        profiles.find((p: FinancialProfile) => p.id === lastProfileId) ?? profiles[0];

      if (lastProfile) {
        currentProfile = (await loadProfile(lastProfile.id)) ?? null;
        appStore.update({
          view: 'trajectory',
          profileId: lastProfile.id,
        });
        return;
      }
    }

    // Show quick start for new users
    void renderView(appStore.get());
  }

  return {
    element: root,

    mount(container: HTMLElement): void {
      // Replace the static loading placeholder from index.html.
      container.replaceChildren(root);
      void initialize();
    },

    destroy(): void {
      if (currentView) {
        currentView.destroy();
      }
      for (const cleanup of cleanups) {
        cleanup();
      }
    },
  };
}
