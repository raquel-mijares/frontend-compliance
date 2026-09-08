import { test, expect } from '@playwright/test';
import { isTracker } from './third-party-hosts';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

/**
 * El test que convierte "cumplimos" en algo que falla en CI cuando deja de ser
 * verdad. Si alguien añade un <script> de un proveedor saltándose el TagLoader,
 * esto se pone rojo en el PR y no seis meses después en la auditoría.
 */
test.describe('gating de consentimiento', () => {
  test('no contacta con ningún tracker antes de decidir', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (req) => {
      if (isTracker(req.url())) hits.push(req.url());
    });

    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    expect(hits, `peticiones a terceros antes del consentimiento:\n${hits.join('\n')}`).toEqual([]);
  });

  test('no escribe cookies no esenciales antes de decidir', async ({ page, context }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const cookies = await context.cookies();
    const nonEssential = cookies.filter((c) => /^(_ga|_gid|_fbp|_fbc|_hj)/.test(c.name));

    expect(nonEssential.map((c) => c.name)).toEqual([]);
  });

  test('rechazar mantiene todo apagado', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (req) => {
      if (isTracker(req.url())) hits.push(req.url());
    });

    await page.goto(BASE);
    await page.getByRole('button', { name: /rechazar|reject/i }).click();
    await page.waitForLoadState('networkidle');

    expect(hits).toEqual([]);
  });

  test('aceptar sí carga la analítica', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (req) => {
      if (isTracker(req.url())) hits.push(req.url());
    });

    await page.goto(BASE);
    await page.getByRole('button', { name: /aceptar|accept/i }).click();
    await page.waitForLoadState('networkidle');

    // Verificar el caso positivo importa: un gate que bloquea siempre "pasa"
    // el test de arriba y rompe el producto sin que nadie se entere.
    expect(hits.length).toBeGreaterThan(0);
  });

  test('rechazar cuesta lo mismo que aceptar', async ({ page }) => {
    await page.goto(BASE);
    const accept = page.getByRole('button', { name: /aceptar|accept/i });
    const reject = page.getByRole('button', { name: /rechazar|reject/i });

    // Ambos visibles al primer nivel, sin abrir "preferencias".
    await expect(accept).toBeVisible();
    await expect(reject).toBeVisible();
  });
});
