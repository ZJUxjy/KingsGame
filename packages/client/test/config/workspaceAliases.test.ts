// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import viteConfig from '../../vite.config.ts';
import vitestConfig from '../../vitest.config.ts';
import coreVitestConfig from '../../../core/vitest.config.ts';
import serverVitestConfig from '../../../server/vitest.config.ts';
import {
  createWorkspaceAliasEntries,
  getWorkspaceSourceDirectories,
  workspacePackageRelativeEntryPaths,
} from '../../../../workspacePackageResolution.ts';

const clientWorkspacePackages = ['@king-card/shared', '@king-card/core'] as const;
const coreWorkspacePackages = ['@king-card/shared'] as const;
const serverWorkspacePackages = ['@king-card/shared', '@king-card/core'] as const;

const expectedAliasTargets = Object.fromEntries(
  createWorkspaceAliasEntries(clientWorkspacePackages).map(({ find, replacement }) => [
    find,
    replacement,
  ]),
);

const expectedAllowedDirs = getWorkspaceSourceDirectories(clientWorkspacePackages);

function readJson(relativePath: string) {
  return JSON.parse(
    readFileSync(new URL(relativePath, import.meta.url), 'utf8'),
  ) as {
    extends?: string;
    compilerOptions?: {
      baseUrl?: string;
      paths?: Record<string, string[]>;
      references?: Array<{ path: string }>;
    };
    references?: Array<{ path: string }>;
    scripts?: Record<string, string>;
  };
}

function getAliasMap(aliasConfig: unknown): Map<string, string> {
  if (
    typeof aliasConfig === 'object' &&
    aliasConfig !== null &&
    !Array.isArray(aliasConfig)
  ) {
    return new Map(
      Object.entries(aliasConfig).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  }

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
    const coreAliases = getAliasMap(coreVitestConfig.resolve?.alias);
    const serverAliases = getAliasMap(serverVitestConfig.resolve?.alias);

    expect(Object.fromEntries(viteAliases)).toMatchObject(expectedAliasTargets);
    expect(Object.fromEntries(vitestAliases)).toMatchObject(expectedAliasTargets);
    expect(Object.fromEntries(coreAliases)).toMatchObject(
      Object.fromEntries(
        createWorkspaceAliasEntries(coreWorkspacePackages).map(
          ({ find, replacement }) => [find, replacement],
        ),
      ),
    );
    expect(Object.fromEntries(serverAliases)).toMatchObject(
      Object.fromEntries(
        createWorkspaceAliasEntries(serverWorkspacePackages).map(
          ({ find, replacement }) => [find, replacement],
        ),
      ),
    );
  });

  it('allows vite dev server access to aliased workspace source directories', () => {
    const allowedDirs = viteConfig.server?.fs?.allow ?? [];

    expect(allowedDirs).toEqual(expect.arrayContaining(expectedAllowedDirs));
  });

  it('uses isolated package builds for fresh worktrees', () => {
    const clientTsconfig = readJson('../../tsconfig.json');
    const coreTsconfig = readJson('../../../core/tsconfig.json');
    const serverTsconfig = readJson('../../../server/tsconfig.json');
    const sharedTsconfig = readJson('../../../shared/tsconfig.json');
    const clientBuildTsconfig = readJson('../../tsconfig.build.json');
    const coreBuildTsconfig = readJson('../../../core/tsconfig.build.json');
    const serverBuildTsconfig = readJson('../../../server/tsconfig.build.json');
    const sharedBuildTsconfig = readJson('../../../shared/tsconfig.build.json');
    const clientPackageJson = readJson('../../package.json');
    const corePackageJson = readJson('../../../core/package.json');
    const serverPackageJson = readJson('../../../server/package.json');
    const sharedPackageJson = readJson('../../../shared/package.json');

    expect(clientTsconfig.references).toBeUndefined();
    expect(coreTsconfig.references).toBeUndefined();
    expect(serverTsconfig.references).toBeUndefined();
    expect(sharedTsconfig.references).toBeUndefined();

    expect(clientBuildTsconfig.extends).toBe('./tsconfig.json');
    expect(coreBuildTsconfig.extends).toBe('./tsconfig.json');
    expect(serverBuildTsconfig.extends).toBe('./tsconfig.json');
    expect(sharedBuildTsconfig.extends).toBe('./tsconfig.json');

    expect(clientBuildTsconfig.compilerOptions?.paths).toEqual({});
    expect(coreBuildTsconfig.compilerOptions?.paths).toEqual({});
    expect(serverBuildTsconfig.compilerOptions?.paths).toEqual({});
    expect(sharedBuildTsconfig.compilerOptions?.paths).toEqual({});

    expect(clientPackageJson.scripts?.build).toBe('tsc -p tsconfig.build.json && vite build');
    expect(corePackageJson.scripts?.build).toBe('tsc -p tsconfig.build.json');
    expect(serverPackageJson.scripts?.build).toBe('tsc -p tsconfig.build.json');
    expect(sharedPackageJson.scripts?.build).toBe('tsc -p tsconfig.build.json');
  });

  it('keeps the shared workspace resolution helper aligned with repository paths', () => {
    expect(workspacePackageRelativeEntryPaths).toEqual({
      '@king-card/shared': 'packages/shared/src/index.ts',
      '@king-card/core': 'packages/core/src/index.ts',
    });
    expect(expectedAliasTargets).toEqual({
      '@king-card/shared': fileURLToPath(
        new URL('../../../shared/src/index.ts', import.meta.url),
      ),
      '@king-card/core': fileURLToPath(
        new URL('../../../core/src/index.ts', import.meta.url),
      ),
    });
  });

  it('keeps tsconfig path aliases aligned with workspace package source entries', () => {
    const baseTsconfig = readJson('../../../../tsconfig.base.json');

    expect(baseTsconfig.compilerOptions?.baseUrl).toBe('.');
    expect(baseTsconfig.compilerOptions?.paths).toEqual(
      Object.fromEntries(
        Object.entries(workspacePackageRelativeEntryPaths).map(
          ([packageName, relativePath]) => [packageName, [relativePath]],
        ),
      ),
    );
  });

  it('does not keep a duplicate client-only workspace alias helper', () => {
    expect(existsSync(new URL('../../workspaceAliases.ts', import.meta.url))).toBe(
      false,
    );
  });
});