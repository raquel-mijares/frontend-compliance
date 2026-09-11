import { test, expect } from '@playwright/test';
import { isTracker } from './third-party-hosts';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';

test.describe('kids context', () => {
  test('loads no third-party tags even after accepting', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (req) => {
      if (isTracker(req.url())) hits.push(req.url());
    });

    await page.goto(`${BASE}/?audience=kids`);
    await page.getByRole('button', { name: /accept/i }).click();
    await page.waitForLoadState('networkidle');

    expect(hits, `third-party requests in kids context:\n${hits.join('\n')}`).toEqual([]);
  });

  test('the same consent does load tags in the general context', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (req) => {
      if (isTracker(req.url())) hits.push(req.url());
    });

    await page.goto(BASE);
    await page.getByRole('button', { name: /accept/i }).click();
    await page.waitForLoadState('networkidle');

    expect(hits.length).toBeGreaterThan(0);
  });
});
