// @vitest-environment node

import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import viteConfig from '../../vite.config.ts';
import vitestConfig from '../../vitest.config.ts';

const expectedAliasTargets = {
  '@king-card/shared': fileURLToPath(
    new URL('../../../shared/src/index.ts', import.meta.url),
  ),
  '@king-card/core': fileURLToPath(
    new URL('../../../core/src/index.ts', import.meta.url),
  ),
};

const expectedAllowedDirs = [
  fileURLToPath(new URL('../../../shared/src', import.meta.url)),
  fileURLToPath(new URL('../../../core/src', import.meta.url)),
];

function getAliasMap(aliasConfig: unknown): Map<string, string> {
  if (!Array.isArray(aliasConfig)) {
    return new Map();
  }

  return new Map(
    aliasConfig
      .filter(
        (entry): entry is { find: string; replacement: string } =>
          typeof entry === 'object' &&
          entry !== null &&
          'find' in entry &&
          'replacement' in entry &&
          typeof entry.find === 'string' &&
          typeof entry.replacement === 'string',
      )
      .map((entry) => [entry.find, entry.replacement]),
  );
}

describe('workspace alias configuration', () => {
  it('resolves shared workspace packages to source entries in vite and vitest', () => {
    const viteAliases = getAliasMap(viteConfig.resolve?.alias);
    const vitestAliases = getAliasMap(vitestConfig.resolve?.alias);

    expect(Object.fromEntries(viteAliases)).toMatchObject(expectedAliasTargets);
    expect(Object.fromEntries(vitestAliases)).toMatchObject(expectedAliasTargets);
  });

  it('allows vite dev server access to aliased workspace source directories', () => {
    const allowedDirs = viteConfig.server?.fs?.allow ?? [];

    expect(allowedDirs).toEqual(expect.arrayContaining(expectedAllowedDirs));
  });
});