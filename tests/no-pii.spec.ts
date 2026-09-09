import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;
const PHONE = /(?:\+?\d[\s.-]?){9,}/;

test('sends no PII to third parties in the signup flow', async ({ page }) => {
  const leaks: { url: string; where: string }[] = [];

  page.on('request', (req) => {
    const url = req.url();
    if (new URL(url).hostname === new URL(BASE).hostname) return;

    if (EMAIL.test(url) || PHONE.test(url)) leaks.push({ url, where: 'url' });

    const body = req.postData();
    if (body && EMAIL.test(body)) leaks.push({ url, where: 'body' });
  });

  await page.goto(BASE);
  await page.getByRole('button', { name: /accept/i }).click();

  await page.getByLabel(/email/i).fill('ana@example.com');
  await page.getByLabel(/phone/i).fill('+1 403 555 0142');
  await page.getByRole('button', { name: /sign ?up/i }).click();
  await page.waitForLoadState('networkidle');

  expect(
    leaks,
    `PII leaving for third parties:\n${leaks.map((l) => `[${l.where}] ${l.url}`).join('\n')}`,
  ).toEqual([]);
});

test('the URL carries no identifiers', async ({ page }) => {
  await page.goto(BASE);
  await page.getByLabel(/email/i).fill('ana@example.com');
  await page.getByRole('button', { name: /sign ?up/i }).click();
  await page.waitForURL(/.*/);

  expect(page.url()).not.toMatch(EMAIL);
});
