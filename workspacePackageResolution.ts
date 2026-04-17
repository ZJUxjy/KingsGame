import { fileURLToPath } from 'node:url';

export const workspacePackageRelativeEntryPaths = {
  '@king-card/shared': 'packages/shared/src/index.ts',
  '@king-card/core': 'packages/core/src/index.ts',
} as const;

export const workspacePackageRelativeSourceDirectories = {
  '@king-card/shared': 'packages/shared/src',
  '@king-card/core': 'packages/core/src',
} as const;

export type WorkspacePackageName = keyof typeof workspacePackageRelativeEntryPaths;

export const workspacePackageNames = Object.keys(
  workspacePackageRelativeEntryPaths,
) as WorkspacePackageName[];

function resolveWorkspacePath(relativePath: string): string {
  return fileURLToPath(new URL(`./${relativePath}`, import.meta.url));
}

export const workspacePackageEntryPaths = Object.fromEntries(
  Object.entries(workspacePackageRelativeEntryPaths).map(([packageName, relativePath]) => [
    packageName,
    resolveWorkspacePath(relativePath),
  ]),
) as Record<WorkspacePackageName, string>;

export const workspacePackageSourceDirectories = Object.fromEntries(
  Object.entries(workspacePackageRelativeSourceDirectories).map(
    ([packageName, relativePath]) => [packageName, resolveWorkspacePath(relativePath)],
  ),
) as Record<WorkspacePackageName, string>;

export function createWorkspaceAliasEntries(
  packageNames: readonly WorkspacePackageName[] = workspacePackageNames,
) {
  return packageNames.map((packageName) => ({
    find: packageName,
    replacement: workspacePackageEntryPaths[packageName],
  }));
}

export function getWorkspaceSourceDirectories(
  packageNames: readonly WorkspacePackageName[] = workspacePackageNames,
) {
  return packageNames.map(
    (packageName) => workspacePackageSourceDirectories[packageName],
  );
}