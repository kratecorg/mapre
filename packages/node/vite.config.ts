import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts'],
      entryRoot: resolve(__dirname, 'src'),
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Node builtins and the core package stay external.
      external: [/^node:/, '@mapre/core'],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Resolve the core package from source during tests so no build is required.
    alias: {
      '@mapre/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
