import { defineConfig } from 'vite';

const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  root: '.',
  publicDir: 'public',
  server: {
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
