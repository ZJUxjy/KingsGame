import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '../../../src': resolve(__dirname, 'src'),
      '@king-card/shared': fileURLToPath(
        new URL('../shared/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
});
