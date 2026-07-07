import { existsSync, readFileSync, watch, type FSWatcher } from 'node:fs';
import { createServer } from 'node:http';
import { isAbsolute, join, resolve } from 'node:path';
import { resolveDeckStylesheetPath } from '@mapre/node';
import { buildPresentation, type BuildPresentationOptions } from './build';

const DEFAULT_HOST = '127.0.0.1';
const REBUILD_DEBOUNCE_MS = 100;

/**
 * Options for {@link startDevServer}. Extends the build options with the port to
 * listen on.
 */
export interface DevServerOptions extends BuildPresentationOptions {
  /** Port to listen on. Use 0 for an ephemeral port (handy in tests). */
  port: number;
}

/**
 * A running dev server. `whenReady` resolves once the server is listening; the
 * URL reflects the actual bound port. `close` stops the server and watchers.
 */
export interface DevServerHandle {
  readonly whenReady: Promise<{ port: number; url: string }>;
  close(): Promise<void>;
}

/**
 * Minimal reporter so the dev server can log rebuilds without depending on the
 * CLI's io type.
 */
export interface DevReporter {
  log: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Starts a static dev server that serves the built single-file presentation and
 * rebuilds it whenever the slides or the deck's stylesheet change. The page is
 * not auto-reloaded; the browser is refreshed manually after a rebuild.
 *
 * The server reads the output file on every request, so a reload always serves
 * the latest build. The initial build is the caller's responsibility (so build
 * errors can fail fast); this function only serves and watches.
 */
export function startDevServer(options: DevServerOptions, reporter: DevReporter): DevServerHandle {
  const cwd = options.cwd ?? process.cwd();
  const projectDir = resolvePath(cwd, options.projectDir);
  const slidesDir = join(projectDir, 'slides');
  const styleDir = join(projectDir, 'style');
  const outFile = resolvePath(cwd, options.outFile);

  const server = createServer((request, response) => {
    if (request.method !== 'GET') {
      response.writeHead(405).end();
      return;
    }

    try {
      const html = readFileSync(outFile);
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(html);
    } catch {
      response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('Build missing');
    }
  });

  const watchers = watchSources(slidesDir, styleDir, () => rebuild(options, reporter));

  const whenReady = new Promise<{ port: number; url: string }>((resolvePromise) => {
    server.listen(options.port, DEFAULT_HOST, () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : options.port;
      resolvePromise({ port, url: `http://${DEFAULT_HOST}:${port}/` });
    });
  });

  async function close(): Promise<void> {
    for (const watcher of watchers) {
      watcher.close();
    }
    await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  }

  return { whenReady, close };
}

/**
 * Watches the slides directory (recursively) and the optional style directory,
 * plus the deck's legacy stylesheet if named outside them, invoking `onChange`
 * on any change. Returns the watchers so they can be closed.
 */
function watchSources(slidesDir: string, styleDir: string, onChange: () => void): FSWatcher[] {
  const trigger = debounce(onChange, REBUILD_DEBOUNCE_MS);
  const watchers: FSWatcher[] = [watch(slidesDir, { recursive: true }, trigger)];

  if (existsSync(styleDir)) {
    watchers.push(watch(styleDir, { recursive: true }, trigger));
  }

  const stylesheetPath = safeResolveStylesheetPath(slidesDir);
  if (
    stylesheetPath !== undefined &&
    !stylesheetPath.startsWith(slidesDir) &&
    !stylesheetPath.startsWith(styleDir)
  ) {
    watchers.push(watch(stylesheetPath, trigger));
  }

  return watchers;
}

/**
 * Resolves the stylesheet path without letting a parse error crash the initial
 * watch setup; the next rebuild will surface any real problem.
 */
function safeResolveStylesheetPath(slidesDir: string): string | undefined {
  try {
    return resolveDeckStylesheetPath(slidesDir);
  } catch {
    return undefined;
  }
}

function rebuild(options: BuildPresentationOptions, reporter: DevReporter): void {
  try {
    buildPresentation(options);
    reporter.log(`Rebuilt ${new Date().toLocaleTimeString()} \u2014 reload the page`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    reporter.error(`Rebuild failed: ${message}`);
  }
}

function debounce(callback: () => void, delayMs: number): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(callback, delayMs);
  };
}

function resolvePath(cwd: string, target: string): string {
  return isAbsolute(target) ? target : resolve(cwd, target);
}
