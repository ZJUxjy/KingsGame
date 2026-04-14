import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@king-card/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@king-card/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
