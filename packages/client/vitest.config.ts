import { defineConfig } from 'vitest/config';
import { createWorkspaceAliasEntries } from '../../workspacePackageResolution';

const clientWorkspacePackages = ['@king-card/shared', '@king-card/core'] as const;

export default defineConfig({
  resolve: {
    alias: createWorkspaceAliasEntries(clientWorkspacePackages),
  },
  test: {
    environment: 'jsdom',
  },
});