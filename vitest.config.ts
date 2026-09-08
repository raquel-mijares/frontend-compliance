import { defineConfig } from 'vitest/config';

// Los *.spec.ts son de Playwright y necesitan navegador y servidor.
// Vitest solo corre los *.test.ts.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
