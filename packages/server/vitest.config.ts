import { defineConfig } from 'vitest/config';
import { createWorkspaceAliasEntries } from '../../workspacePackageResolution';

const serverWorkspacePackages = ['@king-card/shared', '@king-card/core'] as const;

export default defineConfig({
  resolve: {
    alias: createWorkspaceAliasEntries(serverWorkspacePackages),
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
