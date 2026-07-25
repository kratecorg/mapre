import { existsSync, readFileSync, statSync, watch, type FSWatcher } from 'node:fs';
import { createServer, type ServerResponse } from 'node:http';
import { extname, isAbsolute, resolve, sep } from 'node:path';
import { resolveDeckStylesheetPath } from '@mapre/node';
import { buildPresentation, resolveProjectDirs, type BuildPresentationOptions } from './build';

const DEFAULT_HOST = '127.0.0.1';
const REBUILD_DEBOUNCE_MS = 100;
const RESOURCES_PREFIX = '/resources/';

/**
 * Content types for the static assets the dev server serves from `resources/`.
 * Anything unknown falls back to a generic binary type.
 */
const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
};
const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

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
 * rebuilds it whenever the slides or the deck's stylesheet change. Static assets
 * under `resources/` are served from the project folder so that
 * document-relative image paths (e.g. `resources/photo.jpg`) resolve the same
 * way they do in a production build. The page is not auto-reloaded; the browser
 * is refreshed manually after a rebuild.
 *
 * The server reads the output file on every request, so a reload always serves
 * the latest build. The initial build is the caller's responsibility (so build
 * errors can fail fast); this function only serves and watches.
 */
export function startDevServer(options: DevServerOptions, reporter: DevReporter): DevServerHandle {
  const cwd = options.cwd ?? process.cwd();
  const { slidesDir, styleDir, resourcesDir } = resolveProjectDirs(cwd, options);
  const outFile = resolvePath(cwd, options.outFile);

  const server = createServer((request, response) => {
    if (request.method !== 'GET') {
      response.writeHead(405).end();
      return;
    }

    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    if (pathname.startsWith(RESOURCES_PREFIX)) {
      serveResource(resourcesDir, pathname, response);
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
 * Serves a file from the project's `resources/` folder in response to a
 * `/resources/...` request. The requested path is resolved inside the folder
 * and rejected if it escapes it (path traversal), so only intended assets are
 * exposed. Missing files return 404.
 */
function serveResource(resourcesDir: string, pathname: string, response: ServerResponse): void {
  const relativePath = pathname.slice(RESOURCES_PREFIX.length);
  const filePath = resolve(resourcesDir, relativePath);

  if (filePath !== resourcesDir && !filePath.startsWith(resourcesDir + sep)) {
    response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }).end('Forbidden');
    return;
  }

  try {
    if (statSync(filePath).isDirectory()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    const contentType = CONTENT_TYPES[extname(filePath).toLowerCase()] ?? DEFAULT_CONTENT_TYPE;
    response.writeHead(200, { 'content-type': contentType }).end(readFileSync(filePath));
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
  }
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
