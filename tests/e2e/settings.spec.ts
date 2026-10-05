import { test, expect, type Page } from '@playwright/test';
import { createProfileViaQuickStart, mainNav, navigateVia } from './helpers';

/** Create a profile, then open Settings from the header navigation. */
async function navigateToSettings(page: Page) {
  await createProfileViaQuickStart(page, { salary: '75000' });
  await navigateVia(page, 'Settings');

  const settings = page.locator('.settings-view');
  await expect(settings).toBeVisible();
  return settings;
}

test.describe('Settings', () => {
  test('should display settings page', async ({ page }) => {
    const settings = await navigateToSettings(page);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
    for (const section of ['Appearance', 'Display', 'Data Management', 'About']) {
      await expect(settings.getByRole('heading', { level: 2, name: section })).toBeVisible();
    }
    // The header marks Settings as the current page
    await expect(mainNav(page).getByRole('button', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('should have theme selector', async ({ page }) => {
    const settings = await navigateToSettings(page);

    const themeSelect = settings.getByLabel('Theme');
    await expect(themeSelect).toBeVisible();
    await expect(themeSelect.locator('option')).toHaveText(['System (Auto)', 'Light', 'Dark']);
    await expect(themeSelect).toHaveValue('system');
  });

  test('should change theme', async ({ page }) => {
    const settings = await navigateToSettings(page);
    const html = page.locator('html');

    await settings.getByLabel('Theme').selectOption({ label: 'Dark' });
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // The choice is remembered across visits
    await page.reload();
    await expect(page.locator('.trajectory-view')).toBeVisible();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await navigateVia(page, 'Settings');
    const themeSelect = page.locator('.settings-view').getByLabel('Theme');
    await expect(themeSelect).toHaveValue('dark');
    await themeSelect.selectOption({ label: 'Light' });
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('should have export data option', async ({ page }) => {
    const settings = await navigateToSettings(page);

    const downloadPromise = page.waitForEvent('download');
    await settings.getByRole('button', { name: 'Export All Data' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^financial-profiles-backup-\d{4}-\d{2}-\d{2}\.json$/);
    // The file is fully written (its contents are checked by the import round trip)
    expect(await download.failure()).toBeNull();
  });

  test('should have import data option', async ({ page }, testInfo) => {
    const settings = await navigateToSettings(page);

    await expect(settings.getByText('Import Data', { exact: true })).toBeVisible();
    const fileInput = settings.getByLabel('Choose File');
    await expect(fileInput).toHaveAttribute('type', 'file');
    await expect(fileInput).toHaveAttribute('accept', '.json');

    // Round trip: back up, wipe everything, then restore from the backup
    const downloadPromise = page.waitForEvent('download');
    await settings.getByRole('button', { name: 'Export All Data' }).click();
    const backupPath = testInfo.outputPath('backup.json');
    await (await downloadPromise).saveAs(backupPath);

    page.on('dialog', (dialog) => { void dialog.accept(); });
    await settings.getByRole('button', { name: 'Clear All Data' }).click();
    await expect(page.locator('.quick-start')).toBeVisible();

    await navigateVia(page, 'Settings');
    const dialogMessage = page.waitForEvent('dialog').then((dialog) => dialog.message());
    await page.locator('.settings-view').getByLabel('Choose File').setInputFiles(backupPath);
    expect(await dialogMessage).toBe('Imported 1 profile.');

    // The restored profile is shown
    const trajectory = page.locator('.trajectory-view');
    await expect(trajectory).toBeVisible();
    await expect(trajectory.getByRole('heading', { level: 1 })).toHaveText('My Financial Plan');
  });

  test('should report a failed import', async ({ page }, testInfo) => {
    const settings = await navigateToSettings(page);

    const dialogMessage = page.waitForEvent('dialog').then(async (dialog) => {
      const message = dialog.message();
      await dialog.accept();
      return message;
    });
    await settings
      .getByLabel('Choose File')
      .setInputFiles(`${testInfo.project.testDir}/fixtures/not-a-backup.json`);

    expect(await dialogMessage).toMatch(/^Import failed/);
    await expect(page.locator('.settings-view')).toBeVisible();
  });

  test('should have clear data option with confirmation', async ({ page }) => {
    const settings = await navigateToSettings(page);

    const clearButton = settings.getByRole('button', { name: 'Clear All Data' });
    await expect(clearButton).toBeVisible();

    // Dismissing the confirmation keeps everything
    const dialogType = page.waitForEvent('dialog').then(async (dialog) => {
      const type = dialog.type();
      await dialog.dismiss();
      return type;
    });
    await clearButton.click();
    expect(await dialogType).toBe('confirm');
    await expect(settings).toBeVisible();
    await page.reload();
    await expect(page.locator('.trajectory-view')).toBeVisible();

    // Confirming twice deletes the data and starts over
    await navigateVia(page, 'Settings');
    let confirmations = 0;
    page.on('dialog', (dialog) => {
      confirmations++;
      void dialog.accept();
    });
    await page.locator('.settings-view').getByRole('button', { name: 'Clear All Data' }).click();
    await expect(page.locator('.quick-start')).toBeVisible();
    expect(confirmations).toBe(2);
    // The deleted profile is no longer reachable from the header
    await expect(mainNav(page).getByRole('button', { name: 'Timeline' })).toBeHidden();

    await page.reload();
    await expect(page.locator('.quick-start')).toBeVisible();
  });

  test('should show about section', async ({ page }) => {
    const settings = await navigateToSettings(page);

    const about = settings.locator('.settings-view__section').filter({
      has: page.getByRole('heading', { name: 'About' }),
    });
    await expect(about).toBeVisible();
    await expect(about.getByText(/^Version \d+\.\d+\.\d+$/)).toBeVisible();

    await about.getByRole('button', { name: 'Open User Guide' }).click();
    await expect(page.locator('.help-view')).toBeVisible();
  });

  test('should navigate back to timeline', async ({ page }) => {
    const settings = await navigateToSettings(page);

    await settings.getByRole('button', { name: 'Back to Timeline' }).click();
    await expect(page.locator('.trajectory-view')).toBeVisible();
    await expect(page.locator('.settings-view')).toHaveCount(0);

    // The header links work too
    await navigateVia(page, 'Help');
    await expect(page.locator('.help-view').getByRole('heading', { level: 1 })).toHaveText(
      'User Guide'
    );
    await navigateVia(page, 'Timeline');
    await expect(page.locator('.trajectory-view')).toBeVisible();
  });
});

test.describe('Settings - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be usable on mobile', async ({ page }) => {
    await createProfileViaQuickStart(page, { salary: '75000' });

    // Header links are collapsed behind the menu button on small screens
    const menu = page.getByRole('button', { name: 'Menu' });
    const settingsLink = mainNav(page).getByRole('button', { name: 'Settings' });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(settingsLink).toBeHidden();

    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await settingsLink.click();

    const settings = page.locator('.settings-view');
    await expect(settings).toBeVisible();
    // Choosing a link closes the menu
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(settingsLink).toBeHidden();

    await expect(settings.locator('.settings-view__section').first()).toBeVisible();

    // Selects span the narrow screen
    const select = settings.getByLabel('Theme');
    const selectBox = await select.boundingBox();
    expect(selectBox).not.toBeNull();
    expect(selectBox!.width).toBeGreaterThan(200);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
