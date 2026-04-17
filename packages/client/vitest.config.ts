import { defineConfig } from 'vitest/config';
import { workspaceAliasEntries } from './workspaceAliases';

export default defineConfig({
  resolve: {
    alias: workspaceAliasEntries,
  },
  test: {
    environment: 'jsdom',
  },
});