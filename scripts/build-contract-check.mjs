import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('../', import.meta.url));
const packagesDir = join(rootDir, 'packages');

function run(command, args) {
  execFileSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
  });
}

function cleanBuildArtifacts() {
  for (const packageName of readdirSync(packagesDir)) {
    for (const artifactDir of ['dist', 'build']) {
      rmSync(join(packagesDir, packageName, artifactDir), {
        force: true,
        recursive: true,
      });
    }
  }
}

function assertArtifacts(expectedDirectories, unexpectedDirectories = []) {
  for (const relativePath of expectedDirectories) {
    if (!existsSync(join(rootDir, relativePath))) {
      throw new Error(`Expected build artifact was not created: ${relativePath}`);
    }
  }

  for (const relativePath of unexpectedDirectories) {
    if (existsSync(join(rootDir, relativePath))) {
      throw new Error(`Unexpected build artifact was created: ${relativePath}`);
    }
  }
}

cleanBuildArtifacts();
run('corepack', ['pnpm', '--filter', '@king-card/client', 'build']);
assertArtifacts(
  [
    'packages/shared/dist/index.js',
    'packages/core/dist/index.js',
    'packages/client/dist/index.html',
  ],
  ['packages/server/dist/index.js'],
);

cleanBuildArtifacts();
run('corepack', ['pnpm', '--filter', '@king-card/server', 'build']);
assertArtifacts(
  [
    'packages/shared/dist/index.js',
    'packages/core/dist/index.js',
    'packages/server/dist/index.js',
  ],
  ['packages/client/dist/index.html'],
);

cleanBuildArtifacts();
run('corepack', ['pnpm', '-r', 'run', 'build']);
assertArtifacts([
  'packages/shared/dist/index.js',
  'packages/core/dist/index.js',
  'packages/server/dist/index.js',
  'packages/client/dist/index.html',
]);