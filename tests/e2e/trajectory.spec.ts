import { test, expect } from '@playwright/test';
import { createProfileViaQuickStart } from './helpers';

test.describe('Trajectory View', () => {
  test('should display trajectory chart', async ({ page }) => {
    const trajectory = await createProfileViaQuickStart(page, { salary: '80000' });

    await expect(trajectory.getByRole('heading', { name: 'Financial Timeline' })).toBeVisible();
    const chart = trajectory.locator('.timeline-chart');
    await expect(chart.locator('svg.timeline-chart__svg')).toBeVisible();
    // A plotted series, not just empty axes
    await expect(chart.locator('path.timeline-chart__line')).toHaveCount(1);
    await expect(chart.locator('.timeline-chart__x-axis .tick').first()).toBeAttached();
  });

  test('should display summary cards', async ({ page }) => {
    const trajectory = await createProfileViaQuickStart(page, { salary: '80000' });

    const cards = trajectory.locator('.summary-cards .summary-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
    await expect(trajectory.locator('.summary-cards')).toContainText('Final Net Worth');
    await expect(trajectory.locator('.summary-cards')).toContainText('Lifetime Income');
  });

  test('should allow year selection', async ({ page }) => {
    const trajectory = await createProfileViaQuickStart(page, { salary: '80000' });
    const yearDetail = trajectory.locator('.year-detail');
    await expect(yearDetail).toContainText('Select a year');

    // Pick a year from the year-by-year table
    await trajectory.getByRole('button', { name: 'Show Table' }).click();
    const rows = trajectory.locator('.trajectory-table tbody tr');
    await expect(rows.first()).toBeVisible();
    const row = rows.nth(5);
    const selectedYear = await row.getAttribute('data-year');
    expect(selectedYear).toMatch(/^\d{4}$/);
    await row.click();

    await expect(yearDetail.getByRole('heading', { name: `Year ${selectedYear}` })).toBeVisible();

    // Closing the detail returns to the prompt
    await yearDetail.getByRole('button', { name: 'Close' }).click();
    await expect(yearDetail).toContainText('Select a year');

    // Clicking a point on the chart line also selects that year. Hovering shows
    // a marker on the nearest point; click right on it.
    await trajectory.locator('.timeline-chart__overlay').hover();
    const marker = trajectory.locator('.timeline-chart__highlight');
    await expect(marker).toBeVisible();
    const markerBox = await marker.boundingBox();
    expect(markerBox).not.toBeNull();
    await page.mouse.click(markerBox!.x + markerBox!.width / 2, markerBox!.y + markerBox!.height / 2);
    await expect(yearDetail.getByRole('heading', { name: /^Year \d{4}$/ })).toBeVisible();
  });

  test('should show milestones', async ({ page }) => {
    const trajectory = await createProfileViaQuickStart(page, { salary: '80000' });

    await expect(trajectory.getByRole('heading', { name: 'Key Milestones' })).toBeVisible();
    const milestones = trajectory.locator('.milestone-list');
    await expect(milestones).toBeVisible();

    // Quick start always adds a retirement goal, so its outcome is a milestone
    const retirement = milestones
      .locator('.milestone-list__item')
      .filter({ hasText: /Retirement (achieved|missed)/ });
    await expect(retirement).toHaveCount(1);

    // Clicking a milestone shows that year's details
    const year = await retirement.getAttribute('data-year');
    await retirement.click();
    await expect(
      trajectory.locator('.year-detail').getByRole('heading', { name: `Year ${year}` })
    ).toBeVisible();
  });

  test('should navigate to optimizations', async ({ page }) => {
    const trajectory = await createProfileViaQuickStart(page, { salary: '80000' });

    await trajectory.getByRole('button', { name: 'Optimizations' }).click();

    const optimizations = page.locator('.optimizations-view');
    await expect(optimizations).toBeVisible();
    await expect(page.locator('.trajectory-view')).toHaveCount(0);

    await optimizations.getByRole('button', { name: 'Back to Timeline' }).click();
    await expect(page.locator('.trajectory-view')).toBeVisible();
  });

  test('should navigate to compare scenarios', async ({ page }) => {
    const trajectory = await createProfileViaQuickStart(page, { salary: '80000' });

    await trajectory.getByRole('button', { name: 'Compare Scenarios' }).click();

    const scenarios = page.locator('.scenario-manager');
    await expect(scenarios).toBeVisible();
    await expect(scenarios.getByRole('heading', { level: 1 })).toHaveText('What-If Scenarios');
    await expect(page.locator('.trajectory-view')).toHaveCount(0);
  });
});

test.describe('Trajectory View - Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display correctly on mobile', async ({ page }) => {
    const trajectory = await createProfileViaQuickStart(page, { salary: '80000' });

    // Chart is visible and fits the screen
    const chart = trajectory.locator('.timeline-chart svg.timeline-chart__svg');
    await expect(chart).toBeVisible();
    const chartBox = await chart.boundingBox();
    expect(chartBox).not.toBeNull();
    expect(chartBox!.width).toBeLessThanOrEqual(375);

    // Summary cards fit within the viewport width
    const cards = trajectory.locator('.summary-cards');
    await expect(cards).toBeVisible();
    const cardsBox = await cards.boundingBox();
    expect(cardsBox).not.toBeNull();
    expect(cardsBox!.width).toBeLessThan(400);

    // Nothing overflows horizontally
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
