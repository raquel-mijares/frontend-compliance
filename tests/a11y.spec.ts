import { test, expect } from '@playwright/test';
import { isTracker } from './third-party-hosts';

test.describe('consent dialog accessibility', () => {
  test('is announced as a modal dialog with a name and description', async ({ page }) => {
    await page.goto('/');
    const banner = page.getByRole('dialog');

    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute('aria-modal', 'true');
    await expect(banner).toHaveAccessibleName('Cookies');
    await expect(banner).toHaveAccessibleDescription(/cookies for analytics/i);
  });

  test('moves focus into the dialog, starting on reject', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /reject/i })).toBeFocused();
  });

  test('keeps focus inside the dialog while it is open', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /accept/i })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /reject/i })).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: /accept/i })).toBeFocused();
  });

  test('can be rejected with the keyboard alone', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (req) => {
      if (isTracker(req.url())) hits.push(req.url());
    });

    await page.goto('/');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('#state')).toContainText('analytics=denied');
    expect(hits).toEqual([]);
  });

  test('dismissing with Escape does not count as consent', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (req) => {
      if (isTracker(req.url())) hits.push(req.url());
    });

    await page.goto('/');
    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('#state')).toContainText('analytics=unknown');
    expect(hits).toEqual([]);
  });

  test('returns focus to the settings button after a decision', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /cookie settings/i })).toBeFocused();
  });

  test('lets consent be withdrawn and asked again', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /accept/i }).click();
    await expect(page.locator('#state')).toContainText('analytics=granted');

    await page.getByRole('button', { name: /cookie settings/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#state')).toContainText('analytics=unknown');
  });
});
