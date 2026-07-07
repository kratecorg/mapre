import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Node builtins and the workspace packages stay external; they are
      // resolved from node_modules at runtime.
      external: [/^node:/, '@mapre/core', '@mapre/node', '@mapre/runtime'],
      output: {
        banner: '#!/usr/bin/env node',
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    alias: {
      '@mapre/core': resolve(__dirname, '../core/src/index.ts'),
      '@mapre/node': resolve(__dirname, '../node/src/index.ts'),
    },
  },
});
