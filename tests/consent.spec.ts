import { test, expect } from '@playwright/test';
import { isTracker } from './third-party-hosts';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
test.describe('consent gating', () => {
  test('contacts no tracker before a decision', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (req) => {
      if (isTracker(req.url())) hits.push(req.url());
    });

    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    expect(hits, `third-party requests before consent:\n${hits.join('\n')}`).toEqual([]);
  });

  test('writes no non-essential cookies before a decision', async ({ page, context }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const cookies = await context.cookies();
    const nonEssential = cookies.filter((c) => /^(_ga|_gid|_fbp|_fbc|_hj)/.test(c.name));

    expect(nonEssential.map((c) => c.name)).toEqual([]);
  });

  test('rejecting keeps everything off', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (req) => {
      if (isTracker(req.url())) hits.push(req.url());
    });

    await page.goto(BASE);
    await page.getByRole('button', { name: /reject/i }).click();
    await page.waitForLoadState('networkidle');

    expect(hits).toEqual([]);
  });

  test('accepting does load analytics', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (req) => {
      if (isTracker(req.url())) hits.push(req.url());
    });

    await page.goto(BASE);
    await page.getByRole('button', { name: /accept/i }).click();
    await page.waitForLoadState('networkidle');

    expect(hits.length).toBeGreaterThan(0);
  });

  test('rejecting costs the same as accepting', async ({ page }) => {
    await page.goto(BASE);
    const accept = page.getByRole('button', { name: /accept/i });
    const reject = page.getByRole('button', { name: /reject/i });

    await expect(accept).toBeVisible();
    await expect(reject).toBeVisible();
  });
});
