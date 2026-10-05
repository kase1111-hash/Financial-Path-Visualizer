import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Shared E2E helpers.
 *
 * Each Playwright test runs in a fresh browser context, so IndexedDB and
 * localStorage start empty and the app opens on Quick Start; no manual
 * storage cleanup is needed.
 */

/**
 * Open the app. Uses a relative URL so it resolves under the Vite `base`
 * path configured as `baseURL` in playwright.config.ts.
 */
export async function gotoApp(page: Page): Promise<void> {
  await page.goto('./');
}

/** Open the app as a new user and wait for the Quick Start form. */
export async function openQuickStart(page: Page): Promise<void> {
  await gotoApp(page);
  await expect(page.locator('.quick-start__form')).toBeVisible();
}

/**
 * Create a profile through Quick Start and wait for the trajectory view.
 * Returns the trajectory view locator.
 */
export async function createProfileViaQuickStart(
  page: Page,
  options: { salary: string; name?: string }
): Promise<Locator> {
  await openQuickStart(page);

  if (options.name !== undefined) {
    await page.getByLabel('Profile Name').fill(options.name);
  }
  await page.getByLabel('Annual Salary (Gross)').fill(options.salary);
  await page.getByRole('button', { name: 'Create My Financial Plan' }).click();

  const trajectory = page.locator('.trajectory-view');
  await expect(trajectory).toBeVisible();
  return trajectory;
}

/** The app-wide header navigation. */
export function mainNav(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Main' });
}

/**
 * Click a header navigation link. On narrow viewports the links sit behind
 * the "Menu" toggle, so open it first when it is shown.
 */
export async function navigateVia(page: Page, linkName: string): Promise<void> {
  const menuToggle = page.getByRole('button', { name: 'Menu' });
  if (await menuToggle.isVisible()) {
    await menuToggle.click();
  }
  await mainNav(page).getByRole('button', { name: linkName }).click();
}
