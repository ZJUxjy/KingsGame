import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {
  workspaceAliasEntries,
  workspaceSourceDirectories,
} from './workspaceAliases';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: '.',
  resolve: {
    alias: workspaceAliasEntries,
  },
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), ...workspaceSourceDirectories],
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
