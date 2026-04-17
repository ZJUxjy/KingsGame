import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {
  createWorkspaceAliasEntries,
  getWorkspaceSourceDirectories,
} from '../../workspacePackageResolution';

const clientWorkspacePackages = ['@king-card/shared', '@king-card/core'] as const;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: '.',
  resolve: {
    alias: createWorkspaceAliasEntries(clientWorkspacePackages),
  },
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        ...getWorkspaceSourceDirectories(clientWorkspacePackages),
      ],
    },
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
