import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'mapre',
    },
    rollupOptions: {
      // Bundle everything (workspace packages + their deps) into a single,
      // self-contained file so the CLI can be handed over as one artifact.
      // Only Node built-ins stay external; they ship with the Node runtime.
      external: [/^node:/],
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
