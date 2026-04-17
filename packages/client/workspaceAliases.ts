import { fileURLToPath } from 'node:url';
import type { Alias } from 'vite';

export const workspaceAliasTargets = {
  '@king-card/shared': fileURLToPath(
    new URL('../shared/src/index.ts', import.meta.url),
  ),
  '@king-card/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
} as const;

export const workspaceAliasEntries: Alias[] = Object.entries(
  workspaceAliasTargets,
).map(([find, replacement]) => ({ find, replacement }));

export const workspaceSourceDirectories = [
  fileURLToPath(new URL('../shared/src', import.meta.url)),
  fileURLToPath(new URL('../core/src', import.meta.url)),
];