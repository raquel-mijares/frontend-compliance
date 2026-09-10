import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  server: {
    port: 4173,
    strictPort: true,
    fs: { allow: ['..'] },
  },
});
