import { resolve } from 'node:path';
import { build as esbuild } from 'esbuild';
import { defineConfig, type Plugin } from 'vitest/config';
import dts from 'vite-plugin-dts';
import { THIRD_PARTY_NOTICE } from './src/build/notices';

const CLIENT_MODULE_ID = 'virtual:mapre-client';
const RESOLVED_CLIENT_MODULE_ID = `\0${CLIENT_MODULE_ID}`;

/**
 * Bundles the browser client (parser + renderer) with esbuild and exposes it as
 * a string via the `virtual:mapre-client` module, so it is inlined into the
 * built entry point. This keeps `@mapre/runtime` self-contained: consumers that
 * bundle it (the CLI, a web app) get the client without any sibling asset. In
 * test runs the client is not needed, so an empty string is returned to avoid
 * the extra bundling step.
 */
function mapreClient(): Plugin {
  return {
    name: 'mapre-client',
    resolveId(id) {
      if (id === CLIENT_MODULE_ID) {
        return RESOLVED_CLIENT_MODULE_ID;
      }
      return null;
    },
    async load(id) {
      if (id !== RESOLVED_CLIENT_MODULE_ID) {
        return null;
      }
      if (process.env.VITEST) {
        return 'export default "";';
      }
      const result = await esbuild({
        entryPoints: [resolve(__dirname, 'src/browser/index.ts')],
        bundle: true,
        format: 'iife',
        minify: true,
        write: false,
      });
      return `export default ${JSON.stringify(result.outputFiles[0].text)};`;
    },
  };
}

export default defineConfig({
  plugins: [mapreClient(), dts({ rollupTypes: true, include: ['src'] })],
  // Vite strips comments when minifying; `eof` collects the license banner and
  // any bundled legal comments at the end of the file instead.
  esbuild: { legalComments: 'eof' },
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
      output: {
        // The inlined browser client carries marked and Prism, so the bundle
        // must ship their notices.
        banner: `/*!\n${THIRD_PARTY_NOTICE}\n*/`,
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
