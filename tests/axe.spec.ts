import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function scan(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  return violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
}

test.describe('axe WCAG 2.2 AA scan', () => {
  test('page with the consent dialog open', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test('page after rejecting', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /reject/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(await scan(page)).toEqual([]);
  });
});
