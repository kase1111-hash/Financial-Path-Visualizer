import { test, expect } from '@playwright/test';
import { openQuickStart } from './helpers';

test.describe('Quick Start Flow', () => {
  test.beforeEach(async ({ page }) => {
    await openQuickStart(page);
  });

  test('should display quick start page for new users', async ({ page }) => {
    await expect(page.locator('.quick-start')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Financial Path Visualizer');
    await expect(page.getByLabel('Annual Salary (Gross)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create My Financial Plan' })).toBeVisible();

    // The static "Loading..." placeholder from index.html must be replaced once
    // the app mounts, not left on screen pushing the form below the fold.
    await expect(page.getByText('Loading Financial Path Visualizer...')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'About You' })).toBeInViewport();
  });

  test('should show validation for empty required fields', async ({ page }) => {
    const salary = page.getByLabel('Annual Salary (Gross)');
    await expect(salary).toHaveValue('');

    await page.getByRole('button', { name: 'Create My Financial Plan' }).click();

    // The browser's constraint validation blocks submission and flags the field
    expect(await salary.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)).toBe(true);
    await expect(salary).toBeFocused();
    await expect(page.locator('.quick-start__form')).toBeVisible();
    await expect(page.locator('.trajectory-view')).toHaveCount(0);
  });

  test('should complete quick start and show trajectory', async ({ page }) => {
    await page.getByLabel('Profile Name').fill('Test Profile');
    await page.getByLabel('Current Age').fill('30');
    await page.getByLabel('Annual Salary (Gross)').fill('75000');
    await page.getByRole('button', { name: 'Create My Financial Plan' }).click();

    const trajectory = page.locator('.trajectory-view');
    await expect(trajectory).toBeVisible();
    const title = trajectory.getByRole('heading', { level: 1 });
    await expect(title).toHaveText('Test Profile');
    // The quick start view must be replaced, not left rendered above the trajectory
    await expect(page.locator('.quick-start')).toHaveCount(0);
    // The new view opens at the top, not at the long form's scroll position
    await expect(title).toBeInViewport();

    // The profile was saved: a returning visit goes straight to the trajectory
    await page.reload();
    await expect(page.locator('.trajectory-view').getByRole('heading', { level: 1 })).toHaveText(
      'Test Profile'
    );
    await expect(page.locator('.quick-start')).toHaveCount(0);
  });

  test('should allow navigation to full profile editor', async ({ page }) => {
    await page.getByRole('button', { name: 'Skip to Advanced Editor' }).click();

    const editor = page.locator('.profile-editor');
    await expect(editor).toBeVisible();
    await expect(editor.getByRole('heading', { level: 1 })).toHaveText('Edit Profile');
    await expect(page.locator('.quick-start')).toHaveCount(0);

    // Saving works and leaves the button usable for further saves
    const saveButton = editor.getByRole('button', { name: 'Save Changes' });
    await saveButton.click();
    await expect(saveButton).toBeEnabled();

    await editor.getByRole('button', { name: 'View Projection' }).click();
    await expect(page.locator('.trajectory-view')).toBeVisible();

    // The saved profile is loaded on the next visit
    await page.reload();
    await expect(page.locator('.trajectory-view')).toBeVisible();
  });
});

test.describe('Quick Start - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await openQuickStart(page);

    // Primary action stretches across the narrow screen
    const submit = page.getByRole('button', { name: 'Create My Financial Plan' });
    const box = await submit.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(200);

    // Nothing overflows horizontally
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
