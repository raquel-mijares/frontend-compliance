import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;
const PHONE = /(?:\+?\d[\s.-]?){9,}/;

test('no manda PII a terceros en el flujo de registro', async ({ page }) => {
  const leaks: { url: string; where: string }[] = [];

  page.on('request', (req) => {
    const url = req.url();
    if (new URL(url).hostname === new URL(BASE).hostname) return;

    if (EMAIL.test(url) || PHONE.test(url)) leaks.push({ url, where: 'url' });

    const body = req.postData();
    if (body && EMAIL.test(body)) leaks.push({ url, where: 'body' });
  });

  await page.goto(BASE);
  await page.getByRole('button', { name: /aceptar|accept/i }).click();

  await page.getByLabel(/email/i).fill('ana@example.com');
  await page.getByLabel(/tel|phone/i).fill('+1 403 555 0142');
  await page.getByRole('button', { name: /registr|sign ?up/i }).click();
  await page.waitForLoadState('networkidle');

  expect(
    leaks,
    `PII saliendo hacia terceros:\n${leaks.map((l) => `[${l.where}] ${l.url}`).join('\n')}`,
  ).toEqual([]);
});

test('la URL no lleva identificadores', async ({ page }) => {
  await page.goto(BASE);
  await page.getByLabel(/email/i).fill('ana@example.com');
  await page.getByRole('button', { name: /registr|sign ?up/i }).click();
  await page.waitForURL(/.*/);

  expect(page.url()).not.toMatch(EMAIL);
});
