/**
 * The browser client (parser + renderer) bundled by esbuild and inlined into
 * this package at build time. See the `mapre-client` plugin in `vite.config.ts`.
 */
declare module 'virtual:mapre-client' {
  const clientScript: string;
  export default clientScript;
}
