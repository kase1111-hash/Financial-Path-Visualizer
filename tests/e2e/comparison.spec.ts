import { test, expect, type Page } from '@playwright/test';
import { createProfileViaQuickStart } from './helpers';

/** Create a profile and open the What-If Scenarios view from the trajectory. */
async function navigateToScenarios(page: Page) {
  const trajectory = await createProfileViaQuickStart(page, { salary: '90000' });
  await trajectory.getByRole('button', { name: 'Compare Scenarios' }).click();

  const scenarios = page.locator('.scenario-manager');
  await expect(scenarios).toBeVisible();
  return scenarios;
}

/**
 * Run the "Income Increase" quick scenario (it applies to any Quick Start
 * profile, since every one has a salary) and wait for the comparison view.
 */
async function compareIncomeIncrease(page: Page, amount = '5000') {
  const card = page.locator('.quick-scenario-card').filter({
    has: page.getByRole('heading', { name: 'Income Increase' }),
  });
  await card.getByLabel('Annual income increase').fill(amount);
  await card.getByRole('button', { name: 'Compare' }).click();

  const compareView = page.locator('.compare-view');
  await expect(compareView).toBeVisible();
  return compareView;
}

test.describe('Scenario Comparison', () => {
  test('should display scenario manager', async ({ page }) => {
    const scenarios = await navigateToScenarios(page);

    await expect(scenarios.getByRole('heading', { level: 1 })).toHaveText('What-If Scenarios');
    // Baseline is the profile just created
    await expect(scenarios.locator('.scenario-manager__profile-card')).toContainText(
      'My Financial Plan'
    );
    await expect(scenarios.locator('.quick-scenario-card').first()).toBeVisible();
  });

  test('should show quick scenario options', async ({ page }) => {
    const scenarios = await navigateToScenarios(page);

    for (const name of [
      'Extra Debt Payment',
      'Income Increase',
      'Increase Savings Rate',
      'Reduce Monthly Expenses',
    ]) {
      const card = scenarios.locator('.quick-scenario-card').filter({
        has: page.getByRole('heading', { name }),
      });
      await expect(card).toBeVisible();
      // Each card has a labelled amount input and a Compare action
      await expect(card.getByRole('spinbutton')).toBeVisible();
      await expect(card.getByRole('button', { name: 'Compare' })).toBeVisible();
    }
  });

  test('should allow creating a comparison', async ({ page }) => {
    await navigateToScenarios(page);

    const compareView = await compareIncomeIncrease(page, '5000');

    await expect(compareView.getByRole('heading', { level: 1 })).toHaveText('Scenario Comparison');
    // Baseline vs the generated scenario, named after the change applied
    await expect(compareView.locator('.compare-view__subtitle')).toHaveText(
      /^My Financial Plan vs My Financial Plan \(.*\+\$5,?000.*\)$/
    );
    await expect(page.locator('.scenario-manager')).toHaveCount(0);
  });

  test('should display comparison results', async ({ page }) => {
    await navigateToScenarios(page);
    const compareView = await compareIncomeIncrease(page);

    // Key insight
    await expect(compareView.locator('.compare-view__insight-text')).not.toBeEmpty();

    // Summary cards
    const summary = compareView.locator('.compare-view__summary-card');
    await expect(summary).toHaveCount(4);
    await expect(compareView.locator('.compare-view__summary')).toContainText('Final Net Worth');

    // Chart with both trajectories
    await expect(compareView.locator('svg.compare-view__svg')).toBeVisible();
    await expect(compareView.locator('.compare-view__line--baseline')).toHaveCount(1);
    await expect(compareView.locator('.compare-view__line--alternate')).toHaveCount(1);

    // Year-by-year delta table; extra income shows up as a positive income delta
    const rows = compareView.locator('.compare-view__table tbody tr');
    await expect(rows.first()).toBeVisible();
    await expect(rows.first().locator('td').nth(2)).toHaveText(/^\+/);
  });

  test('should show year slider in comparison', async ({ page }) => {
    await navigateToScenarios(page);
    const compareView = await compareIncomeIncrease(page);

    const slider = compareView.getByRole('slider', { name: 'Select Year' });
    await expect(slider).toBeVisible();

    // The slider starts on the first projected year
    const sliderValue = compareView.locator('.compare-view__slider-value');
    await expect(sliderValue).toHaveText(/^\d{4}$/);
    const firstYear = Number(await sliderValue.textContent());
    await expect(slider).toHaveValue('0');

    // Moving it selects a later year and updates the year comparison
    await slider.fill('5');
    await expect(slider).toHaveValue('5');
    await expect(sliderValue).toHaveText(String(firstYear + 5));
    await expect(slider).toHaveAttribute('aria-valuetext', String(firstYear + 5));
    await expect(
      compareView.getByRole('heading', { name: `Year ${firstYear + 5} Comparison` })
    ).toBeVisible();
  });

  test('should allow returning to trajectory', async ({ page }) => {
    const scenarios = await navigateToScenarios(page);

    // From a comparison back to the scenario list, which now lists the saved scenario
    const compareView = await compareIncomeIncrease(page);
    await compareView.getByRole('button', { name: 'Back to Scenarios' }).click();
    await expect(scenarios).toBeVisible();
    await expect(scenarios.locator('.saved-scenario-card')).toContainText(
      /My Financial Plan \(.*\+\$5,?000.*\)/
    );

    // And from the scenario list back to the timeline
    await scenarios.getByRole('button', { name: 'Back to Timeline' }).click();
    await expect(page.locator('.trajectory-view')).toBeVisible();
    await expect(page.locator('.scenario-manager')).toHaveCount(0);
  });
});

test.describe('Comparison - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should work on mobile devices', async ({ page }) => {
    const scenarios = await navigateToScenarios(page);

    // Scenario cards stack vertically and use nearly the full width
    const cards = scenarios.locator('.quick-scenario-card');
    expect(await cards.count()).toBeGreaterThanOrEqual(2);
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first!.width).toBeGreaterThan(300);
    expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);

    // The comparison itself works on a small screen
    const compareView = await compareIncomeIncrease(page);
    await expect(compareView.locator('svg.compare-view__svg')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
