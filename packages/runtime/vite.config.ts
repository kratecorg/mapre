import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ rollupTypes: true, include: ['src'] })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Keep the core package and Node built-ins external; the browser client is
      // bundled separately by esbuild.
      external: ['@mapre/core', /^node:.*/],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
