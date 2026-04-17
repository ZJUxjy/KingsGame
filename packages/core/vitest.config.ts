import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { createWorkspaceAliasEntries } from '../../workspacePackageResolution';

const coreWorkspacePackages = ['@king-card/shared'] as const;

export default defineConfig({
  resolve: {
    alias: [
      { find: '../../../src', replacement: resolve(__dirname, 'src') },
      ...createWorkspaceAliasEntries(coreWorkspacePackages),
    ],
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
});
